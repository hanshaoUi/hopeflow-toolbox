from __future__ import annotations

import os
import json
import re
import threading
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.request import urlretrieve

import cv2
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageEnhance, ImageFilter


APP_VERSION = "1.0.0"
app = FastAPI(title="HopeFlow AI Engine", version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


class DataMergeRenderRequest(BaseModel):
    template: Dict[str, Any]
    headers: List[str]
    rows: List[List[str]]
    output: str
    csv_dir: Optional[str] = ""


if hasattr(DataMergeRenderRequest, "model_rebuild"):
    DataMergeRenderRequest.model_rebuild()


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
            "data_merge_pdf": True,
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


@app.post("/data_merge_pdf")
def data_merge_pdf(req: DataMergeRenderRequest) -> dict:
    try:
        output_path = render_data_merge_pdf(req)
        debug_path = f"{output_path}.debug.json"
        return {
            "success": True,
            "output": output_path,
            "pages": len(req.rows),
            "debug": debug_path if os.path.exists(debug_path) else "",
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


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


def render_data_merge_pdf(req: DataMergeRenderRequest) -> str:
    from pypdf import PdfReader, PdfWriter
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    from reportlab.pdfgen import canvas

    template = req.template
    background_path = template.get("backgroundPdf") or template.get("background_pdf")
    if not background_path or not os.path.exists(background_path):
        raise FileNotFoundError(f"Background PDF does not exist: {background_path}")

    # 前景 PDF（包含需要当动态内容上层的高层级静态元素）
    foreground_path: Optional[str] = template.get("foregroundPdf") or template.get("foreground_pdf")
    if foreground_path and not os.path.exists(foreground_path):
        foreground_path = None  # 前景文件不存在时降级为无前景

    page = template.get("page") or {}
    page_width = float(page.get("width") or 0)
    page_height = float(page.get("height") or 0)
    if page_width <= 0 or page_height <= 0:
        first_bg = PdfReader(background_path).pages[0]
        page_width = float(first_bg.mediabox.width)
        page_height = float(first_bg.mediabox.height)

    fields = template.get("fields") or []
    header_index = {name: idx for idx, name in enumerate(req.headers)}
    writer = PdfWriter()
    debug_entries = []

    for row_index, row in enumerate(req.rows):
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=(page_width, page_height))

        for field in fields:
            column = field.get("column", "")
            if not str(column).strip():
                continue
            col_idx = header_index.get(column)
            if col_idx is None or col_idx >= len(row):
                continue

            value = "" if row[col_idx] is None else str(row[col_idx])
            bounds = field.get("bounds") or {}
            left = float(bounds.get("left") or 0)
            top = float(bounds.get("top") or 0)
            right = float(bounds.get("right") or left)
            bottom = float(bounds.get("bottom") or top)
            width = max(1.0, right - left)
            height = max(1.0, bottom - top)

            if field.get("type") == "IMAGE":
                image_path = value
                if image_path and not os.path.exists(image_path) and req.csv_dir:
                    image_path = os.path.join(req.csv_dir, value)
                if image_path and os.path.exists(image_path):
                    c.drawImage(
                        image_path,
                        left,
                        page_height - bottom,
                        width=width,
                        height=height,
                        preserveAspectRatio=True,
                        anchor="c",
                        mask="auto",
                    )
                    if row_index == 0:
                        debug_entries.append(
                            {
                                "column": column,
                                "type": field.get("type"),
                                "target_name": field.get("targetName") or "",
                                "target_index": field.get("targetIndex"),
                                "sample": value,
                                "resolved_image_path": image_path,
                                "z_order": field.get("zOrder"),
                                "layer_name": field.get("layerName") or "",
                                "bounds": bounds,
                            }
                        )
                continue

            font_size = float(field.get("fontSize") or 12)
            color = field.get("color") or "#000000"
            try:
                c.setFillColor(HexColor(color))
            except Exception:
                c.setFillColor(HexColor("#000000"))
            font_hint = " ".join(
                str(field.get(key) or "") for key in ("fontName", "fontFamily", "fontStyle")
            )
            resolved_font = resolve_pdf_font(font_hint, value)
            c.setFont(resolved_font, font_size)
            if row_index == 0:
                debug_entries.append(
                    {
                        "column": column,
                        "type": field.get("type"),
                        "target_name": field.get("targetName") or "",
                        "target_index": field.get("targetIndex"),
                        "sample": value,
                        "ai_font_name": field.get("fontName") or "",
                        "ai_font_family": field.get("fontFamily") or "",
                        "ai_font_style": field.get("fontStyle") or "",
                        "font_hint": font_hint,
                        "resolved_pdf_font": resolved_font,
                        "resolved_font_file": _FONT_FILE_CACHE.get(resolved_font, ""),
                        "font_size": font_size,
                        "alignment": field.get("alignment") or "left",
                        "z_order": field.get("zOrder"),
                        "layer_name": field.get("layerName") or "",
                        "bounds": bounds,
                    }
                )

            y = page_height - top - font_size
            draw_aligned_text(c, value, resolved_font, font_size, left, right, y, field.get("alignment") or "left")

        c.save()
        packet.seek(0)
        overlay_reader = PdfReader(packet)
        # 每次循环都重新读取背景页，避免 merge_page() 就地修改共享对象
        fresh_bg_reader = PdfReader(background_path)
        page_copy = fresh_bg_reader.pages[0]
        page_copy.merge_page(overlay_reader.pages[0])

        # 如果有前景 PDF，在动态内容上方再叠加前景层
        if foreground_path:
            fresh_fg_reader = PdfReader(foreground_path)
            page_copy.merge_page(fresh_fg_reader.pages[0])

        writer.add_page(page_copy)

    _ensure_parent(req.output)
    with open(req.output, "wb") as fh:
        writer.write(fh)
    write_data_merge_debug(
        req.output,
        background_path,
        page_width,
        page_height,
        len(req.rows),
        debug_entries,
        template.get("debug") or {},
        foreground_path=foreground_path,
    )
    cleanup_background_pdf(background_path, foreground_path, req.output)
    return req.output


_FONT_CACHE: Dict[str, str] = {}
_FONT_FILE_CACHE: Dict[str, str] = {}
_SYSTEM_FONT_INDEX: Optional[List[Dict[str, Any]]] = None


def write_data_merge_debug(
    output_path: str,
    background_path: str,
    page_width: float,
    page_height: float,
    row_count: int,
    fields: List[Dict[str, Any]],
    template_debug: Dict[str, Any],
    foreground_path: Optional[str] = None,
) -> None:
    try:
        with open(f"{output_path}.debug.json", "w", encoding="utf-8") as fh:
            json.dump(
                {
                    "output": output_path,
                    "background": background_path,
                    "foreground": foreground_path or "",
                    "page": {"width": page_width, "height": page_height},
                    "rows": row_count,
                    "fields": fields,
                    "static_items": template_debug.get("staticItems") or [],
                    "min_dynamic_page_item_index": template_debug.get("minDynamicPageItemIndex"),
                    "foreground_count": template_debug.get("foregroundCount", 0),
                    "has_foreground": template_debug.get("hasForeground", False),
                    "notes": [
                        "Render order: background PDF → dynamic overlay → foreground PDF (if any).",
                        "Foreground items are static items with pageItems index < minDynamicPageItemIndex.",
                    ],
                },
                fh,
                ensure_ascii=False,
                indent=2,
            )
    except Exception:
        pass


def draw_aligned_text(c, value: str, font_name: str, font_size: float, left: float, right: float, y: float, alignment: str) -> None:
    alignment = (alignment or "left").lower()
    if alignment == "center":
        c.drawCentredString((left + right) / 2, y, value)
    elif alignment == "right":
        c.drawRightString(right, y, value)
    else:
        c.drawString(left, y, value)


def cleanup_background_pdf(background_path: str, foreground_path: Optional[str], output_path: str) -> None:
    try:
        bg = Path(background_path)
        out = Path(output_path)
        if bg.exists() and bg.resolve() != out.resolve() and bg.name.endswith("_background.pdf"):
            bg.unlink()
    except Exception:
        pass
    try:
        if foreground_path:
            fg = Path(foreground_path)
            if fg.exists() and fg.name.endswith("_foreground.pdf"):
                fg.unlink()
    except Exception:
        pass


def resolve_pdf_font(illustrator_font_name: str, sample_text: str = "") -> str:
    key = (illustrator_font_name or "") + "\n" + (sample_text or "")
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]

    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.cidfonts import UnicodeCIDFont
        from reportlab.pdfbase.ttfonts import TTFont
    except Exception:
        _FONT_CACHE[key] = "Helvetica"
        return "Helvetica"

    # illustrator_font_name 可能是纯 PostScript 名（如 "AlibabaPuHuiTiR"），
    # 也可能是用空格拼接的 hint（如 "AlibabaPuHuiTiR 阿里巴巴普惠体 Regular"）。
    # 拆分出纯英文 PostScript name 和完整 hint 分别尝试匹配。
    parts = illustrator_font_name.strip().split()
    # 第一个非空 token 通常是 PostScript name
    ps_name = parts[0] if parts else illustrator_font_name
    ps_normalized = normalize_font_name(ps_name)
    full_normalized = normalize_font_name(illustrator_font_name)

    needs_cjk = contains_cjk(sample_text) or contains_cjk(illustrator_font_name)
    font_dirs = get_font_dirs()

    # ① 思源黑体系列优先匹配
    is_sourcehan = any(token in full_normalized for token in (
        "sourcehan", "sourcehansans", "sourcehansanscn", "siyuan", "思源",
        "notosanscjk", "notosans"
    ))
    if is_sourcehan:
        sh_path = _find_sourcehan_font(full_normalized, font_dirs)
        if sh_path:
            registered_sh = register_pdf_font(sh_path)
            if registered_sh:
                _FONT_CACHE[key] = registered_sh
                return registered_sh

    # ② 用纯 PostScript name 做精确匹配（内部字体名表）
    exact_path = find_font_by_internal_names(ps_name)
    if exact_path:
        registered_exact = register_pdf_font(exact_path)
        if registered_exact:
            _FONT_CACHE[key] = registered_exact
            return registered_exact

    # ③ 用纯 PostScript name 做模糊匹配（文件名相似度）
    candidates = collect_font_files(font_dirs)
    best_path, best_score = find_best_font_path(ps_normalized, candidates)
    if best_path and best_score >= font_match_threshold(ps_normalized):
        if needs_cjk and not is_likely_cjk_font(best_path):
            pass  # 跳过非 CJK 字体
        else:
            registered_best = register_pdf_font(best_path)
            if registered_best:
                _FONT_CACHE[key] = registered_best
                return registered_best

    # ④ 如果 ps_name 没命中，用完整 hint 再试一次模糊匹配
    if full_normalized != ps_normalized:
        best_path2, best_score2 = find_best_font_path(full_normalized, candidates)
        if best_path2 and best_score2 >= font_match_threshold(full_normalized):
            if needs_cjk and not is_likely_cjk_font(best_path2):
                pass
            else:
                registered_best2 = register_pdf_font(best_path2)
                if registered_best2:
                    _FONT_CACHE[key] = registered_best2
                    return registered_best2

    # ⑤ 显式的 Windows CJK 字族 fallback
    if has_explicit_windows_cjk_family(full_normalized):
        preferred_names = preferred_windows_font_files(full_normalized)
        for font_dir in font_dirs:
            for preferred in preferred_names:
                preferred_path = font_dir / preferred
                if preferred_path.exists():
                    registered = register_pdf_font(preferred_path)
                    if registered:
                        _FONT_CACHE[key] = registered
                        return registered

    # ⑥ CJK 文本的通用 fallback
    if needs_cjk:
        preferred_names = preferred_windows_font_files(full_normalized)
        for font_dir in font_dirs:
            for preferred in preferred_names:
                preferred_path = font_dir / preferred
                if preferred_path.exists():
                    registered = register_pdf_font(preferred_path)
                    if registered:
                        _FONT_CACHE[key] = registered
                        return registered

    # ⑦ CID 字体 fallback
    for cid_font in ("STSong-Light", "HeiseiKakuGo-W5", "HeiseiMin-W3"):
        try:
            if cid_font not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(UnicodeCIDFont(cid_font))
            _FONT_CACHE[key] = cid_font
            return cid_font
        except Exception:
            continue

    _FONT_CACHE[key] = "Helvetica"
    return "Helvetica"


