// src/pages/ReportPrint.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ---------- Helpers ---------- */
function parseMaybeJSON(v) {
  if (v == null) return v;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return v; }
}
function n(v, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}
function fmt(v) {
  if (v == null || v === "") return "N/A";
  const x = Number(v);
  return Number.isFinite(x) ? x.toFixed(2) : String(v);
}
function fmtMils(inchesVal) {
  const x = Number(inchesVal);
  if (!Number.isFinite(x)) return "N/A";
  return (x * 1000).toFixed(2);
}

/* ---------- Image helpers (usa EXACTAMENTE tus .bmp) ---------- */
function Graphic({ file, alt, className, style }) {
  // Carga directa desde /public/graphics con el nombre exacto .bmp
  return <img src={`/graphics/${file}`} alt={alt} className={className} style={style} />;
}

/* ---------- Teoría de relojes ---------- */
function analyzeClocks(ind, H) {
  const R90 = n(ind?.R90);
  const R180 = n(ind?.R180);
  const R270 = n(ind?.R270);
  const R0   = Number.isFinite(Number(ind?.R0)) ? Number(ind?.R0)
            : Number.isFinite(Number(ind?.R360)) ? Number(ind?.R360) : NaN;

  const F90 = n(ind?.F90);
  const F180 = n(ind?.F180);
  const F270 = n(ind?.F270);
  const F0   = Number.isFinite(Number(ind?.F0)) ? Number(ind?.F0)
            : Number.isFinite(Number(ind?.F360)) ? Number(ind?.F360) : NaN;

  const have0 = Number.isFinite(R0) && Number.isFinite(F0);

  // Offsets (mils si tus diales están en enteros = mils)
  const offsetV = (R90 - R270) / 2;
  const offsetH = have0 ? (R0 - R180) / 2 : NaN;

  // Angularidad (mils / inch) usando H (diámetro de giro) en pulgadas
  const Hnum = Number(H);
  const angV = Number.isFinite(Hnum) && Hnum !== 0 ? (F90 - F270) / Hnum : NaN;
  const angH = have0 && Number.isFinite(Hnum) && Hnum !== 0 ? (F0 - F180) / Hnum : NaN;

  return { have0, offsetV, offsetH, angV, angH };
}

/* ---------- Iconos según signo (usa AngPos/AngNeg y OffPos/OffNeg) ---------- */
function IconAng({ value }) {
  if (!Number.isFinite(value)) return <Graphic file="None.bmp" alt="N/A" style={{ height: 22 }} />;
  return value >= 0
    ? <Graphic file="AngPos.bmp" alt="Ang +" style={{ height: 22 }} />
    : <Graphic file="AngNeg.bmp" alt="Ang -" style={{ height: 22 }} />;
}
function IconOff({ value }) {
  if (!Number.isFinite(value)) return <Graphic file="None.bmp" alt="N/A" style={{ height: 22 }} />;
  return value >= 0
    ? <Graphic file="OffPos.bmp" alt="Off +" style={{ height: 22 }} />
    : <Graphic file="OffNeg.bmp" alt="Off -" style={{ height: 22 }} />;
}

