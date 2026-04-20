import json
from urllib.parse import quote_plus

from prompts.rag_prompt import RAG_VISION_SYSTEM_PROMPT
from utils.openai_client import vision_completion, chat_completion


def _make_search_links(keywords: list[str], image_url: str | None) -> list[dict]:
    links = []
    query = " ".join(keywords[:3])
    encoded_query = quote_plus(query)

    if image_url:
        encoded_url = quote_plus(image_url)
        links.append({
            "engine": "Google Lens",
            "url": f"https://lens.google.com/uploadbyurl?url={encoded_url}",
            "description": "역이미지 검색 — 동일/유사 이미지를 인터넷에서 탐색",
        })
        links.append({
            "engine": "TinEye",
            "url": f"https://tineye.com/search?url={encoded_url}",
            "description": "역이미지 검색 전문 엔진 — 원본 업로드 날짜 및 출처 추적",
        })
        links.append({
            "engine": "Yandex 이미지",
            "url": f"https://yandex.com/images/search?url={encoded_url}&rpt=imageview",
            "description": "러시아 포함 광범위한 역이미지 검색 — 얼굴 탐색에 강점",
        })

    links.append({
        "engine": "Google 이미지",
        "url": f"https://www.google.com/search?q={encoded_query}&tbm=isch",
        "description": f'키워드 검색: "{query}"',
    })
    links.append({
        "engine": "DuckDuckGo 이미지",
        "url": f"https://duckduckgo.com/?q={encoded_query}&iax=images&ia=images",
        "description": f'키워드 검색: "{query}" (추적 없는 검색)',
    })

    return links


def search_origin(
    image_base64: str,
    mime_type: str,
    image_url: str | None,
    score: int,
    model: str,
) -> dict:
    """GPT-4o Vision으로 식별 특징을 추출하고 원본 탐색 링크를 생성한다."""

    raw = vision_completion(
        system_prompt=RAG_VISION_SYSTEM_PROMPT,
        user_message=(
            f"이 이미지는 AI 생성 확률 {score}%로 판정된 {model} 모델 추정 이미지입니다. "
            "원본 탐색에 도움이 될 식별 특징을 추출해주세요."
        ),
        image_base64=image_base64,
        json_mode=True,
        detail="high",
    )

    try:
        vision_data = json.loads(raw)
    except json.JSONDecodeError:
        vision_data = {
            "identifying_features": "특징 추출에 실패했습니다.",
            "keywords": [model, "AI generated image", "deepfake"],
            "search_strategy": "아래 검색 링크를 활용해 직접 탐색해주세요.",
        }

    keywords = vision_data.get("keywords", [model, "AI image"])
    search_links = _make_search_links(keywords, image_url)

    return {
        "identifying_features": vision_data.get("identifying_features", ""),
        "keywords": keywords,
        "search_links": search_links,
        "search_strategy": vision_data.get("search_strategy", ""),
    }
