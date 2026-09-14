from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import whisper
import tempfile
import os

app = FastAPI()

# Load Whisper model once at startup (choose 'base', 'small', 'medium', 'large', etc.)
# Use 'medium' or 'large' for better multilingual support
model = whisper.load_model("medium")


@app.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    # Save uploaded file to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    try:
        # Explicitly set language to Chinese for better accuracy
        result = model.transcribe(tmp_path, language="zh")
        text = result["text"]
    finally:
        os.remove(tmp_path)
    return JSONResponse({"text": text})
