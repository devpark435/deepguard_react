from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.text import Text

_console = Console()


def print_banner() -> None:
    title = Text("🔍 Deep-Guard CLI", style="bold cyan")
    subtitle = "AI 생성 이미지 판별 챗봇 — 이미지 경로 또는 URL을 입력하세요."
    _console.print(Panel(f"{title}\n[dim]{subtitle}[/dim]", border_style="cyan", padding=(1, 4)))


def render_report(markdown_str: str) -> None:
    """마크다운 리포트를 rich로 렌더링한다."""
    _console.print(Markdown(markdown_str))
