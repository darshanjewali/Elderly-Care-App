"""
Prescription OCR Processor
Uses EasyOCR + OpenCV for reading doctor handwriting and extracting structured data.
DISCLAIMER: For informational display only. Not a medical diagnosis tool.
"""

import re
import math
import numpy as np
import cv2
from PIL import Image
import easyocr
from typing import Optional


# ── Initialise EasyOCR reader (loaded once at module level) ──────────────────
_reader: Optional[easyocr.Reader] = None


def get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _reader


# ── Image preprocessing ───────────────────────────────────────────────────────

def preprocess_image(img_array: np.ndarray) -> np.ndarray:
    """
    Full preprocessing pipeline:
    1. Grayscale conversion
    2. Deskew
    3. Denoising
    4. Adaptive thresholding
    5. Morphological cleanup
    """
    # Convert BGR → Grayscale
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_array.copy()

    # Deskew
    gray = _deskew(gray)

    # Denoise with fast NL means
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # Adaptive thresholding — handles uneven lighting on prescription paper
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=21, C=8,
    )

    # Morphological opening to remove tiny noise specks
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    # Scale up if image is small — helps OCR accuracy
    h, w = cleaned.shape
    if max(h, w) < 800:
        scale = 800 / max(h, w)
        cleaned = cv2.resize(cleaned, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    return cleaned


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Detect skew angle via Hough lines and rotate to correct it."""
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, math.pi / 180, threshold=80,
                             minLineLength=50, maxLineGap=10)
    if lines is None:
        return gray

    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if x2 != x1:
            angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
            if -45 < angle < 45:
                angles.append(angle)

    if not angles:
        return gray

    median_angle = float(np.median(angles))
    if abs(median_angle) < 0.5:
        return gray

    h, w = gray.shape
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    rotated = cv2.warpAffine(gray, M, (w, h),
                              flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    return rotated


# ── OCR ───────────────────────────────────────────────────────────────────────

def run_ocr(img_array: np.ndarray) -> list[dict]:
    """
    Run EasyOCR on preprocessed image.
    Returns list of {text, confidence, bbox} dicts sorted top-to-bottom.
    """
    reader = get_reader()
    raw = reader.readtext(img_array, detail=1, paragraph=False)

    results = []
    for bbox, text, conf in raw:
        text = text.strip()
        if not text:
            continue
        # Compute top-left y for sort order
        top_y = min(pt[1] for pt in bbox)
        results.append({
            "text": text,
            "confidence": round(float(conf), 4),
            "bbox": [[round(float(x)), round(float(y))] for x, y in bbox],
            "top_y": top_y,
        })

    results.sort(key=lambda r: r["top_y"])
    return results


# ── Structured extraction ─────────────────────────────────────────────────────

# Patterns
_DOSAGE_RE = re.compile(
    r"\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?|tabs?|caps?|tablets?|capsules?|drops?|puffs?|sprays?))\b",
    re.IGNORECASE,
)
_FREQ_RE = re.compile(
    r"\b("
    r"once\s+(?:a\s+)?daily|twice\s+(?:a\s+)?daily|three\s+times\s+(?:a\s+)?daily|"
    r"four\s+times\s+(?:a\s+)?daily|"
    r"every\s+\d+\s+hours?|every\s+(?:morning|evening|night|bedtime)|"
    r"(?:od|bd|tds|qds|tid|bid|qid|prn|sos|hs|am|pm)\b|"
    r"\d+\s*x\s*(?:daily|a\s+day)|"
    r"(?:morning|evening|night|bedtime|meals?|food|empty\s+stomach|"
    r"before\s+(?:meal|food|breakfast|lunch|dinner)|"
    r"after\s+(?:meal|food|breakfast|lunch|dinner)|"
    r"with\s+(?:meal|food|water|milk))"
    r")",
    re.IGNORECASE,
)
_DURATION_RE = re.compile(
    r"\b(\d+\s*(?:day|week|month|year)s?(?:\s+course)?)\b",
    re.IGNORECASE,
)
_QTY_RE = re.compile(
    r"\b(\d+\s*(?:tabs?|tablets?|caps?|capsules?|strips?|bottles?|vials?|sachets?|tubes?))\b",
    re.IGNORECASE,
)
_DOCTOR_RE = re.compile(
    r"\b(?:Dr\.?|Doctor|Prof\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})",
    re.IGNORECASE,
)
_DATE_RE = re.compile(
    r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}|"
    r"\w+\s+\d{1,2},?\s+\d{4})\b"
)
_PATIENT_RE = re.compile(
    r"\b(?:Patient|Name|Pt\.?|Mr\.?|Mrs\.?|Ms\.?)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})",
    re.IGNORECASE,
)
_DIAGNOSIS_RE = re.compile(
    r"\b(?:Dx|Diagnosis|Impression|Complaint|C/?O)\s*[:\-]?\s*(.+)",
    re.IGNORECASE,
)

# Known medicine keywords for heuristic scoring
_MED_KEYWORDS = {
    "tab", "tablet", "cap", "capsule", "syrup", "drop", "injection",
    "cream", "ointment", "gel", "patch", "inhaler", "spray", "solution",
}


def _is_likely_medicine_line(text: str) -> float:
    """Heuristic score 0‒1 for whether a line looks like a medicine entry."""
    text_lower = text.lower()
    score = 0.0
    if _DOSAGE_RE.search(text):
        score += 0.4
    if any(kw in text_lower for kw in _MED_KEYWORDS):
        score += 0.3
    if _FREQ_RE.search(text):
        score += 0.2
    if re.search(r"\b[A-Z][a-z]{3,}\b", text):
        score += 0.1
    return min(score, 1.0)


def _extract_medicine_blocks(ocr_lines: list[dict]) -> list[dict]:
    """
    Group OCR lines into probable medicine entries.
    Strategy: scan for lines that have dosage / frequency / medicine keywords,
    then collect the surrounding context.
    """
    texts = [r["text"] for r in ocr_lines]
    confs = [r["confidence"] for r in ocr_lines]

    medicines = []
    used = set()

    for i, (text, conf) in enumerate(zip(texts, confs)):
        if i in used:
            continue

        med_score = _is_likely_medicine_line(text)
        if med_score < 0.3:
            continue

        # Collect this line + up to 2 following lines as context
        block_texts = [text]
        block_confs = [conf]
        for j in range(i + 1, min(i + 3, len(texts))):
            if j in used:
                break
            next_score = _is_likely_medicine_line(texts[j])
            if next_score > 0.2 or _FREQ_RE.search(texts[j]) or _DURATION_RE.search(texts[j]):
                block_texts.append(texts[j])
                block_confs.append(confs[j])
                used.add(j)
            else:
                break

        used.add(i)
        block = " | ".join(block_texts)
        avg_conf = sum(block_confs) / len(block_confs)

        # Extract fields from block
        dosage_m = _DOSAGE_RE.search(block)
        freq_m = _FREQ_RE.search(block)
        dur_m = _DURATION_RE.search(block)
        qty_m = _QTY_RE.search(block)

        # Medicine name = first capitalised token before dosage
        name_text = block_texts[0]
        name_match = re.match(r"^([A-Za-z][\w\-\/\(\)]+(?:\s+[A-Za-z][\w\-\/\(\)]+)?)", name_text)
        name = name_match.group(1).strip() if name_match else name_text[:30]

        # Per-field confidence: OCR conf × field presence bonus
        field_conf = round(min(avg_conf + 0.05, 1.0), 3)

        med = {
            "name": name,
            "dosage": dosage_m.group(1) if dosage_m else None,
            "frequency": freq_m.group(1) if freq_m else None,
            "duration": dur_m.group(1) if dur_m else None,
            "quantity": qty_m.group(1) if qty_m else None,
            "raw_text": block,
            "confidence": field_conf,
            "uncertain": avg_conf < 0.55,
            "needs_verification": avg_conf < 0.40,
        }
        medicines.append(med)

    return medicines


def _extract_header_fields(ocr_lines: list[dict]) -> dict:
    """Extract patient name, doctor name, date, diagnosis from top ~10 lines."""
    top_text = " ".join(r["text"] for r in ocr_lines[:12])

    doctor_m = _DOCTOR_RE.search(top_text)
    patient_m = _PATIENT_RE.search(top_text)
    date_m = _DATE_RE.search(top_text)
    diag_m = _DIAGNOSIS_RE.search(top_text)

    return {
        "doctor_name": doctor_m.group(0).strip() if doctor_m else None,
        "patient_name": patient_m.group(1).strip() if patient_m else None,
        "date": date_m.group(1).strip() if date_m else None,
        "diagnosis": diag_m.group(1).strip()[:80] if diag_m else None,
    }


def _overall_confidence(ocr_lines: list[dict], medicines: list[dict]) -> dict:
    """Compute overall confidence and quality metrics."""
    if not ocr_lines:
        return {"score": 0.0, "grade": "low", "flagged_lines": 0}

    all_confs = [r["confidence"] for r in ocr_lines]
    avg = sum(all_confs) / len(all_confs)
    flagged = sum(1 for c in all_confs if c < 0.45)

    grade = "high" if avg >= 0.75 else "medium" if avg >= 0.50 else "low"
    return {
        "score": round(avg * 100, 1),
        "grade": grade,
        "flagged_lines": flagged,
        "total_lines": len(ocr_lines),
        "medicine_count": len(medicines),
    }


# ── Public API ────────────────────────────────────────────────────────────────

def process_prescription(image_bytes: bytes) -> dict:
    """
    Main entry point.
    Args:
        image_bytes: raw image bytes (JPEG/PNG/WEBP)
    Returns:
        Structured prescription dict with confidence scores.
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG/WEBP file.")

    # Preprocess
    preprocessed = preprocess_image(img)

    # Run OCR
    ocr_lines = run_ocr(preprocessed)
    full_text = " ".join(r["text"] for r in ocr_lines)

    # Extract structured fields
    header = _extract_header_fields(ocr_lines)
    medicines = _extract_medicine_blocks(ocr_lines)
    confidence = _overall_confidence(ocr_lines, medicines)

    # Flag uncertain lines
    uncertain_lines = [
        {"text": r["text"], "confidence": r["confidence"]}
        for r in ocr_lines if r["confidence"] < 0.45
    ]

    return {
        "success": True,
        "patient_name": header["patient_name"],
        "doctor_name": header["doctor_name"],
        "date": header["date"],
        "diagnosis": header["diagnosis"],
        "medications": medicines,
        "raw_text": full_text,
        "ocr_lines": [{"text": r["text"], "confidence": r["confidence"]} for r in ocr_lines],
        "uncertain_lines": uncertain_lines,
        "confidence": confidence,
        "disclaimer": (
            "This output is generated by an automated OCR system for informational "
            "display only. It does NOT constitute medical advice, diagnosis, or "
            "treatment recommendations. Always verify with a licensed pharmacist or doctor."
        ),
    }