def register_pdf_font(path: Path) -> Optional[str]:
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    pdf_name = "HF_" + re.sub(r"[^A-Za-z0-9_]", "_", path.stem)[:80]
    try:
        if pdf_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(pdf_name, str(path)))
        _FONT_FILE_CACHE[pdf_name] = str(path)
        return pdf_name
    except Exception:
        return None


def get_font_dirs() -> List[Path]:
    return [
        Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts",
        Path.home() / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",
    ]


def collect_font_files(font_dirs: List[Path]) -> List[Path]:
    candidates: List[Path] = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.ttc"):
            candidates.extend(font_dir.glob(ext))
    return candidates


def find_font_by_internal_names(illustrator_font_name: str) -> Optional[Path]:
    target = normalize_font_name(illustrator_font_name)
    if not target:
        return None

    font_index = get_system_font_index()

    # 第 1 级：精确匹配
    for font_info in font_index:
        if target in font_info["exact_names"]:
            return font_info["path"]

    # 第 2 级：去掉 "regular"/"normal" 后精确匹配
    compact_target = target.replace("regular", "").replace("normal", "")
    for font_info in font_index:
        if compact_target and compact_target in font_info["exact_names"]:
            return font_info["path"]

    # 第 3 级：展开 Illustrator 常用的单字母样式缩写
    # AlibabaPuHuiTiR → alibabapuhuitir → 尝试 alibabapuhuitiregular
    style_expansions = {
        "r": "regular", "b": "bold", "m": "medium",
        "l": "light", "h": "heavy", "t": "thin",
    }
    if len(target) > 4:
        last_char = target[-1]
        if last_char in style_expansions:
            expanded = target[:-1] + style_expansions[last_char]
            for font_info in font_index:
                if expanded in font_info["exact_names"]:
                    return font_info["path"]

    # 第 4 级：子串匹配（target 是某个内部名的子串，或反过来）
    # 取最长匹配，避免误命中
    best_match: Optional[Path] = None
    best_match_len = 0
    if len(target) >= 8:  # 足够长才做子串匹配，避免短名误命中
        for font_info in font_index:
            for name in font_info["exact_names"]:
                if target in name or name in target:
                    match_len = min(len(target), len(name))
                    if match_len > best_match_len:
                        best_match_len = match_len
                        best_match = font_info["path"]
        if best_match and best_match_len >= len(target) * 0.7:
            return best_match

    return None


