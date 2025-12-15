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
  const R0 = Number.isFinite(Number(ind?.R0)) ? Number(ind?.R0)
    : Number.isFinite(Number(ind?.R360)) ? Number(ind?.R360) : NaN;

  const F90 = n(ind?.F90);
  const F180 = n(ind?.F180);
  const F270 = n(ind?.F270);
  const F0 = Number.isFinite(Number(ind?.F0)) ? Number(ind?.F0)
    : Number.isFinite(Number(ind?.F360)) ? Number(ind?.F360) : NaN;

  const have0 = Number.isFinite(R0) && Number.isFinite(F0);

  // OFFSET (en mils)
  const offsetV = R180 / 2;
  // Si no hay R0, usar la diferencia lateral (R270 - R90)/2
  const offsetH = have0 ? R0 / 2 : (R270 - R90) / 2;

  // ANGULARIDAD (mils/inch)
  const Hnum = Number(H);
  const angV = Number.isFinite(Hnum) && Hnum !== 0 ? F180 / Hnum : NaN;
  // Si no hay F0, usar la diferencia (F270 - F90)/H
  const angH = Number.isFinite(Hnum) && Hnum !== 0
    ? (have0 ? (F0 - F180) / Hnum : (F270 - F90) / Hnum)
    : NaN;

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
        const token = localStorage.getItem('token');
        const headers = { Accept: "application/json" };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API}/api/reports/${id}`, {
          credentials: "include",
          headers,
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

  const clocks = useMemo(() =>
    r ? analyzeClocks(r.indicators, r.dims?.H, r.results) : null,
    [r]
  );
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

      <div className="no-print p-4 flex gap-2 justify-center">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={() => window.location.href = `/app/calculations?edit=${id}`}
          className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
        >
          ✏️ Editar reporte
        </button>
        <Link 
          to="/app/reports" 
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </Link>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px", fontSize: 11 }}>
          <div><b>Date/Time of Alignment Data Creation:</b> {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</div>
          <div><b>Equipment ID (if any):</b> {r.equipment_id ?? "N/A"}</div>
        </div>

        {/* Inputs / Readings */}
        <div className="grid-2" style={{ marginBottom: "14px" }}>
          {/* LEFT: Equipment */}
          <div className="panel">
            <div className="panel-title">Equipment Measurements (Constants, in Inches)</div>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "10px", alignItems: "start" }}>
              <div style={{ border: "1px solid #bbb", padding: "6px" }}>
                {/* Usa un esquema de acople de tu set */}
                <Graphic file="Rimface_1.bmp" alt="Equipment diagram" style={{ maxWidth: "100%", display: "block" }} />
                <div className="muted" style={{ marginTop: "6px" }}>
                  <b>Sag (if any):</b> {typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "N/A")}
                </div>
              </div>
              <div style={{ fontSize: 11 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "10px", alignItems: "start" }}>
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
                <div className="muted" style={{ marginTop: "6px" }}>
                  Adjusted for SAG @90°: <b>{typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "0.000")}</b> • Dial numbers: 0.001" = 1
                </div>
              </div>
              <div style={{ border: "1px solid #bbb", padding: "6px" }}>
                {/* Usa el círculo de lecturas de tu set */}
                <Graphic file="Revdial_1.bmp" alt="Dial circle" style={{ maxWidth: "100%", display: "block" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Soft-Foot + Performer (opcional si lo usas) */}
        <div className="panel" style={{ marginBottom: "14px", fontSize: 11 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div><b>Was Soft-Foot detected?</b>&nbsp;
                <span>[ {r.softFootDetected ? "X" : " "} ] Yes&nbsp;&nbsp;[ {!r.softFootDetected ? "X" : " "} ] No</span>
              </div>
              <div style={{ marginTop: "6px" }}><b>If yes, was it corrected?</b>&nbsp;
                <span>[ {r.softFootCorrected ? "X" : " "} ] Yes&nbsp;&nbsp;[ {!r.softFootCorrected ? "X" : " "} ] No</span>
              </div>
            </div>
            <div>
              <div><b>Person Performing the Alignment:</b></div>
              <div style={{ marginTop: "8px", borderTop: "1px solid #000", width: "240px", paddingTop: "4px" }}>
                <span style={{ fontWeight: "bold" }}>X</span>&nbsp;&nbsp;{r.performer_name || r.user_name || r.user_email || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* === BLOQUE estilo "última captura" (Angularity/Offset + paneles) === */}
<div className="section">
  <h3>Calculated Results Based On Physical Dimensions and Input Above</h3>

  {/* Fila principal con 3 columnas: Vertical | Thermal | Horizontal */}
  <div style={{display:"grid", gridTemplateColumns:"2.2fr 1.3fr 2.2fr", gap:"10px", marginBottom:"14px", alignItems:"stretch"}}>
    
    {/* COLUMNA IZQUIERDA - Vertical */}
    <div>
      <div style={{fontSize:"10px", marginBottom:"6px", lineHeight:"1.2", fontWeight:"600"}}>
        Angularity and offset to the right of the coupling - vertical direction:
        <span style={{float:"right"}}>&gt;&gt;</span>
      </div>
      
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px"}}>
        {/* Angularity Vertical */}
        <div style={{border:"1px solid #999", padding:"10px 8px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"11px", marginBottom:"6px", fontWeight:"600"}}>Angularity</div>
          <div style={{fontSize:"22px", fontWeight:"700", marginBottom:"8px"}}>
            {Number.isFinite(clocks?.angV) ? clocks.angV.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconAng value={clocks?.angV} />
          </div>
        </div>
        
        {/* Offset Vertical */}
        <div style={{border:"1px solid #999", padding:"10px 8px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"11px", marginBottom:"6px", fontWeight:"600"}}>Offset</div>
          <div style={{fontSize:"22px", fontWeight:"700", marginBottom:"8px"}}>
            {Number.isFinite(clocks?.offsetV) ? clocks.offsetV.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconOff value={clocks?.offsetV} />
          </div>
        </div>
      </div>
    </div>

    {/* COLUMNA CENTRAL - Thermal Expansion */}
    <div style={{border:"1px solid #999", padding:"16px 12px", textAlign:"center", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", background:"#f9f9f9"}}>
      <div style={{fontSize:"10px", fontWeight:"600", marginBottom:"10px", lineHeight:"1.3"}}>
        Calculated Thermal<br/>Expansion (if available):
      </div>
      <div style={{fontSize:"20px", fontWeight:"700", marginBottom:"4px"}}>N/A</div>
      <div style={{fontSize:"9px", color:"#666"}}>(Mils)</div>
    </div>

    {/* COLUMNA DERECHA - Horizontal */}
    <div>
      <div style={{fontSize:"10px", marginBottom:"6px", lineHeight:"1.2", fontWeight:"600"}}>
        Angularity and offset to the right of the coupling - horizontal plane:
        <span style={{float:"right"}}>&lt;&lt;</span>
      </div>
      
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px"}}>
        {/* Angularity Horizontal */}
        <div style={{border:"1px solid #999", padding:"10px 8px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"11px", marginBottom:"6px", fontWeight:"600"}}>Angularity</div>
          <div style={{fontSize:"22px", fontWeight:"700", marginBottom:"8px"}}>
            {Number.isFinite(clocks?.angH) ? clocks.angH.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconAng value={clocks?.angH} />
          </div>
        </div>
        
        {/* Offset Horizontal */}
        <div style={{border:"1px solid #999", padding:"10px 8px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"11px", marginBottom:"6px", fontWeight:"600"}}>Offset</div>
          <div style={{fontSize:"22px", fontWeight:"700", marginBottom:"8px"}}>
            {Number.isFinite(clocks?.offsetH) ? clocks.offsetH.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconOff value={clocks?.offsetH} />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Paneles inferiores con diagramas de corrección */}
  <div className="grid-2" style={{ marginTop: "12px" }}>
    {/* Panel Vertical - Shims */}
    <div className="callout">
      <h4>(+) = Add Shims &nbsp;&nbsp;&nbsp; (−) = Remove Shims</h4>
      <div style={{ border: "1px solid #999", padding: "4px", background: "#fff", marginBottom: "8px" }}>
        <Graphic file="imagen1.png" alt="Shims Correction" style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", fontSize: "11px", textAlign: "center" }}>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.VN)}</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.VF)}</b></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", fontSize: "9px", textAlign: "center", marginTop: "2px" }}>
        <div>Back Feet</div>
        <div>Front Feet</div>
        <div>Front Feet</div>
        <div>Back Feet</div>
      </div>
    </div>

    {/* Panel Horizontal - Push */}
    <div className="callout">
      <h4>(+) = Push Back &gt; Front &nbsp;&nbsp;&nbsp; (−) = Push Front &gt; Back</h4>
      <div style={{ border: "1px solid #999", padding: "4px", background: "#fff", marginBottom: "8px" }}>
        <Graphic file="imagen2.png" alt="Push Correction" style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", fontSize: "11px", textAlign: "center" }}>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.HN)}</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.HF)}</b></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", fontSize: "9px", textAlign: "center", marginTop: "2px" }}>
        <div>Back Feet</div>
        <div>Front Feet</div>
        <div>Front Feet</div>
        <div>Back Feet</div>
      </div>
    </div>
  </div>

  <div className="muted" style={{ marginTop: 8 }}>
    *Las direcciones (+/−) dependen de tu convención de cero y sentido de lectura. Los valores son magnitudes objetivo.
  </div>
</div>

        {/* Notes */}
        {r.description && (
          <div className="section">
            <h3>Notes</h3>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{r.description}</div>
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
