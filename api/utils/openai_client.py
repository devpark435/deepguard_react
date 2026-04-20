import os
from functools import lru_cache

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, OpenAI
from rich.console import Console

load_dotenv()

_console = Console(stderr=True)


@lru_cache(maxsize=1)
def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
    return OpenAI(api_key=api_key)


def _default_model_text() -> str:
    return os.getenv("MODEL_TEXT", "gpt-4o-mini")


def _default_model_vision() -> str:
    return os.getenv("MODEL_VISION", "gpt-4o")


def chat_completion(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    json_mode: bool = False,
    temperature: float = 0.3,
) -> str:
    """텍스트 기반 대화 호출. 응답 문자열 반환."""
    client = _get_client()
    resolved_model = model or _default_model_text()

    kwargs: dict = {
        "model": resolved_model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except APIStatusError as e:
        _console.print(f"[bold red]OpenAI API 오류[/bold red] ({e.status_code}): {e.message}")
        raise
    except APIConnectionError:
        _console.print("[bold red]네트워크 오류[/bold red]: OpenAI 서버에 연결할 수 없습니다.")
        raise


def vision_completion(
    system_prompt: str,
    user_message: str,
    image_base64: str,
    model: str | None = None,
    json_mode: bool = True,
    detail: str = "low",
) -> str:
    """이미지 분석 호출. base64 인코딩된 이미지를 data URL로 전송."""
    client = _get_client()
    resolved_model = model or _default_model_vision()

    image_url = f"data:image/jpeg;base64,{image_base64}"

    kwargs: dict = {
        "model": resolved_model,
        "temperature": 0.3,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url, "detail": detail},
                    },
                    {"type": "text", "text": user_message},
                ],
            },
        ],
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except APIStatusError as e:
        _console.print(f"[bold red]OpenAI API 오류[/bold red] ({e.status_code}): {e.message}")
        raise
    except APIConnectionError:
        _console.print("[bold red]네트워크 오류[/bold red]: OpenAI 서버에 연결할 수 없습니다.")
        raise
