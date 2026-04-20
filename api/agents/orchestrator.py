import json

from openai import APIConnectionError, APIStatusError
from rich.console import Console
from rich.spinner import Spinner

from agents.analysis_agent import analyze
from agents.input_validator import validate_input
from agents.report_agent import generate_report
from agents.vision_agent import extract_features
from prompts.orchestrator_prompt import ORCHESTRATOR_SYSTEM_PROMPT, ORCHESTRATOR_TOOLS
from utils.cli_ui import render_report
from utils.image_loader import ImageLoadError, UnsupportedFormatError, load_image_as_base64
from utils.openai_client import _get_client, _default_model_text

_console = Console()

MAX_HISTORY = 20  # 히스토리 최대 메시지 수 (system 제외)


class Orchestrator:
    def __init__(self) -> None:
        self._history: list[dict] = []
        self._last_vision: dict | None = None
        self._last_analysis: dict | None = None
        self._last_report: str | None = None

    # ── 내부 파이프라인 ────────────────────────────────────────────────────────

    def _run_pipeline(self, user_input: str) -> str:
        """입력 검증부터 리포트 생성까지 전체 파이프라인을 실행한다."""
        # 1. 입력 검증
        with _console.status("[yellow]입력 검증 중...[/yellow]", spinner="dots"):
            validation = validate_input(user_input)

        if validation.get("status") != "valid":
            error = validation.get("error", "분석할 수 없는 입력입니다.")
            return f"❌ {error}\n\n이미지 파일 경로(예: `./photo.jpg`) 또는 이미지 URL을 입력해 주세요."

        source = validation.get("source", user_input)

        # 2. 이미지 로드
        with _console.status("[yellow]이미지 로드 중...[/yellow]", spinner="dots"):
            try:
                img = load_image_as_base64(source)
            except UnsupportedFormatError as e:
                return f"❌ 지원하지 않는 형식입니다: {e}"
            except ImageLoadError as e:
                return f"❌ 이미지를 불러올 수 없습니다: {e}"

        _console.print(
            f"[dim]  이미지 로드 완료: {img['size_bytes']:,} bytes / {img['mime_type']}[/dim]"
        )

        # 3. Vision 분석
        exif = img.get("exif", {})
        has_exif = exif.get("has_exif", False)
        exif_hint = "EXIF 있음" if has_exif else "EXIF 없음 (AI 생성 가능성 참고)"
        _console.print(f"[dim]  메타데이터: {exif_hint}[/dim]")

        with _console.status("[yellow]시각 특징 분석 중... (Vision Agent)[/yellow]", spinner="dots"):
            self._last_vision = extract_features(img["base64"], img["mime_type"], exif=exif)

        _console.print("[dim]  시각 특징 추출 완료[/dim]")

        # 4. AI 판정 (앙상블)
        with _console.status("[yellow]AI 생성 여부 판정 중... (Analysis Agent × 2)[/yellow]", spinner="dots"):
            self._last_analysis = analyze(self._last_vision, ensemble=True)

        prob = self._last_analysis.get("ai_generation_probability", 0)
        _console.print(f"[dim]  판정 완료: AI 생성 확률 {prob}%[/dim]")

        # 5. 리포트 생성
        with _console.status("[yellow]리포트 작성 중... (Report Agent)[/yellow]", spinner="dots"):
            self._last_report = generate_report(self._last_analysis)

        _console.print()
        _console.rule("[bold cyan]분석 리포트[/bold cyan]")
        render_report(self._last_report)
        _console.rule()

        return "__REPORT_RENDERED__"  # 이미 출력했으므로 Orchestrator가 중복 출력하지 않도록

    def _explain_previous(self, question: str) -> str:
        """이전 분석 결과를 바탕으로 추가 질문에 답변한다."""
        if self._last_analysis is None:
            return "아직 분석된 이미지가 없습니다. 먼저 이미지 경로나 URL을 입력해 주세요."

        context = {
            "analysis": self._last_analysis,
            "report_summary": self._last_report[:500] if self._last_report else None,
        }
        from utils.openai_client import chat_completion

        return chat_completion(
            system_prompt=(
                "당신은 AI 이미지 판별 전문가입니다. "
                "아래 분석 결과를 바탕으로 사용자의 질문에 한국어로 친절하고 정확하게 답변하세요.\n\n"
                "분석 결과:\n" + json.dumps(context, ensure_ascii=False, indent=2)
            ),
            user_message=question,
            temperature=0.5,
        )

    # ── 도구 디스패처 ──────────────────────────────────────────────────────────

    def _dispatch_tool(self, name: str, args: dict) -> str:
        if name == "validate_and_analyze":
            return self._run_pipeline(args["user_input"])
        if name == "explain_previous":
            return self._explain_previous(args["question"])
        return f"알 수 없는 도구입니다: {name}"

    # ── 히스토리 관리 ──────────────────────────────────────────────────────────

    def _trim_history(self) -> None:
        if len(self._history) > MAX_HISTORY:
            self._history = self._history[-MAX_HISTORY:]

    # ── 공개 인터페이스 ────────────────────────────────────────────────────────

    def handle(self, user_input: str) -> str:
        """사용자 입력을 받아 적절한 처리 후 응답을 반환한다."""
        self._history.append({"role": "user", "content": user_input})
        self._trim_history()

        client = _get_client()
        messages = [{"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT}] + self._history

        try:
            response = client.chat.completions.create(
                model=_default_model_text(),
                messages=messages,
                tools=ORCHESTRATOR_TOOLS,
                tool_choice="auto",
                temperature=0.3,
            )
        except (APIStatusError, APIConnectionError) as e:
            return f"❌ API 오류가 발생했습니다: {e}"

        message = response.choices[0].message

        # 도구 호출 없음 → 직접 응답
        if not message.tool_calls:
            reply = message.content or ""
            self._history.append({"role": "assistant", "content": reply})
            return reply

        # 도구 호출 처리
        self._history.append(message)  # assistant 메시지 (tool_calls 포함)

        tool_results = []
        for tc in message.tool_calls:
            args = json.loads(tc.function.arguments)
            result = self._dispatch_tool(tc.function.name, args)
            tool_results.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })
            self._history.extend(tool_results)

        # 도구 결과가 이미 렌더링된 리포트면 후속 LLM 호출 생략
        if any(r["content"] == "__REPORT_RENDERED__" for r in tool_results):
            self._history.append({"role": "assistant", "content": "__REPORT_RENDERED__"})
            return "__REPORT_RENDERED__"

        # 도구 결과를 LLM에 전달해 최종 응답 생성
        messages2 = [{"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT}] + self._history
        try:
            response2 = client.chat.completions.create(
                model=_default_model_text(),
                messages=messages2,
                temperature=0.3,
            )
        except (APIStatusError, APIConnectionError) as e:
            return f"❌ API 오류가 발생했습니다: {e}"

        final_reply = response2.choices[0].message.content or ""
        self._history.append({"role": "assistant", "content": final_reply})
        return final_reply
