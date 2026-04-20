import json
import time

from prompts.vision_prompt import VISION_SYSTEM_PROMPT
from utils.openai_client import vision_completion

REQUIRED_OBSERVATIONS = [
    "hand_anomaly",
    "face_asymmetry",
    "teeth_anomaly",
    "eye_anomaly",
    "lighting_inconsistency",
    "reflection_error",
    "shadow_error",
    "background_distortion",
    "skin_texture",
    "text_distortion",
    "over_smoothing",
    "style_inconsistency",
]


def extract_features(
    image_base64: str,
    mime_type: str = "image/jpeg",
    exif: dict | None = None,
) -> dict:
    """이미지에서 AI 생성 판단용 시각적 특징을 추출한다."""
    user_message = "이미지를 분석하고 체크리스트 12개 항목을 모두 관찰하여 JSON으로 반환하세요."

    if exif:
        exif_note = (
            f"\n\n[EXIF 메타데이터]\n"
            f"- EXIF 존재 여부: {exif.get('has_exif')}\n"
            f"- 카메라 제조사: {exif.get('camera_make') or '없음'}\n"
            f"- 카메라 모델: {exif.get('camera_model') or '없음'}\n"
            f"- 촬영 일시: {exif.get('datetime') or '없음'}\n"
            f"- 소프트웨어: {exif.get('software') or '없음'}\n"
            f"참고: AI 생성 이미지는 일반적으로 EXIF가 없거나 소프트웨어 정보만 있습니다."
        )
        user_message += exif_note

    raw = vision_completion(
        system_prompt=VISION_SYSTEM_PROMPT,
        user_message=user_message,
        image_base64=image_base64,
        json_mode=True,
        detail="high",
    )
    result = json.loads(raw)

    # 누락 항목 보완 — API가 일부 항목을 빠뜨릴 경우 대비
    observations = result.setdefault("observations", {})
    for key in REQUIRED_OBSERVATIONS:
        observations.setdefault(key, {"status": "not_detected", "confidence": 0.0, "detail": "응답에서 누락됨"})

    return result


if __name__ == "__main__":
    import sys

    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table

    from utils.image_loader import load_image_as_base64

    console = Console()

    image_path = sys.argv[1] if len(sys.argv) > 1 else "tests/test_samples/sample_ai_face.jpg"
    console.print(f"\n[bold cyan]분석 대상:[/bold cyan] {image_path}")

    img = load_image_as_base64(image_path)
    console.print(f"[dim]이미지 크기: {img['size_bytes']:,} bytes / {img['mime_type']}[/dim]")

    console.print("[yellow]분석 중...[/yellow]")
    t0 = time.time()
    result = extract_features(img["base64"], img["mime_type"])
    elapsed = time.time() - t0

    # 이미지 설명
    console.print(Panel(
        f"[bold]{result.get('dominant_subject', '-')}[/bold]\n{result.get('image_description', '')}",
        title="이미지 설명",
        border_style="blue",
    ))

    # 12개 항목 테이블
    STATUS_STYLE = {
        "detected": "[bold red]detected[/bold red]",
        "not_detected": "[green]not_detected[/green]",
        "not_applicable": "[dim]not_applicable[/dim]",
    }

    table = Table(title="시각적 특징 분석 결과", border_style="cyan", show_lines=True)
    table.add_column("항목", style="bold", width=24)
    table.add_column("status", width=16)
    table.add_column("confidence", justify="right", width=10)
    table.add_column("detail")

    for key in REQUIRED_OBSERVATIONS:
        obs = result["observations"][key]
        status_raw = obs.get("status", "not_detected")
        status_str = STATUS_STYLE.get(status_raw, status_raw)
        confidence = obs.get("confidence", 0.0)
        detail = obs.get("detail", "")
        table.add_row(key, status_str, f"{confidence:.2f}", detail)

    console.print(table)
    console.print(f"\n[dim]응답 시간: {elapsed:.1f}초[/dim]\n")
