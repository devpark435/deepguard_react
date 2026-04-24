import os
import requests
from datetime import datetime

_VISION_API_KEY = os.environ.get("GOOGLE_CLOUD_API_KEY")
_VISION_URL = "https://vision.googleapis.com/v1/images:annotate"
_MONTHLY_LIMIT = 950  # 1,000 무료 한도에서 안전 버퍼 확보


def _redis():
    """index.py와 동일한 Redis 인스턴스를 환경변수에서 직접 초기화."""
    url = os.environ.get("KV_REST_API_URL")
    token = os.environ.get("KV_REST_API_TOKEN")
    if not url or not token:
        return None
    try:
        from upstash_redis import Redis
        return Redis(url=url, token=token)
    except Exception:
        return None


def _counter_key() -> str:
    return f"vision_api:{datetime.utcnow().strftime('%Y-%m')}"


def _get_count() -> int:
    r = _redis()
    if not r:
        return 0
    try:
        val = r.get(_counter_key())
        return int(val) if val else 0
    except Exception:
        return 0


def _increment_count():
    r = _redis()
    if not r:
        return
    try:
        key = _counter_key()
        r.incr(key)
        # 월이 바뀌면 키가 바뀌므로 TTL 35일 설정 (자동 정리)
        r.expire(key, 60 * 60 * 24 * 35)
    except Exception:
        pass


def web_detect(image_base64: str) -> dict | None:
    """
    Google Cloud Vision API Web Detection을 호출한다.
    월 950건 초과 또는 API 키 없으면 None 반환.

    반환 구조:
    {
        "full_matches": [{"url": str, "score": float}, ...],
        "partial_matches": [{"url": str, "score": float}, ...],
        "similar_images": [{"url": str}, ...],
        "pages": [{"url": str, "title": str}, ...],
        "entities": [{"description": str, "score": float}, ...],
        "monthly_usage": int,
    }
    """
    if not _VISION_API_KEY:
        return None

    count = _get_count()
    if count >= _MONTHLY_LIMIT:
        return None

    try:
        resp = requests.post(
            f"{_VISION_URL}?key={_VISION_API_KEY}",
            json={
                "requests": [{
                    "image": {"content": image_base64},
                    "features": [{"type": "WEB_DETECTION", "maxResults": 10}],
                }]
            },
            timeout=15,
        )
        resp.raise_for_status()
        _increment_count()

        detection = resp.json()["responses"][0].get("webDetection", {})

        return {
            "full_matches": [
                {"url": img["url"], "score": img.get("score", 0)}
                for img in detection.get("fullMatchingImages", [])
            ],
            "partial_matches": [
                {"url": img["url"], "score": img.get("score", 0)}
                for img in detection.get("partialMatchingImages", [])
            ],
            "similar_images": [
                {"url": img["url"]}
                for img in detection.get("visuallySimilarImages", [])
            ],
            "pages": [
                {"url": p["url"], "title": p.get("pageTitle", "")}
                for p in detection.get("pagesWithMatchingImages", [])
            ],
            "entities": [
                {"description": e["description"], "score": e.get("score", 0)}
                for e in detection.get("webEntities", [])
                if e.get("description")
            ],
            "monthly_usage": count + 1,
        }
    except Exception:
        return None