def get_system_font_index() -> List[Dict[str, Any]]:
    global _SYSTEM_FONT_INDEX
    if _SYSTEM_FONT_INDEX is not None:
        return _SYSTEM_FONT_INDEX

    indexed: List[Dict[str, Any]] = []
    for path in collect_font_files(get_font_dirs()):
        names = read_font_internal_names(path)
        if not names:
            continue
        indexed.append({"path": path, "exact_names": set(names)})

    _SYSTEM_FONT_INDEX = indexed
    return indexed


def read_font_internal_names(path: Path) -> List[str]:
    try:
        from fontTools.ttLib import TTCollection, TTFont
    except Exception:
        return []

    names: List[str] = []
    try:
        if path.suffix.lower() == ".ttc":
            collection = TTCollection(str(path))
            for font in collection.fonts:
                names.extend(extract_name_table(font))
            return names

        font = TTFont(str(path), lazy=True)
        return extract_name_table(font)
    except Exception:
        return []


def extract_name_table(font) -> List[str]:
    result: List[str] = []
    for record in font["name"].names:
        if record.nameID not in (1, 2, 4, 6, 16, 17):
            continue
        try:
            value = record.toUnicode()
        except Exception:
            continue
        normalized = normalize_font_name(value)
        if normalized:
            result.append(normalized)
    return result


