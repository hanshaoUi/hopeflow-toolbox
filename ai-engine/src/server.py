from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Optional
from urllib.request import urlretrieve

import cv2
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image, ImageEnhance, ImageFilter


APP_VERSION = "1.0.0"
app = FastAPI(title="HopeFlow AI Engine", version=APP_VERSION)


class UpscaleRequest(BaseModel):
    input: str
    output: str
    scale: int = 2
    engine: str = "basic"
    grant: Optional[str] = ""
    feature: Optional[str] = "ai-enhance"
    site_base_url: Optional[str] = ""


class RemoveBgRequest(BaseModel):
    input: str
    output: str
    alpha_matting: bool = False
    grant: Optional[str] = ""
    feature: Optional[str] = "ai-enhance"
    site_base_url: Optional[str] = ""


class DenoiseRequest(BaseModel):
    input: str
    output: str
    level: str = "medium"
    grant: Optional[str] = ""
    feature: Optional[str] = "ai-enhance"
    site_base_url: Optional[str] = ""


def _ensure_parent(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def _open_rgba(path: str) -> Image.Image:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Input file does not exist: {path}")
    return Image.open(path).convert("RGBA")


def _save_png(image: Image.Image, output_path: str) -> None:
    _ensure_parent(output_path)
    image.save(output_path, "PNG")


def _response(output_path: str) -> dict:
    return {"success": True, "output": output_path}


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "device": "CPU",
        "version": APP_VERSION,
        "features": {
            "upscale": True,
            "realesrgan": _realesrgan_available(),
            "denoise": True,
            "remove_bg": _rembg_available(),
        },
    }


@app.post("/upscale")
def upscale(req: UpscaleRequest) -> dict:
    try:
        scale = 4 if int(req.scale) >= 4 else 2
        if (req.engine or "basic").lower() == "realesrgan":
            return _upscale_realesrgan(req.input, req.output, scale)

        image = _open_rgba(req.input)
        width, height = image.size
        resized = image.resize((width * scale, height * scale), Image.Resampling.LANCZOS)
        enhanced = resized.filter(ImageFilter.UnsharpMask(radius=1.2, percent=140, threshold=3))
        enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.08)
        _save_png(enhanced, req.output)
        return _response(req.output)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.post("/denoise")
def denoise(req: DenoiseRequest) -> dict:
    try:
        image = _open_rgba(req.input)
        rgba = np.array(image)
        rgb = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2BGR)

        strength_map = {
            "none": 0,
            "low": 4,
            "medium": 8,
            "high": 12,
        }
        strength = strength_map.get((req.level or "medium").lower(), 8)
        if strength > 0:
            rgb = cv2.fastNlMeansDenoisingColored(rgb, None, strength, strength, 7, 21)

        result_rgb = cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB)
        result = np.dstack([result_rgb, rgba[:, :, 3]])
        _save_png(Image.fromarray(result, "RGBA"), req.output)
        return _response(req.output)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.post("/remove_bg")
def remove_bg(req: RemoveBgRequest) -> dict:
    try:
        try:
            from rembg import remove
        except Exception:
            return {
                "success": False,
                "error": "rembg is not installed. Install optional rembg dependencies to use background removal.",
            }

        image = _open_rgba(req.input)
        result = remove(image, alpha_matting=bool(req.alpha_matting))
        if not isinstance(result, Image.Image):
            result = Image.open(result).convert("RGBA")
        _save_png(result.convert("RGBA"), req.output)
        return _response(req.output)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.post("/clear_cache")
def clear_cache() -> dict:
    return {"success": True}


@app.post("/shutdown")
def shutdown() -> dict:
    threading.Timer(0.2, lambda: os._exit(0)).start()
    return {"success": True}


def _rembg_available() -> bool:
    try:
        import rembg  # noqa: F401

        return True
    except Exception:
        return False


def _realesrgan_available() -> bool:
    try:
        _import_realesrgan()
        return True
    except Exception:
        return False


def _import_realesrgan():
    import sys
    import torchvision.transforms.functional as functional

    sys.modules.setdefault("torchvision.transforms.functional_tensor", functional)

    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer

    return RRDBNet, RealESRGANer


def _models_dir() -> Path:
    model_dir = Path.home() / ".hopeflow" / "ai-engine" / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    return model_dir


def _realesrgan_model_path() -> Path:
    model_path = _models_dir() / "RealESRGAN_x4plus.pth"
    if not model_path.exists():
        urlretrieve(
            "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
            model_path,
        )
    return model_path


def _upscale_realesrgan(input_path: str, output_path: str, scale: int) -> dict:
    try:
        RRDBNet, RealESRGANer = _import_realesrgan()
    except Exception as exc:
        return {
            "success": False,
            "error": f"Real-ESRGAN is not installed or failed to load: {exc}",
            "missing_optional_engine": "realesrgan",
        }

    try:
        import torch

        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )
        model_path = _realesrgan_model_path()
        use_cuda = torch.cuda.is_available()
        upsampler = RealESRGANer(
            scale=4,
            model_path=str(model_path),
            model=model,
            tile=0,
            tile_pad=10,
            pre_pad=0,
            half=use_cuda,
            device="cuda" if use_cuda else "cpu",
        )

        image = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise FileNotFoundError(f"Input file does not exist or cannot be read: {input_path}")

        output, _ = upsampler.enhance(image, outscale=scale)
        _ensure_parent(output_path)
        cv2.imwrite(output_path, output)
        return _response(output_path)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=18765, log_level="info")