/* ---------- Page ---------- */
export default function ReportPrint() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/reports/${id}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Error al cargar el reporte");
        const rep = json.report || {};
        rep.dims = parseMaybeJSON(rep.dims) ?? {};
        rep.indicators = parseMaybeJSON(rep.indicators) ?? {};
        rep.results = parseMaybeJSON(rep.results) ?? {};
        rep.description = rep.description || rep.notes || "";
        setR(rep);
      } catch (e) { setErr(e.message || String(e)); }
    })();
  }, [id]);

  const clocks = useMemo(() => r ? analyzeClocks(r.indicators, r.dims?.H) : null, [r]);

  if (err) {
    return (
      <div className="p-6 text-red-500">
        <h2>Error</h2>
        <pre className="whitespace-pre-wrap text-sm">{err}</pre>
        <Link to="/app/reports" className="underline text-blue-600">Volver</Link>
      </div>
    );
  }
  if (!r) return <div className="p-6">Cargando…</div>;

  return (
    <div>
      <style>{`
        body { background:#fff !important; color:#000 !important; font-family: Arial, sans-serif; }
        /* Imprimir solo el cuadro blanco */
        @media print {
          body * { visibility: hidden !important; }
          .report-wrapper, .report-wrapper * { visibility: visible !important; }
          .report-wrapper {
            position: absolute !important; left: 0 !important; top: 0 !important;
            margin: 0 !important; box-shadow: none !important; background: #fff !important; color: #000 !important;
            width: 180mm !important; padding: 0 !important;
          }
          @page { size: A4 portrait; margin: 15mm; }
          .no-print { display: none !important; }
        }
        .report-wrapper { max-width: 800px; margin: 20px auto; padding: 20px; background:#fff; color:#000; box-shadow: 0 2px 6px rgba(0,0,0,.1); }
        .title { font-size:20px; font-weight:700; text-align:center; margin-bottom:6px; }
        .subtitle { font-size:12px; text-align:center; margin-bottom:20px; color:#444; }
        .section { margin-bottom:18px; page-break-inside: avoid; }
        .section h3 { font-size:13px; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:8px; }
        .table { width:100%; border-collapse:collapse; font-size:11px; }
        .table th, .table td { border:1px solid #aaa; padding:4px 6px; }
        .panel { border:1px solid #999; padding:8px; background:#fff; }
        .panel-title { font-size:12px; font-weight:700; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px; }
        .footer { font-size:10px; color:#555; display:flex; justify-content:space-between; margin-top:20px; }
        .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        .grid-4 { display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; }
        .kpi { display:grid; grid-template-columns: 120px 1fr; gap:8px; align-items:center; }
        .kpi .valuebox { display:flex; align-items:center; gap:6px; border:1px solid #777; padding:4px 6px; min-height:34px; }
        .muted { color:#666; font-size:10px; }
        .callout { border:1px solid #aaa; padding:10px; }
        .callout h4 { margin:0 0 6px 0; font-size:12px; }
        .pill { display:inline-block; border:1px solid #aaa; padding:2px 6px; border-radius:12px; font-size:10px; background:#f6f6f6; }
      `}</style>

      <div className="no-print p-4 flex gap-2">
        <button onClick={() => window.print()} className="px-3 py-2 rounded bg-black text-white">Imprimir</button>
        <Link to="/app/reports" className="px-3 py-2 rounded border">Volver</Link>
      </div>

      <div className="report-wrapper">
        {/* Header */}
        <div className="title">Alignment Procedure Report</div>
        <div className="subtitle">
          Rim and Face Method<br />
          Report Date: {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}<br />
          Prepared by: {r.user_name || r.user_email || r.performer_name || "N/A"}
        </div>

        {/* Date/Equipment */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px", fontSize:11}}>
          <div><b>Date/Time of Alignment Data Creation:</b> {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</div>
          <div><b>Equipment ID (if any):</b> {r.equipment_id ?? "N/A"}</div>
        </div>

        {/* Inputs / Readings */}
        <div className="grid-2" style={{marginBottom:"14px"}}>
          {/* LEFT: Equipment */}
          <div className="panel">
            <div className="panel-title">Equipment Measurements (Constants, in Inches)</div>
            <div style={{display:"grid", gridTemplateColumns:"160px 1fr", gap:"10px", alignItems:"start"}}>
              <div style={{border:"1px solid #bbb", padding:"6px"}}>
                {/* Usa un esquema de acople de tu set */}
                <Graphic file="Rimface_1.bmp" alt="Equipment diagram" style={{maxWidth:"100%", display:"block"}} />
                <div className="muted" style={{marginTop:"6px"}}>
                  <b>Sag (if any):</b> {typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "N/A")}
                </div>
              </div>
              <div style={{fontSize:11}}>
                <div>H (Swing diameter): <b>{r.dims?.H ?? "N/A"}</b></div>
                <div>D (Near feet → face): <b>{r.dims?.D ?? "N/A"}</b></div>
                <div>E (Feet spacing): <b>{r.dims?.E ?? "N/A"}</b></div>
                <div>F (Left front): <b>{r.dims?.F ?? "N/A"}</b></div>
                <div>G (Left back): <b>{r.dims?.G ?? "N/A"}</b></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Readings */}
          <div className="panel">
            <div className="panel-title">Dial Indicator Readings (Use Whole Numbers)</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 160px", gap:"10px", alignItems:"start"}}>
              <div>
                <table className="table">
                  <thead>
                    <tr><th>Set</th><th>90°</th><th>180°</th><th>270°</th><th>0°</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Rim</td>
                      <td>{r.indicators?.R90 ?? "0"}</td>
                      <td>{r.indicators?.R180 ?? "0"}</td>
                      <td>{r.indicators?.R270 ?? "0"}</td>
                      <td>{r.indicators?.R0 ?? r.indicators?.R360 ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>Face</td>
                      <td>{r.indicators?.F90 ?? "0"}</td>
                      <td>{r.indicators?.F180 ?? "0"}</td>
                      <td>{r.indicators?.F270 ?? "0"}</td>
                      <td>{r.indicators?.F0 ?? r.indicators?.F360 ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="muted" style={{marginTop:"6px"}}>
                  Adjusted for SAG @90°: <b>{typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "0.000")}</b> • Dial numbers: 0.001" = 1
                </div>
              </div>
              <div style={{border:"1px solid #bbb", padding:"6px"}}>
                {/* Usa el círculo de lecturas de tu set */}
                <Graphic file="Revdial_1.bmp" alt="Dial circle" style={{maxWidth:"100%", display:"block"}} />
              </div>
            </div>
          </div>
        </div>

        {/* Soft-Foot + Performer (opcional si lo usas) */}
        <div className="panel" style={{marginBottom:"14px", fontSize:11}}>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px"}}>
            <div>
              <div><b>Was Soft-Foot detected?</b>&nbsp;
                <span>[ {r.softFootDetected ? "X" : " "} ] Yes&nbsp;&nbsp;[ {!r.softFootDetected ? "X" : " "} ] No</span>
              </div>
              <div style={{marginTop:"6px"}}><b>If yes, was it corrected?</b>&nbsp;
                <span>[ {r.softFootCorrected ? "X" : " "} ] Yes&nbsp;&nbsp;[ {!r.softFootCorrected ? "X" : " "} ] No</span>
              </div>
            </div>
            <div>
              <div><b>Person Performing the Alignment:</b></div>
              <div style={{marginTop:"8px", borderTop:"1px solid #000", width:"240px", paddingTop:"4px"}}>
                <span style={{fontWeight:"bold"}}>X</span>&nbsp;&nbsp;{r.performer_name || r.user_name || r.user_email || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* === BLOQUE estilo “última captura” (Angularity/Offset + paneles) === */}
        <div className="section">
          <h3>Calculated Results Based On Physical Dimensions and Input Above</h3>

          {/* KPIs superiores */}
          <div className="grid-4" style={{marginBottom:"8px"}}>
            <div className="kpi">
              <div>Angularity (Vertical)</div>
              <div className="valuebox">
                <IconAng value={clocks?.angV} />
                <b>{Number.isFinite(clocks?.angV) ? clocks.angV.toFixed(1) : "N/A"}</b>
              </div>
            </div>
            <div className="kpi">
              <div>Offset (Vertical)</div>
              <div className="valuebox">
                <IconOff value={clocks?.offsetV} />
                <b>{Number.isFinite(clocks?.offsetV) ? clocks.offsetV.toFixed(1) : "N/A"}</b>
                <span className="muted">mils</span>
              </div>
            </div>
            <div className="kpi">
              <div>Angularity (Horizontal)</div>
              <div className="valuebox">
                <IconAng value={clocks?.angH} />
                <b>{Number.isFinite(clocks?.angH) ? clocks.angH.toFixed(1) : (clocks?.have0 ? "N/A" : "—")}</b>
              </div>
            </div>
            <div className="kpi">
              <div>Offset (Horizontal)</div>
              <div className="valuebox">
                <IconOff value={clocks?.offsetH} />
                <b>{Number.isFinite(clocks?.offsetH) ? clocks.offsetH.toFixed(1) : (clocks?.have0 ? "N/A" : "—")}</b>
                <span className="muted">mils</span>
              </div>
            </div>
          </div>

          {/* VN/VF/HN/HF como referencia */}
          <table className="table" style={{marginBottom:"10px"}}>
            <tbody>
              <tr><td>Vertical — Near (VN)</td><td><b>{fmt(r.results?.VN)}</b> in <span className="pill">{fmtMils(r.results?.VN)} mils</span></td></tr>
              <tr><td>Vertical — Far  (VF)</td><td><b>{fmt(r.results?.VF)}</b> in <span className="pill">{fmtMils(r.results?.VF)} mils</span></td></tr>
              <tr><td>Horizontal — Near (HN)</td><td><b>{fmt(r.results?.HN)}</b> in <span className="pill">{fmtMils(r.results?.HN)} mils</span></td></tr>
              <tr><td>Horizontal — Far  (HF)</td><td><b>{fmt(r.results?.HF)}</b> in <span className="pill">{fmtMils(r.results?.HF)} mils</span></td></tr>
            </tbody>
          </table>

          {/* Paneles inferiores (tus imágenes) */}
          <div className="grid-2">
            <div className="callout">
              <h4>(+) = Add Shims &nbsp;&nbsp; (−) = Remove Shims</h4>
              <Graphic file="Shaft-Coupling1.bmp" alt="Panel Shims" style={{width:"100%", display:"block"}} />
            </div>
            <div className="callout">
              <h4>(+) = Push Back &gt; Front &nbsp;&nbsp; (−) = Push Front &gt; Back</h4>
              <Graphic file="Shaft-Coupling2.bmp" alt="Panel Push" style={{width:"100%", display:"block"}} />
            </div>
          </div>

          <div className="muted" style={{marginTop:8}}>
            *Las direcciones (+/−) dependen de tu convención de cero y sentido de lectura. Los valores son magnitudes objetivo.
          </div>
        </div>

        {/* Notes */}
        {r.description && (
          <div className="section">
            <h3>Notes</h3>
            <div style={{whiteSpace:"pre-wrap", fontSize:11}}>{r.description}</div>
          </div>
        )}

        <div className="footer">
          <span>ID: {r.id}</span>
          <span className="page-number"></span>
        </div>
      </div>
    </div>
  );
}
