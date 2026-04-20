import json

from prompts.input_validator_prompt import INPUT_VALIDATOR_SYSTEM_PROMPT
from utils.openai_client import chat_completion


def validate_input(user_input: str) -> dict:
    """사용자 입력이 분석 가능한 이미지 경로/URL인지 판정한다."""
    raw = chat_completion(
        system_prompt=INPUT_VALIDATOR_SYSTEM_PROMPT,
        user_message=user_input,
        json_mode=True,
    )
    return json.loads(raw)


if __name__ == "__main__":
    from rich.console import Console
    from rich.table import Table

    console = Console()

    test_cases = [
        ("./test.jpg", "valid", "image"),
        ("https://example.com/pic.png", "valid", "url_image"),
        ("이 사진 진짜야?", "invalid", "unknown"),
        ("./doc.pdf", "invalid", "unknown"),
    ]

    table = Table(title="입력 검증 테스트", border_style="cyan")
    table.add_column("입력", style="bold")
    table.add_column("기대 status")
    table.add_column("실제 status")
    table.add_column("type")
    table.add_column("error")
    table.add_column("결과")

    all_pass = True
    for user_input, expected_status, expected_type in test_cases:
        result = validate_input(user_input)
        status = result.get("status", "")
        rtype = result.get("type", "")
        error = result.get("error") or "-"
        passed = status == expected_status
        if not passed:
            all_pass = False
        mark = "[green]✓[/green]" if passed else "[red]✗[/red]"
        table.add_row(user_input, expected_status, status, rtype, error, mark)

    console.print(table)
    if all_pass:
        console.print("\n[bold green]✓ 모든 테스트 통과[/bold green]\n")
    else:
        console.print("\n[bold red]✗ 일부 테스트 실패[/bold red]\n")
