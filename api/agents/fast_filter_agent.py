import json

from prompts.fast_filter_prompt import FAST_FILTER_SYSTEM_PROMPT
from utils.openai_client import vision_completion


def check_early_exit(image_base64: str, mime_type: str = "image/jpeg") -> dict | None:
    """1차 필터링: 딥페이크가 확실하면 즉시 Analysis payload 반환, 아니면 None (통과)."""
    try:
        raw = vision_completion(
            system_prompt=FAST_FILTER_SYSTEM_PROMPT,
            user_message="이 사진이 얼굴만 합성된 명백한 페이스 스왑(딥페이크) 사진입니까? JSON으로 답하세요.",
            image_base64=image_base64,
            model="gpt-4o-mini",
            json_mode=True,
            detail="low"  # API 비용과 속도를 위해 저해상도로 빠르게 스캔
        )
        result = json.loads(raw)
        
        # 확실한 딥페이크인 경우만 조기 종료 리포트 생성
        if result.get("is_deepfake_certain", False) and result.get("confidence", 0) >= 85:
            return {
                "ai_generation_probability": result["confidence"],
                "estimated_model": "FaceSwap / AI Post-processed",
                "is_deepfake": True,
                "key_evidences": [
                    "[고속 스캔 감지] " + result.get("reason", "얼굴과 배경/몸 간의 비정상적인 질감 차이 및 합성 흔적 발견")
                ],
                "counter_evidences": [],
                "recommended_action": "flag",
                "uncertainty_notes": "이 결과는 AI의 1차 고속 필터망을 통해 명백한 딥페이크로 분류되어 즉시 차단된 결과입니다."
            }
        
    except Exception:
        # 고속 필터링에 문제가 생기면 방해하지 않도록 None을 리턴하여 정규 파이프라인 진행
        pass
        
    return None
