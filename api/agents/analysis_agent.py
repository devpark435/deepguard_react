import json

from prompts.analysis_prompt import ANALYSIS_SYSTEM_PROMPT
from utils.openai_client import chat_completion


def _single_analyze(vision_result: dict, temperature: float) -> dict:
    user_message = (
        "아래는 이미지 시각 분석 결과입니다. 이를 바탕으로 AI 생성 여부를 종합 판정하세요.\n\n"
        + json.dumps(vision_result, ensure_ascii=False, indent=2)
    )
    raw = chat_completion(
        system_prompt=ANALYSIS_SYSTEM_PROMPT,
        user_message=user_message,
        json_mode=True,
        temperature=temperature,
    )
    result = json.loads(raw)
    prob = result.get("ai_generation_probability", 0)
    result["ai_generation_probability"] = max(0, min(100, int(prob)))
    return result


def analyze(vision_result: dict, ensemble: bool = True) -> dict:
    """Vision Agent 결과를 받아 AI 생성 확률과 추정 모델을 판정한다.

    ensemble=True면 temperature 0.1 / 0.5로 2회 호출 후 확률을 평균한다.
    """
    if not ensemble:
        return _single_analyze(vision_result, temperature=0.3)

    r1 = _single_analyze(vision_result, temperature=0.1)
    r2 = _single_analyze(vision_result, temperature=0.5)

    avg_prob = round((r1["ai_generation_probability"] + r2["ai_generation_probability"]) / 2)
    # 더 보수적인(높은) 확률의 결과를 베이스로 사용
    base = r1 if r1["ai_generation_probability"] >= r2["ai_generation_probability"] else r2
    base["ai_generation_probability"] = avg_prob
    base["ensemble_detail"] = {
        "run1_probability": r1["ai_generation_probability"],
        "run2_probability": r2["ai_generation_probability"],
        "averaged": avg_prob,
    }
    return base


if __name__ == "__main__":
    import time

    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table

    from agents.vision_agent import extract_features, REQUIRED_OBSERVATIONS
    from utils.image_loader import load_image_as_base64

    console = Console()

    image_path = "tests/test_samples/sample_ai_face.jpg"
    console.print(f"\n[bold cyan]분석 대상:[/bold cyan] {image_path}\n")

    # Vision
    console.print("[yellow]① Vision Agent 분석 중...[/yellow]")
    t0 = time.time()
    img = load_image_as_base64(image_path)
    vision_result = extract_features(img["base64"], img["mime_type"])
    vision_elapsed = time.time() - t0
    console.print(f"[dim]Vision 완료: {vision_elapsed:.1f}초[/dim]")

    # Analysis
    console.print("[yellow]② Analysis Agent 판정 중...[/yellow]")
    t1 = time.time()
    analysis_result = analyze(vision_result)
    analysis_elapsed = time.time() - t1
    console.print(f"[dim]Analysis 완료: {analysis_elapsed:.1f}초[/dim]\n")

    # Vision 요약 테이블
    STATUS_STYLE = {
        "detected": "[bold red]detected[/bold red]",
        "not_detected": "[green]not_detected[/green]",
        "not_applicable": "[dim]not_applicable[/dim]",
    }
    vtable = Table(title="① Vision 관찰 결과", border_style="blue", show_lines=True)
    vtable.add_column("항목", style="bold", width=24)
    vtable.add_column("status", width=16)
    vtable.add_column("conf", justify="right", width=6)
    vtable.add_column("detail")
    for key in REQUIRED_OBSERVATIONS:
        obs = vision_result["observations"][key]
        s = obs.get("status", "")
        vtable.add_row(key, STATUS_STYLE.get(s, s), f"{obs.get('confidence', 0):.2f}", obs.get("detail", ""))
    console.print(vtable)

    # Analysis 결과
    prob = analysis_result["ai_generation_probability"]
    prob_color = "red" if prob >= 70 else "yellow" if prob >= 40 else "green"
    action_color = {"safe": "green", "review": "yellow", "flag": "red"}

    console.print(Panel(
        f"[bold {prob_color}]AI 생성 확률: {prob}%[/bold {prob_color}]\n"
        f"추정 모델: [bold]{analysis_result.get('estimated_model', '-')}[/bold]\n"
        f"권장 조치: [{action_color.get(analysis_result.get('recommended_action',''), 'white')}]"
        f"{analysis_result.get('recommended_action', '-').upper()}[/{action_color.get(analysis_result.get('recommended_action',''), 'white')}]",
        title="② Analysis 판정 결과",
        border_style=prob_color,
    ))

    if analysis_result.get("key_evidences"):
        console.print("[bold red]근거 (AI 생성 가능성)[/bold red]")
        for ev in analysis_result["key_evidences"]:
            console.print(f"  • {ev}")

    if analysis_result.get("counter_evidences"):
        console.print("[bold green]반증 (실제 이미지 가능성)[/bold green]")
        for ev in analysis_result["counter_evidences"]:
            console.print(f"  • {ev}")

    if analysis_result.get("uncertainty_notes"):
        console.print(f"\n[dim]불확실성: {analysis_result['uncertainty_notes']}[/dim]")

    console.print(f"\n[dim]총 소요 시간: {vision_elapsed + analysis_elapsed:.1f}초[/dim]\n")
