"""
Prescription OCR API  —  FastAPI + EasyOCR + OpenCV
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import io
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from ocr_processor import process_prescription, get_reader

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rx-ocr")

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_FILE_MB = 15


# ── Preload EasyOCR model on startup ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading EasyOCR model (first run may download ~100 MB)…")
    get_reader()
    log.info("EasyOCR ready.")
    yield


app = FastAPI(
    title="Prescription OCR API",
    description="ML-based prescription scanner — NOT for medical diagnosis.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "rx-ocr"}


@app.post("/scan")
async def scan_prescription(file: UploadFile = File(...)):
    """
    Upload a prescription image (JPEG/PNG/WEBP).
    Returns structured JSON with medicines, dosages, confidence scores.
    """
    # Validate MIME
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, or WEBP.",
        )

    # Read bytes
    data = await file.read()
    if len(data) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_MB} MB limit.")

    log.info(f"Processing {file.filename!r} ({len(data)//1024} KB, {file.content_type})")

    try:
        result = process_prescription(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log.exception("OCR processing error")
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")

    return JSONResponse(content=result)


@app.post("/scan/base64")
async def scan_base64(payload: dict):
    """
    Alternative endpoint: POST JSON with { "imageBase64": "...", "mimeType": "image/jpeg" }
    Used by the React frontend.
    """
    import base64

    b64 = payload.get("imageBase64", "")
    mime = payload.get("mimeType", "image/jpeg")

    if not b64:
        raise HTTPException(status_code=400, detail="imageBase64 is required.")
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported mimeType '{mime}'.")

    try:
        data = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 data.")

    if len(data) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Image exceeds {MAX_FILE_MB} MB limit.")

    log.info(f"Processing base64 image ({len(data)//1024} KB, {mime})")

    try:
        result = process_prescription(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        log.exception("OCR processing error")
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")

    return JSONResponse(content=result)


# ── Built-in simple web UI ─────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def index():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Rx OCR Scanner</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#f0f9ff;color:#0f172a;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px}
    h1{font-size:2rem;font-weight:800;color:#0284c7;margin-bottom:4px}
    .subtitle{color:#64748b;font-size:.95rem;margin-bottom:32px}
    .card{background:#fff;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:32px;width:100%;max-width:540px;margin-bottom:24px}
    label{display:block;font-weight:700;margin-bottom:8px;color:#334155}
    .drop-zone{border:2px dashed #bae6fd;border-radius:16px;padding:40px 24px;text-align:center;cursor:pointer;transition:background .2s;background:#f0f9ff}
    .drop-zone:hover,.drop-zone.over{background:#e0f2fe}
    .drop-zone input{display:none}
    .drop-zone img{max-height:200px;border-radius:12px;margin-top:12px;object-fit:contain}
    .drop-zone p{color:#64748b;font-size:.9rem;margin-top:8px}
    button{width:100%;padding:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:16px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:opacity .2s;margin-top:16px}
    button:disabled{opacity:.5;cursor:not-allowed}
    .spinner{display:none;width:24px;height:24px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}
    @keyframes spin{to{transform:rotate(360deg)}}
    #result{display:none}
    .badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:700}
    .badge.high{background:#dcfce7;color:#15803d}
    .badge.medium{background:#fef9c3;color:#b45309}
    .badge.low{background:#fee2e2;color:#b91c1c}
    .badge.uncertain{background:#fff7ed;color:#c2410c}
    .med-card{border:1px solid #e2e8f0;border-radius:16px;padding:16px;margin-bottom:12px}
    .med-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    .med-name{font-weight:800;font-size:1.05rem;color:#1e293b}
    .field{font-size:.85rem;color:#475569;margin:3px 0}
    .field strong{color:#0f172a}
    .conf-bar-wrap{height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-top:8px}
    .conf-bar{height:100%;border-radius:99px;transition:width .6s ease}
    .uncertain-section{background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:14px;margin-top:16px}
    .uncertain-section h3{color:#c2410c;font-size:.9rem;font-weight:700;margin-bottom:8px}
    .flag{font-size:.8rem;color:#92400e;margin:2px 0}
    .disclaimer{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;font-size:.78rem;color:#64748b;line-height:1.5;margin-top:16px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
    .meta-item{background:#f8fafc;border-radius:12px;padding:10px}
    .meta-label{font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
    .meta-value{font-size:.9rem;font-weight:600;color:#1e293b;margin-top:2px}
    .score-ring{display:flex;align-items:center;gap:12px;background:#f0f9ff;border-radius:16px;padding:16px;margin-bottom:16px}
    .score-num{font-size:2rem;font-weight:900;color:#0284c7}
  </style>
</head>
<body>
  <h1>⚕️ Rx OCR Scanner</h1>
  <p class="subtitle">ML-powered prescription reader · Not for medical diagnosis</p>

  <div class="card">
    <label>Upload Prescription Image</label>
    <div class="drop-zone" id="dropZone">
      <input type="file" id="fileInput" accept="image/*"/>
      <div id="dropText">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p>Drag &amp; drop or <strong>click to browse</strong></p>
        <p style="font-size:.75rem;margin-top:4px">JPEG · PNG · WEBP · Max 15 MB</p>
      </div>
      <img id="preview" style="display:none"/>
    </div>
    <button id="scanBtn" disabled onclick="scan()">
      <span id="btnText">✨ Scan Prescription</span>
      <div class="spinner" id="spinner"></div>
    </button>
  </div>

  <div class="card" id="result">
    <h2 style="font-weight:800;margin-bottom:16px;color:#1e293b">Scan Results</h2>
    <div class="score-ring">
      <div>
        <div class="score-num" id="scoreNum">—</div>
        <div style="font-size:.8rem;color:#64748b;font-weight:600">OCR Confidence</div>
      </div>
      <span class="badge" id="gradeBadge">—</span>
      <div style="margin-left:auto;font-size:.85rem;color:#64748b" id="lineCount"></div>
    </div>
    <div class="meta" id="metaGrid"></div>
    <div id="medsSection"></div>
    <div id="uncertainSection"></div>
    <div class="disclaimer" id="disclaimerText"></div>
  </div>

  <script>
    const dz = document.getElementById('dropZone');
    const fi = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const scanBtn = document.getElementById('scanBtn');
    let selectedFile = null;

    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); handleFile(e.dataTransfer.files[0]); });
    fi.addEventListener('change', () => handleFile(fi.files[0]));

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      selectedFile = file;
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = 'block';
      document.getElementById('dropText').style.display = 'none';
      scanBtn.disabled = false;
    }

    async function scan() {
      if (!selectedFile) return;
      scanBtn.disabled = true;
      document.getElementById('btnText').style.display = 'none';
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('result').style.display = 'none';

      try {
        const fd = new FormData();
        fd.append('file', selectedFile);
        const res = await fetch('/scan', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Scan failed');
        renderResult(data);
      } catch(e) {
        alert('Error: ' + e.message);
      } finally {
        scanBtn.disabled = false;
        document.getElementById('btnText').style.display = 'block';
        document.getElementById('spinner').style.display = 'none';
      }
    }

    function renderResult(d) {
      const conf = d.confidence || {};
      document.getElementById('scoreNum').textContent = conf.score ? conf.score.toFixed(0) + '%' : '—';
      const gb = document.getElementById('gradeBadge');
      gb.textContent = conf.grade || '—';
      gb.className = 'badge ' + (conf.grade || 'low');
      document.getElementById('lineCount').textContent =
        `${conf.total_lines || 0} text lines · ${conf.medicine_count || 0} medicines`;

      // Meta
      const meta = [
        { label: 'Patient', value: d.patient_name || '—' },
        { label: 'Doctor', value: d.doctor_name || '—' },
        { label: 'Date', value: d.date || '—' },
        { label: 'Diagnosis', value: d.diagnosis || '—' },
      ];
      document.getElementById('metaGrid').innerHTML = meta.map(m =>
        `<div class="meta-item"><div class="meta-label">${m.label}</div><div class="meta-value">${m.value}</div></div>`
      ).join('');

      // Medicines
      const meds = d.medications || [];
      document.getElementById('medsSection').innerHTML = meds.length
        ? `<h3 style="font-weight:800;margin:12px 0 8px;color:#1e293b">Medicines (${meds.length})</h3>`
          + meds.map(m => {
          const pct = Math.round((m.confidence || 0) * 100);
          const barColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
          return `
            <div class="med-card">
              <div class="med-header">
                <span class="med-name">${m.name || 'Unknown'}</span>
                ${m.needs_verification ? '<span class="badge uncertain">⚠ Verify</span>' : ''}
                ${m.uncertain && !m.needs_verification ? '<span class="badge medium">~Check</span>' : ''}
              </div>
              ${m.dosage ? `<div class="field"><strong>Dosage:</strong> ${m.dosage}</div>` : ''}
              ${m.frequency ? `<div class="field"><strong>Frequency:</strong> ${m.frequency}</div>` : ''}
              ${m.duration ? `<div class="field"><strong>Duration:</strong> ${m.duration}</div>` : ''}
              ${m.quantity ? `<div class="field"><strong>Quantity:</strong> ${m.quantity}</div>` : ''}
              <div class="conf-bar-wrap" title="OCR confidence: ${pct}%">
                <div class="conf-bar" style="width:${pct}%;background:${barColor}"></div>
              </div>
              <div style="font-size:.72rem;color:#94a3b8;margin-top:3px">OCR confidence: ${pct}%</div>
            </div>
          `;
        }).join('')
        : '<p style="color:#94a3b8;text-align:center;padding:16px">No medicine entries detected.</p>';

      // Uncertain lines
      const unc = d.uncertain_lines || [];
      document.getElementById('uncertainSection').innerHTML = unc.length ? `
        <div class="uncertain-section">
          <h3>⚠ ${unc.length} line(s) flagged for manual verification</h3>
          ${unc.map(u => `<div class="flag">• "${u.text}" — confidence ${Math.round(u.confidence*100)}%</div>`).join('')}
        </div>` : '';

      document.getElementById('disclaimerText').textContent = d.disclaimer || '';
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>"""
