import os
import sys
import base64
import uuid as uuid_lib
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from agents.vision_agent import extract_features
from agents.analysis_agent import analyze
from agents.rag_agent import search_origin
from utils.image_loader import load_image_as_base64, ImageLoadError, UnsupportedFormatError

app = FastAPI(title="DeepGuard AI 판독기 API")

_reports: dict[str, dict] = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DESC = {
    "Midjourney": "고해상도의 예술적 이미지를 생성하는 데 특화된 모델로, 매우 세밀하고 사실적인 이미지를 만들어냅니다.",
    "Stable Diffusion": "오픈소스 기반의 이미지 생성 모델로, 손가락 왜곡 및 배경 왜곡이 특징적으로 나타납니다.",
    "DALL-E": "OpenAI의 이미지 생성 모델로, 독특한 채도와 개념적 합성 방식이 특징입니다.",
    "GAN": "StyleGAN 계열 생성적 적대 신경망으로, 눈 반사광 오류와 배경 패턴 반복이 자주 발견됩니다.",
    "HeyGen": "얼굴 합성 및 딥페이크 생성 도구로, 얼굴-배경 경계의 조명 불일치가 특징입니다.",
    "Sora": "OpenAI의 영상 생성 모델로, 움직임 블러 흔적 및 시간적 불일치 아티팩트가 나타납니다.",
    "unknown": "복합 모델 사용 가능성이 있거나 단서가 불충분하여 특정 모델을 추정하기 어렵습니다.",
}

ACTION_TEXT = {
    "flag":   "AI 생성 이미지일 가능성이 높습니다. 사용 전 신중히 검토하세요.",
    "review": "AI 생성 가능성이 있습니다. 추가 검토를 권장합니다.",
    "safe":   "실제 이미지로 판단됩니다. 별도 조치가 필요하지 않습니다.",
}


def _build_response(analysis: dict) -> dict:
    score = analysis.get("ai_generation_probability", 0)
    model = analysis.get("estimated_model", "unknown")
    action_key = analysis.get("recommended_action", "review")

    clues = [{"type": "warning", "text": e} for e in analysis.get("key_evidences", [])]
    evidence = analysis.get("counter_evidences", [])

    verdict = (
        f"{score}%의 확률로 AI 생성 {'가능성이 높다고' if score >= 70 else '가능성이 있다고' if score >= 40 else '가능성이 낮다고'} 판단됩니다. "
        f"{model} 모델의 특징을 반영한 분석 결과입니다."
    )
    if analysis.get("uncertainty_notes"):
        verdict += f" {analysis['uncertainty_notes']}"

    return {
        "score": score,
        "model": model,
        "modelDesc": MODEL_DESC.get(model, MODEL_DESC["unknown"]),
        "isDeepfake": bool(analysis.get("is_deepfake", False)),
        "clues": clues,
        "evidence": evidence,
        "verdict": verdict,
        "action": ACTION_TEXT.get(action_key, ACTION_TEXT["review"]),
    }


@app.get("/")
def read_root():
    return {"status": "ok", "message": "DeepGuard Background API is running!"}


@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """파일 업로드로 이미지 분석"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기가 20MB를 초과합니다.")

    from utils.image_loader import extract_exif
    img = {
        "base64": base64.b64encode(content).decode(),
        "mime_type": file.content_type.split(";")[0],
        "exif": extract_exif(content),
    }

    try:
        vision = extract_features(img["base64"], img["mime_type"], exif=img["exif"])
        analysis = analyze(vision, ensemble=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")

    return _build_response(analysis)


class UrlRequest(BaseModel):
    url: str


class SearchOriginRequest(BaseModel):
    image_base64: str
    mime_type: str
    image_url: str | None = None
    score: int
    model: str


class ShareRequest(BaseModel):
    result: dict
    image_base64: str | None = None
    mime_type: str = "image/jpeg"
    image_url: str | None = None


@app.post("/api/analyze-url")
async def analyze_url(req: UrlRequest):
    """URL로 이미지 분석"""
    try:
        img = load_image_as_base64(req.url)
    except UnsupportedFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ImageLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        vision = extract_features(img["base64"], img["mime_type"], exif=img["exif"])
        analysis = analyze(vision, ensemble=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")

    return _build_response(analysis)


@app.post("/api/search-origin")
async def search_origin_endpoint(req: SearchOriginRequest):
    """AI 생성 의심 이미지의 원본 탐색 링크 및 전략 반환"""
    try:
        result = search_origin(
            image_base64=req.image_base64,
            mime_type=req.mime_type,
            image_url=req.image_url,
            score=req.score,
            model=req.model,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"원본 탐색 중 오류가 발생했습니다: {str(e)}")

    return result


@app.post("/api/share")
def create_share(req: ShareRequest):
    report_id = str(uuid_lib.uuid4())[:8]
    _reports[report_id] = {
        "result": req.result,
        "image_base64": req.image_base64,
        "mime_type": req.mime_type,
        "image_url": req.image_url,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"id": report_id}


@app.get("/api/report/{report_id}")
def get_report(report_id: str):
    report = _reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다.")
    return report
