import json

from prompts.report_prompt import REPORT_SYSTEM_PROMPT
from utils.openai_client import chat_completion


def generate_report(analysis_result: dict) -> str:
    """Analysis 결과를 사용자 친화적 한국어 마크다운 리포트로 변환한다."""
    user_message = (
        "아래 판정 결과를 바탕으로 사용자 리포트를 작성하세요.\n\n"
        + json.dumps(analysis_result, ensure_ascii=False, indent=2)
    )

    return chat_completion(
        system_prompt=REPORT_SYSTEM_PROMPT,
        user_message=user_message,
        json_mode=False,
        temperature=0.7,
    )
