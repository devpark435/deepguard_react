import base64
import mimetypes
from pathlib import Path

import requests
from PIL import Image
from PIL.ExifTags import TAGS
from rich.console import Console

_console = Console(stderr=True)

MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20MB
SUPPORTED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DOWNLOAD_TIMEOUT = 10


class ImageLoadError(Exception):
    pass


class UnsupportedFormatError(ImageLoadError):
    pass


class ImageTooLargeError(ImageLoadError):
    pass


def _mime_from_extension(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise UnsupportedFormatError(
            f"지원하지 않는 확장자입니다: '{ext}'. 지원 형식: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    mime, _ = mimetypes.guess_type(path)
    return mime or "image/jpeg"


def _load_local(path: str) -> dict:
    file_path = Path(path)

    mime_type = _mime_from_extension(path)  # 확장자 먼저 검증

    if not file_path.exists():
        raise ImageLoadError(f"파일을 찾을 수 없습니다: {path}")
    if not file_path.is_file():
        raise ImageLoadError(f"경로가 파일이 아닙니다: {path}")
    size_bytes = file_path.stat().st_size

    if size_bytes > MAX_SIZE_BYTES:
        raise ImageTooLargeError(
            f"파일 크기({size_bytes / 1024 / 1024:.1f}MB)가 20MB 제한을 초과했습니다."
        )

    data = file_path.read_bytes()
    return {
        "base64": base64.b64encode(data).decode(),
        "mime_type": mime_type,
        "source_type": "local",
        "size_bytes": size_bytes,
        "exif": extract_exif(data),
    }


def _load_url(url: str) -> dict:
    try:
        response = requests.get(url, timeout=DOWNLOAD_TIMEOUT, stream=True)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise ImageLoadError(f"URL 다운로드 타임아웃 ({DOWNLOAD_TIMEOUT}초 초과): {url}")
    except requests.exceptions.RequestException as e:
        raise ImageLoadError(f"URL 다운로드 실패: {e}")

    content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
    if content_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedFormatError(
            f"지원하지 않는 Content-Type입니다: '{content_type}'. 지원 형식: {', '.join(SUPPORTED_MIME_TYPES)}"
        )

    data = response.content
    size_bytes = len(data)

    if size_bytes > MAX_SIZE_BYTES:
        raise ImageTooLargeError(
            f"이미지 크기({size_bytes / 1024 / 1024:.1f}MB)가 20MB 제한을 초과했습니다."
        )

    return {
        "base64": base64.b64encode(data).decode(),
        "mime_type": content_type,
        "source_type": "url",
        "size_bytes": size_bytes,
        "exif": extract_exif(data),
    }


def extract_exif(data: bytes) -> dict:
    """이미지 바이트에서 EXIF 메타데이터를 추출한다. AI 생성 이미지는 대부분 EXIF가 없다."""
    try:
        from io import BytesIO
        img = Image.open(BytesIO(data))
        raw_exif = img._getexif()  # type: ignore[attr-defined]
        if not raw_exif:
            return {"has_exif": False, "camera_make": None, "camera_model": None, "datetime": None, "software": None}
        decoded = {TAGS.get(k, k): v for k, v in raw_exif.items()}
        return {
            "has_exif": True,
            "camera_make": decoded.get("Make"),
            "camera_model": decoded.get("Model"),
            "datetime": str(decoded.get("DateTime")) if decoded.get("DateTime") else None,
            "software": decoded.get("Software"),
        }
    except Exception:
        return {"has_exif": False, "camera_make": None, "camera_model": None, "datetime": None, "software": None}


def load_image_as_base64(source: str) -> dict:
    """로컬 파일 또는 URL 이미지를 base64로 로드한다."""
    if source.startswith("http://") or source.startswith("https://"):
        return _load_url(source)
    return _load_local(source)


if __name__ == "__main__":
    from rich.table import Table

    console = Console()

    def _print_result(label: str, result: dict) -> None:
        table = Table(title=label, show_header=False, border_style="cyan")
        table.add_column("항목", style="bold")
        table.add_column("값")
        table.add_row("source_type", result["source_type"])
        table.add_row("mime_type", result["mime_type"])
        table.add_row("size_bytes", f"{result['size_bytes']:,} bytes")
        table.add_row("base64 (앞 40자)", result["base64"][:40] + "...")
        console.print(table)

    # 테스트 1: URL 이미지
    console.print("\n[bold cyan][ 테스트 1 ] URL 이미지 로드[/bold cyan]")
    url_result = load_image_as_base64("https://picsum.photos/seed/deepguard/200/200.jpg")
    _print_result("URL 이미지", url_result)

    # 테스트 2: 잘못된 확장자
    console.print("\n[bold cyan][ 테스트 2 ] 잘못된 확장자 예외[/bold cyan]")
    try:
        load_image_as_base64("test.gif")
    except UnsupportedFormatError as e:
        console.print(f"[green]✓ UnsupportedFormatError:[/green] {e}")

    # 테스트 3: 존재하지 않는 로컬 파일
    console.print("\n[bold cyan][ 테스트 3 ] 존재하지 않는 파일 예외[/bold cyan]")
    try:
        load_image_as_base64("/tmp/nonexistent.jpg")
    except ImageLoadError as e:
        console.print(f"[green]✓ ImageLoadError:[/green] {e}")

    console.print("\n[bold green]✓ 모든 테스트 통과[/bold green]\n")
