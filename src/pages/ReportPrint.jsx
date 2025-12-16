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
        .report-wrapper { max-width: 800px; margin: 12px auto; padding: 12px; background:#fff; color:#000; box-shadow: 0 2px 6px rgba(0,0,0,.1); }
        @media (min-width: 640px) { .report-wrapper { margin: 20px auto; padding: 20px; } }
        .title { font-size:16px; font-weight:700; text-align:center; margin-bottom:6px; }
        @media (min-width: 640px) { .title { font-size:20px; } }
        .subtitle { font-size:10px; text-align:center; margin-bottom:14px; color:#444; line-height:1.4; }
        @media (min-width: 640px) { .subtitle { font-size:12px; margin-bottom:20px; } }
        .section { margin-bottom:14px; page-break-inside: avoid; }
        @media (min-width: 640px) { .section { margin-bottom:18px; } }
        .section h3 { font-size:12px; border-bottom:1px solid #333; padding-bottom:3px; margin-bottom:6px; }
        @media (min-width: 640px) { .section h3 { font-size:13px; padding-bottom:4px; margin-bottom:8px; } }
        .table { width:100%; border-collapse:collapse; font-size:10px; overflow-x:auto; display:block; }
        @media (min-width: 640px) { .table { font-size:11px; display:table; } }
        .table th, .table td { border:1px solid #aaa; padding:3px 4px; white-space:nowrap; }
        @media (min-width: 640px) { .table th, .table td { padding:4px 6px; } }
        .panel { border:1px solid #999; padding:6px; background:#fff; }
        @media (min-width: 640px) { .panel { padding:8px; } }
        .panel-title { font-size:11px; font-weight:700; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:3px; }
        @media (min-width: 640px) { .panel-title { font-size:12px; margin-bottom:6px; padding-bottom:4px; } }
        .footer { font-size:9px; color:#555; display:flex; justify-content:space-between; margin-top:16px; flex-wrap:wrap; gap:8px; }
        @media (min-width: 640px) { .footer { font-size:10px; margin-top:20px; } }
        .grid-2 { display:grid; grid-template-columns: 1fr; gap:10px; }
        @media (min-width: 768px) { .grid-2 { grid-template-columns: 1fr 1fr; gap:12px; } }
        @media (min-width: 768px) { .grid-2 { grid-template-columns: 1fr 1fr; gap:12px; } }
        .grid-4 { display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; }
        @media (min-width: 640px) { .grid-4 { grid-template-columns: repeat(4, 1fr); gap:8px; } }
        .kpi { display:grid; grid-template-columns: 100px 1fr; gap:6px; align-items:center; }
        @media (min-width: 640px) { .kpi { grid-template-columns: 120px 1fr; gap:8px; } }
        .kpi .valuebox { display:flex; align-items:center; gap:4px; border:1px solid #777; padding:3px 4px; min-height:30px; font-size:10px; }
        @media (min-width: 640px) { .kpi .valuebox { gap:6px; padding:4px 6px; min-height:34px; font-size:11px; } }
        .muted { color:#666; font-size:9px; }
        @media (min-width: 640px) { .muted { font-size:10px; } }
        .callout { border:1px solid #aaa; padding:8px; }
        @media (min-width: 640px) { .callout { padding:10px; } }
        .callout h4 { margin:0 0 4px 0; font-size:10px; }
        @media (min-width: 640px) { .callout h4 { margin:0 0 6px 0; font-size:12px; } }
        .pill { display:inline-block; border:1px solid #aaa; padding:2px 5px; border-radius:12px; font-size:9px; background:#f6f6f6; }
        @media (min-width: 640px) { .pill { padding:2px 6px; font-size:10px; } }
        .results-grid { display:grid; grid-template-columns:1fr; gap:10px; }
        @media (min-width: 768px) { .results-grid { grid-template-columns:2.2fr 1.3fr 2.2fr; } }
        .correction-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; font-size:10px; text-align:center; }
        @media (min-width: 640px) { .correction-grid { font-size:11px; } }
        .correction-labels { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; font-size:8px; text-align:center; margin-top:2px; }
        @media (min-width: 640px) { .correction-labels { font-size:9px; } }
      `}</style>

      <div className="no-print p-3 sm:p-4 flex flex-col sm:flex-row gap-2 justify-center">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={() => window.location.href = `/app/calculations?edit=${id}`}
          className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          ✏️ Editar reporte
        </button>
        <Link 
          to="/app/reports" 
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          ← Volver
        </Link>
      </div>

      <div className="report-wrapper">
        {/* Header */}
        <div className="title">Reporte de Procedimiento de Alineación</div>
        <div className="subtitle">
          Método de Aro y Cara<br />
          Fecha del Reporte: {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}<br />
          Preparado por: {r.user_name || r.user_email || r.performer_name || "N/A"}
        </div>

        {/* Date/Equipment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px", marginBottom: "10px", fontSize: 10 }}>
          <div><b>Fecha/Hora de Creación de Datos de Alineación:</b> {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</div>
          <div><b>ID del Equipo (si aplica):</b> {r.equipment_id ?? "N/A"}</div>
        </div>

        {/* Inputs / Readings */}
        <div className="grid-2" style={{ marginBottom: "14px" }}>
          {/* LEFT: Equipment */}
          <div className="panel">
            <div className="panel-title">Medidas del Equipo (Constantes, en Pulgadas)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", alignItems: "start" }}>
              <div style={{ border: "1px solid #bbb", padding: "6px", margin: "0 auto", maxWidth: "160px" }}>
                {/* Usa un esquema de acople de tu set */}
                <Graphic file="Rimface_1.bmp" alt="Diagrama del equipo" style={{ maxWidth: "100%", display: "block" }} />
                <div className="muted" style={{ marginTop: "6px" }}>
                  <b>Caída (si aplica):</b> {typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "N/A")}
                </div>
              </div>
              <div style={{ fontSize: 10 }}>
                <div>H (Diámetro de giro): <b>{r.dims?.H ?? "N/A"}</b></div>
                <div>D (Pies cercanos → cara): <b>{r.dims?.D ?? "N/A"}</b></div>
                <div>E (Espaciado de pies): <b>{r.dims?.E ?? "N/A"}</b></div>
                <div>F (Frente izquierdo): <b>{r.dims?.F ?? "N/A"}</b></div>
                <div>G (Atrás izquierdo): <b>{r.dims?.G ?? "N/A"}</b></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Readings */}
          <div className="panel">
            <div className="panel-title">Lecturas del Indicador de Cuadrante (Usar Números Enteros)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", alignItems: "start" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr><th>Conjunto</th><th>90°</th><th>180°</th><th>270°</th><th>0°</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Aro</td>
                      <td>{r.indicators?.R90 ?? "0"}</td>
                      <td>{r.indicators?.R180 ?? "0"}</td>
                      <td>{r.indicators?.R270 ?? "0"}</td>
                      <td>{r.indicators?.R0 ?? r.indicators?.R360 ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>Cara</td>
                      <td>{r.indicators?.F90 ?? "0"}</td>
                      <td>{r.indicators?.F180 ?? "0"}</td>
                      <td>{r.indicators?.F270 ?? "0"}</td>
                      <td>{r.indicators?.F0 ?? r.indicators?.F360 ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="muted" style={{ marginTop: "6px" }}>
                  Ajustado por CAÍDA @90°: <b>{typeof r.sag === "number" ? r.sag.toFixed(3) : (r.sag ?? "0.000")}</b> • Números del indicador: 0.001" = 1
                </div>
              </div>
              <div style={{ border: "1px solid #bbb", padding: "6px", margin: "0 auto", maxWidth: "160px" }}>
                {/* Usa el círculo de lecturas de tu set */}
                <Graphic file="Revdial_1.bmp" alt="Círculo de indicador" style={{ maxWidth: "100%", display: "block" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Soft-Foot + Performer (opcional si lo usas) */}
        <div className="panel" style={{ marginBottom: "14px", fontSize: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
            <div>
              <div><b>¿Se detectó pie blando?</b>&nbsp;
                <span>[ {r.softFootDetected ? "X" : " "} ] Sí&nbsp;&nbsp;[ {!r.softFootDetected ? "X" : " "} ] No</span>
              </div>
              <div style={{ marginTop: "6px" }}><b>Si la respuesta es sí, ¿se corrigió?</b>&nbsp;
                <span>[ {r.softFootCorrected ? "X" : " "} ] Sí&nbsp;&nbsp;[ {!r.softFootCorrected ? "X" : " "} ] No</span>
              </div>
            </div>
            <div>
              <div><b>Persona que Realizó la Alineación:</b></div>
              <div style={{ marginTop: "8px", borderTop: "1px solid #000", width: "100%", maxWidth: "240px", paddingTop: "4px" }}>
                <span style={{ fontWeight: "bold" }}>X</span>&nbsp;&nbsp;{r.performer_name || r.user_name || r.user_email || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* === BLOQUE estilo "última captura" (Angularity/Offset + paneles) === */}
<div className="section">
  <h3>Resultados Calculados Basados en Dimensiones Físicas y Datos de Entrada</h3>

  {/* Fila principal con 3 columnas: Vertical | Thermal | Horizontal */}
  <div className="results-grid" style={{marginBottom:"14px"}}>
    
    {/* COLUMNA IZQUIERDA - Vertical */}
    <div>
      <div style={{fontSize:"9px", marginBottom:"6px", lineHeight:"1.2", fontWeight:"600"}}>
        Angularidad y desplazamiento a la derecha del acoplamiento - dirección vertical:
        <span style={{float:"right"}}>&gt;&gt;</span>
      </div>
      
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px"}}>
        {/* Angularity Vertical */}
        <div style={{border:"1px solid #999", padding:"8px 6px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"10px", marginBottom:"4px", fontWeight:"600"}}>Angularidad</div>
          <div style={{fontSize:"18px", fontWeight:"700", marginBottom:"6px"}}>
            {Number.isFinite(clocks?.angV) ? clocks.angV.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconAng value={clocks?.angV} />
          </div>
        </div>
        
        {/* Offset Vertical */}
        <div style={{border:"1px solid #999", padding:"8px 6px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"10px", marginBottom:"4px", fontWeight:"600"}}>Desplazamiento</div>
          <div style={{fontSize:"18px", fontWeight:"700", marginBottom:"6px"}}>
            {Number.isFinite(clocks?.offsetV) ? clocks.offsetV.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconOff value={clocks?.offsetV} />
          </div>
        </div>
      </div>
    </div>

    {/* COLUMNA CENTRAL - Thermal Expansion */}
    <div style={{border:"1px solid #999", padding:"12px 10px", textAlign:"center", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", background:"#f9f9f9"}}>
      <div style={{fontSize:"9px", fontWeight:"600", marginBottom:"8px", lineHeight:"1.3"}}>
        Expansión Térmica<br/>Calculada (si disponible):
      </div>
      <div style={{fontSize:"16px", fontWeight:"700", marginBottom:"3px"}}>N/A</div>
      <div style={{fontSize:"8px", color:"#666"}}>(Milésimas)</div>
    </div>

    {/* COLUMNA DERECHA - Horizontal */}
    <div>
      <div style={{fontSize:"9px", marginBottom:"6px", lineHeight:"1.2", fontWeight:"600"}}>
        Angularidad y desplazamiento a la derecha del acoplamiento - plano horizontal:
        <span style={{float:"right"}}>&lt;&lt;</span>
      </div>
      
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px"}}>
        {/* Angularity Horizontal */}
        <div style={{border:"1px solid #999", padding:"8px 6px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"10px", marginBottom:"4px", fontWeight:"600"}}>Angularidad</div>
          <div style={{fontSize:"18px", fontWeight:"700", marginBottom:"6px"}}>
            {Number.isFinite(clocks?.angH) ? clocks.angH.toFixed(1) : "N/A"}
          </div>
          <div style={{display:"flex", justifyContent:"center"}}>
            <IconAng value={clocks?.angH} />
          </div>
        </div>
        
        {/* Offset Horizontal */}
        <div style={{border:"1px solid #999", padding:"8px 6px", textAlign:"center", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          <div style={{fontSize:"10px", marginBottom:"4px", fontWeight:"600"}}>Desplazamiento</div>
          <div style={{fontSize:"18px", fontWeight:"700", marginBottom:"6px"}}>
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
      <h4>(+) = Agregar Calzas &nbsp;&nbsp;&nbsp; (−) = Quitar Calzas</h4>
      <div style={{ border: "1px solid #999", padding: "4px", background: "#fff", marginBottom: "8px" }}>
        <Graphic file="imagen1.png" alt="Corrección de Calzas" style={{ width: "100%", display: "block" }} />
      </div>
      <div className="correction-grid">
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.VN)}</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.VF)}</b></div>
      </div>
      <div className="correction-labels">
        <div>Pies Traseros</div>
        <div>Pies Delanteros</div>
        <div>Pies Delanteros</div>
        <div>Pies Traseros</div>
      </div>
    </div>

    {/* Panel Horizontal - Push */}
    <div className="callout">
      <h4>(+) = Empujar Atrás &gt; Frente &nbsp;&nbsp;&nbsp; (−) = Empujar Frente &gt; Atrás</h4>
      <div style={{ border: "1px solid #999", padding: "4px", background: "#fff", marginBottom: "8px" }}>
        <Graphic file="imagen2.png" alt="Corrección de Empuje" style={{ width: "100%", display: "block" }} />
      </div>
      <div className="correction-grid">
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#f5f5f5" }}><b>N/A</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.HN)}</b></div>
        <div style={{ border: "1px solid #999", padding: "6px 4px", background: "#fff" }}><b>{fmt(r.results?.HF)}</b></div>
      </div>
      <div className="correction-labels">
        <div>Pies Traseros</div>
        <div>Pies Delanteros</div>
        <div>Pies Delanteros</div>
        <div>Pies Traseros</div>
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
            <h3>Notas</h3>
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