def normalize_font_name(value: str) -> str:
    return re.sub(r"[^a-z0-9\u4e00-\u9fff]", "", value.lower())


def contains_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def find_best_font_path(target: str, candidates: List[Path]) -> tuple[Optional[Path], int]:
    best_path = None
    best_score = 0
    for path in candidates:
        name = normalize_font_name(path.stem)
        score = font_match_score(target, name)
        if score > best_score:
            best_score = score
            best_path = path
    return best_path, best_score


def font_match_threshold(target: str) -> int:
    if not target:
        return 999
    return max(6, min(14, len(target) // 2))


def is_likely_cjk_font(path: Path) -> bool:
    name = normalize_font_name(path.stem)
    cjk_tokens = (
        "yahei", "msyh", "simhei", "simsun", "song", "hei", "fangsong", "kai",
        "noto", "sourcehan", "siyuan", "alimama", "alibaba", "puhui", "hanyi", "fzz",
        "dengxian", "youyuan", "等线", "雅黑", "黑体", "宋体", "仿宋", "楷体", "思源"
    )
    return any(token in name for token in cjk_tokens)


def has_explicit_windows_cjk_family(normalized_hint: str) -> bool:
    tokens = ("yahei", "microsoftyahei", "msyh", "simhei", "simsun")
    return any(token in normalized_hint for token in tokens)


def _find_sourcehan_font(normalized_hint: str, font_dirs: List["Path"]) -> Optional["Path"]:
    """尝试在系统字体目录中找思源黑体/Source Han Sans/Noto Sans CJK 文件。"""
    style = normalized_hint
    if "extralight" in style or "ultralight" in style:
        candidates = ["SourceHanSansCN-ExtraLight.otf", "NotoSansCJKsc-Thin.otf"]
    elif "light" in style:
        candidates = ["SourceHanSansCN-Light.otf", "NotoSansCJKsc-Light.otf"]
    elif "medium" in style:
        candidates = ["SourceHanSansCN-Medium.otf", "NotoSansCJKsc-Medium.otf"]
    elif "bold" in style or "heavy" in style or "black" in style:
        candidates = ["SourceHanSansCN-Bold.otf", "SourceHanSansCN-Heavy.otf", "NotoSansCJKsc-Bold.otf"]
    else:
        candidates = ["SourceHanSansCN-Regular.otf", "NotoSansCJKsc-Regular.otf"]

    for font_dir in font_dirs:
        for name in candidates:
            p = font_dir / name
            if p.exists():
                return p
    return None


def preferred_windows_font_files(normalized_hint: str) -> List[str]:
    # 注意：“黑”在中文字体名中是分类名（无衬线体），不代表粗体。
    # 只有 "bold"/"black"/"heavy"/"demi"/"粗黑"这类明确粗体关键词才判断为粗体。
    is_bold = any(token in normalized_hint for token in ("bold", "black", "heavy", "demi", "粗"))
    # 思源黑体 / Source Han Sans / Noto Sans CJK 系列
    is_sourcehan = any(token in normalized_hint for token in (
        "sourcehan", "sourcehansans", "sourcehansanscn", "siyuan", "思源",
        "notosanscjk", "notosans"
    ))
    is_yahei = any(token in normalized_hint for token in ("yahei", "微软雅黑", "microsoftyahei"))
    is_hei = (
        # 字面包含 黑体/simhei 且不是思源黑体（避免误判）
        any(token in normalized_hint for token in ("黑体", "simhei"))
        and not is_sourcehan
    )
    is_song = any(token in normalized_hint for token in ("song", "宋体", "simsun"))

    if is_sourcehan:
        # 思源黑体安装目录下的常用文件名
        if is_bold:
            return [
                "SourceHanSansCN-Bold.otf", "SourceHanSansCN-Heavy.otf",
                "NotoSansCJKsc-Bold.otf", "msyhbd.ttc", "simhei.ttf",
            ]
        style = normalized_hint
        if "extralight" in style or "ultralight" in style:
            return ["SourceHanSansCN-ExtraLight.otf", "NotoSansCJKsc-Thin.otf", "msyh.ttc"]
        if "light" in style:
            return ["SourceHanSansCN-Light.otf", "NotoSansCJKsc-Light.otf", "msyh.ttc"]
        if "medium" in style:
            return ["SourceHanSansCN-Medium.otf", "NotoSansCJKsc-Medium.otf", "msyh.ttc"]
        if "regular" in style or "normal" in style:
            return ["SourceHanSansCN-Regular.otf", "NotoSansCJKsc-Regular.otf", "msyh.ttc"]
        return ["SourceHanSansCN-Regular.otf", "NotoSansCJKsc-Regular.otf", "msyh.ttc"]

    if is_bold:
        names = ["msyhbd.ttc", "simhei.ttf", "SourceHanSansCN-Bold.otf", "NotoSansCJKsc-Bold.otf"]
    elif is_yahei:
        names = ["msyh.ttc", "msyhbd.ttc"]
    elif is_hei:
        names = ["simhei.ttf", "msyh.ttc"]
    elif is_song:
        names = ["simsun.ttc", "simsunb.ttf"]
    else:
        names = ["msyh.ttc", "simsun.ttc", "simhei.ttf"]
    return names


def font_match_score(target: str, candidate: str) -> int:
    if not target or not candidate:
        return 0
    if target == candidate:
        return 100
    if target in candidate or candidate in target:
        return max(20, min(len(target), len(candidate)))
    score = 0
    for token in ("bold", "black", "heavy", "medium", "regular", "light", "song", "hei", "yahei", "simhei", "simsun", "noto", "sourcehan"):
        if token in target and token in candidate:
            score += 4
    target_chunks = [chunk for chunk in re.split(r"(bold|black|heavy|medium|regular|light|italic|oblique)", target) if len(chunk) >= 4]
    for chunk in target_chunks:
        if chunk in candidate:
            score += min(len(chunk), 16)
    return score


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
