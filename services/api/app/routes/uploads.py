from fastapi import APIRouter, UploadFile, File
from typing import Dict

router = APIRouter(prefix="/v1/uploads", tags=["uploads"])

@router.post("/image")
async def upload_image(file: UploadFile = File(...)) -> Dict[str, str]:
    # TODO: store file bytes = await file.read() to S3/Supabase and return public URL
    return {"file_url": f"https://files.example.com/{file.filename}"}
