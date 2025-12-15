// src/pages/Calculations.jsx
import { useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
// arriba del componente
const LOGIN_URL = `${API}/auth/google?redirect=/app/calculations`; // <-- NUEVO

export default function Calculations({ demo = false }) {
  const isDemo = useMemo(() => !!demo, [demo]);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [res, setRes] = useState(null); // { VN,VF,HN,HF }
  const [savedReportId, setSavedReportId] = useState(null); // ID del reporte guardado
  const [reportSaved, setReportSaved] = useState(false); // Si ya se guardó el reporte
  const [hasChanges, setHasChanges] = useState(false); // Si hubo cambios después de guardar

  // Step 1: Physical Data Input
  const [phy, setPhy] = useState({
    H: "",
    D: "",
    E: "",
    skipLeftSide: true,
    F: "",
    G: "",
  });

  // Step 2: Dial Gage Data Input
  const [ind, setInd] = useState({
    R90: "",
    R180: "",
    R270: "",
    F90: "",
    F180: "",
    F270: "",
    SAG: "0",
  });

  const onPhy = (e) => {
    setPhy((s) => ({ ...s, [e.target.name]: e.target.value }));
    if (reportSaved) setHasChanges(true);
  };
  const onInd = (e) => {
    setInd((s) => ({ ...s, [e.target.name]: e.target.value }));
    if (reportSaved) setHasChanges(true);
  };

  // Cargar datos del reporte si hay parámetro edit
  useEffect(() => {
    if (!editId) return;
    
    let cancel = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Accept: "application/json" };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API}/api/reports/${editId}`, {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Error al cargar el reporte");
        
        if (cancel) return;
        
        const report = json.report;
        const dims = typeof report.dims === "string" ? JSON.parse(report.dims) : report.dims || {};
        const indicators = typeof report.indicators === "string" ? JSON.parse(report.indicators) : report.indicators || {};
        const results = typeof report.results === "string" ? JSON.parse(report.results) : report.results || {};
        
        // Cargar dimensiones
        setPhy({
          H: String(dims.H || ""),
          D: String(dims.D || ""),
          E: String(dims.E || ""),
          skipLeftSide: !dims.F && !dims.G,
          F: String(dims.F || ""),
          G: String(dims.G || ""),
        });
        
        // Cargar indicadores
        setInd({
          R90: String(indicators.R90 || ""),
          R180: String(indicators.R180 || ""),
          R270: String(indicators.R270 || ""),
          F90: String(indicators.F90 || ""),
          F180: String(indicators.F180 || ""),
          F270: String(indicators.F270 || ""),
          SAG: String(report.sag || "0"),
        });
        
        // Si hay resultados, mostrarlos
        if (results && (results.VN || results.VF || results.HN || results.HF)) {
          setRes(results);
          setStep(3); // Ir directamente al paso de resultados
        }
        
        // Marcar que este reporte ya está guardado
        setSavedReportId(editId);
        setReportSaved(true);
        setHasChanges(false);
      } catch (e) {
        console.error("Error cargando reporte:", e);
        setError(`No se pudo cargar el reporte: ${e.message}`);
      }
    })();
    
    return () => { cancel = true; };
  }, [editId]);

  const num = (v) => Number(v);
  const empty = (o, keys) => keys.filter((k) => String(o[k]).trim() === "");

  async function handleCompute() {
    setError("");
    setPdfUrl("");
    setLoading(true);
    setRes(null);

    // Validaciones mínimas (Step 1)
    const miss1 = empty(phy, ["H", "D", "E"]);
    if (!phy.skipLeftSide) miss1.push(...empty(phy, ["F", "G"]));
    if (miss1.length) {
      setLoading(false);
      setError(
        "Completa las dimensiones requeridas (H, D, E" + (phy.skipLeftSide ? "" : ", F, G") + ")."
      );
      return;
    }
    if (num(phy.D) > num(phy.E)) {
      setLoading(false);
      setError("Invalid Distance D! D no puede ser mayor que E.");
      return;
    }

    // Validaciones mínimas (Step 2)
    const miss2 = empty(ind, ["R90", "R180", "R270", "F90", "F180", "F270"]);
    if (miss2.length) {
      setLoading(false);
      setError("Completa las lecturas Rim/Face (90°, 180°, 270°).");
      return;
    }

    // SAG a aplicar solo en 90°
    const SAG = Number(ind.SAG ?? 0);

    try {
      // Ajuste de SAG únicamente en 90° para Rim y Face
      const body = {
        R90: Number(ind.R90) + SAG,
        R180: Number(ind.R180),
        R270: Number(ind.R270),
        F90: Number(ind.F90) + SAG,
        F180: Number(ind.F180),
        F270: Number(ind.F270),
        H: Number(phy.H),
        D: Number(phy.D),
        E: Number(phy.E),
      };

      // -------- LOG DE ENVÍO --------
      console.groupCollapsed("%c[CALC] Payload -> /api/alignment/compute", "color:#0ea5e9");
      console.log("Step 1 (phy) RAW:", phy);
      console.log("Step 2 (ind) RAW:", ind);
      console.log("SAG aplicado @90°:", SAG);
      console.table(body);
      console.groupEnd();

      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`${API}/api/alignment/compute`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(body),
      });

      const contentType = resp.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await resp.json() : await resp.text();

      // -------- LOG DE RESPUESTA --------
      console.groupCollapsed("%c[CALC] Response <- /api/alignment/compute", "color:#22c55e");
      console.log("HTTP:", resp.status, resp.statusText);
      console.log("Content-Type:", contentType);
      if (isJson) {
        console.log("Respuesta JSON completa:", payload);
        if (payload?.results) console.table(payload.results);
      } else {
        console.log("Respuesta TEXTO/HTML:", payload);
      }
      console.groupEnd();

      if (!resp.ok || (isJson && payload?.ok === false)) {
        throw new Error(isJson ? payload.error || "Error en cálculo" : payload);
      }

      setRes(isJson ? payload.results : null); // { VN,VF,HN,HF }
      setStep(3); // mostrar review + resultados
    } catch (e) {
      console.error("[CALC] Error en compute:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReport(meta) {
    // Bloquear guardado/export en DEMO
    if (isDemo) {
      setError("Modo demo: crear reporte y exportar a PDF están deshabilitados.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setPdfUrl("");

      const payload = {
        title: meta.title,
        equipmentId: meta.equipmentId,
        description: meta.description,
        sag: Number(ind.SAG ?? 0),
        dims: {
          H: Number(phy.H),
          D: Number(phy.D),
          E: Number(phy.E),
          ...(phy.F ? { F: Number(phy.F) } : {}),
          ...(phy.G ? { G: Number(phy.G) } : {}),
        },
        indicators: {
          R90: Number(ind.R90),
          R180: Number(ind.R180),
          R270: Number(ind.R270),
          F90: Number(ind.F90),
          F180: Number(ind.F180),
          F270: Number(ind.F270),
          SAG: Number(ind.SAG ?? 0),
        },
        results: res, // { VN,VF,HN,HF }
      };

      console.groupCollapsed("%c[REPORT] Payload -> /api/reports", "color:#06b6d4");
      console.table(payload.dims);
      console.table(payload.indicators);
      console.table(payload.results);
      console.groupEnd();

      // Si ya hay un reporte guardado y estamos editando, hacer PUT en lugar de POST
      const isUpdate = savedReportId && hasChanges;
      const url = isUpdate ? `${API}/api/reports/${savedReportId}` : `${API}/api/reports`;
      const method = isUpdate ? "PUT" : "POST";
      
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const ct = r.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const data = isJson ? await r.json() : await r.text();

      console.groupCollapsed("%c[REPORT] Response <- /api/reports", "color:#22c55e");
      console.log("HTTP:", r.status, r.statusText);
      console.log("Content-Type:", ct);
      console.log("Payload:", data);
      console.groupEnd();

      if (!r.ok || (isJson && data?.ok === false)) {
        throw new Error(isJson ? data.error || "Error creando reporte" : data);
      }

      if (isJson && data.pdfUrl) setPdfUrl(data.pdfUrl);
      
      // Marcar como guardado y obtener el ID del reporte
      if (isJson && data.ok) {
        const reportId = data.report?.id || data.id || savedReportId;
        setSavedReportId(reportId);
        setReportSaved(true);
        setHasChanges(false);
      }
    } catch (e) {
      console.error("[REPORT] Error:", e);
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Aviso DEMO */}
      {isDemo && (
  <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <p>
      <strong>Modo demo:</strong> puedes realizar el cálculo completo, pero
      <strong> no se guardarán</strong> datos ni podrás <strong>exportar a PDF</strong>.
    </p>
    <a href={LOGIN_URL} className="shrink-0">
      <Button size="sm">Iniciar sesión y continuar</Button>
    </a>
  </div>
)}

      {/* Step 1 of 3: Physical Data Input */}
      {step === 1 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Rim & Face — Step 1 of 3: Physical Data Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Field label="Swing Diameter, (H)">
                  <input
                    className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    name="H"
                    value={phy.H}
                    onChange={onPhy}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Front Feet, Right Side (D)">
                  <input
                    className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    name="D"
                    value={phy.D}
                    onChange={onPhy}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Back Feet, Right Side (E)">
                  <input
                    className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    name="E"
                    value={phy.E}
                    onChange={onPhy}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>

                {!phy.skipLeftSide && (
                  <>
                    <Field label="Front Feet, Left Side (F)">
                      <input
                        className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        name="F"
                        value={phy.F}
                        onChange={onPhy}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </Field>
                    <Field label="Back Feet, Left Side (G)">
                      <input
                        className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        name="G"
                        value={phy.G}
                        onChange={onPhy}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </Field>
                  </>
                )}

                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={phy.skipLeftSide}
                    onChange={(e) => setPhy((s) => ({ ...s, skipLeftSide: e.target.checked }))}
                  />
                  Left Side of Coupling: Check here to skip "F" and "G" inputs.
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next &gt;</Button>
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Step 2 of 3: Dial Gage Data Input */}
      {step === 2 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Step 2 of 3: Dial Gage Data Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Rim</h3>
                {["R90", "R180", "R270"].map((k) => (
                  <Field key={k} label={k}>
                    <input
                      className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      name={k}
                      value={ind[k]}
                      onChange={onInd}
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </Field>
                ))}
                <Field label="SAG (if any)">
                  <input
                    className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    name="SAG"
                    value={ind.SAG}
                    onChange={onInd}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Face</h3>
                {["F90", "F180", "F270"].map((k) => (
                  <Field key={k} label={k}>
                    <input
                      className="h-10 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      name={k}
                      value={ind[k]}
                      onChange={onInd}
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                &lt; Previous
              </Button>
              <Button onClick={handleCompute} disabled={loading}>
                {loading ? "Calculating..." : "Next >"}
              </Button>
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Step 3 of 3: Review / Final + Results */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Vista previa del reporte */}
          <Card className="bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-card-foreground">Vista Previa del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Header del reporte */}
              <div className="text-center mb-6 pb-4 border-b border-border">
                <h2 className="text-2xl font-bold mb-2">Alignment Procedure Report</h2>
                <p className="text-sm text-muted-foreground">Rim and Face Method</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleString()}
                </p>
              </div>

              {/* Sección de datos de entrada */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b border-border pb-2">
                    Equipment Measurements (inches)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                      <span className="text-muted-foreground">H (Swing diameter):</span>
                      <span className="font-medium">{phy.H}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                      <span className="text-muted-foreground">D (Near feet → face):</span>
                      <span className="font-medium">{phy.D}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                      <span className="text-muted-foreground">E (Feet spacing):</span>
                      <span className="font-medium">{phy.E}</span>
                    </div>
                    {!phy.skipLeftSide && (
                      <>
                        <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                          <span className="text-muted-foreground">F (Left front):</span>
                          <span className="font-medium">{phy.F}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                          <span className="text-muted-foreground">G (Left back):</span>
                          <span className="font-medium">{phy.G}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b border-border pb-2">
                    Dial Indicator Readings
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="py-1 px-2 rounded hover:bg-accent/50">
                      <div className="font-medium mb-1">Rim</div>
                      <div className="flex gap-4 text-muted-foreground">
                        <span>90°: <strong className="text-foreground">{ind.R90}</strong></span>
                        <span>180°: <strong className="text-foreground">{ind.R180}</strong></span>
                        <span>270°: <strong className="text-foreground">{ind.R270}</strong></span>
                      </div>
                    </div>
                    <div className="py-1 px-2 rounded hover:bg-accent/50">
                      <div className="font-medium mb-1">Face</div>
                      <div className="flex gap-4 text-muted-foreground">
                        <span>90°: <strong className="text-foreground">{ind.F90}</strong></span>
                        <span>180°: <strong className="text-foreground">{ind.F180}</strong></span>
                        <span>270°: <strong className="text-foreground">{ind.F270}</strong></span>
                      </div>
                    </div>
                    <div className="flex justify-between py-1 px-2 rounded hover:bg-accent/50">
                      <span className="text-muted-foreground">SAG adjustment @90°:</span>
                      <span className="font-medium">{ind.SAG}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultados calculados */}
              {res && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-border pb-2">
                    Calculated Results
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Vertical */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Vertical Direction</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-accent/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Near (Front Feet)</div>
                          <div className="text-3xl font-bold text-primary">{Number(res.VN).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {Number(res.VN) >= 0 ? "Add shims" : "Remove shims"}
                          </div>
                        </div>
                        <div className="bg-accent/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Far (Back Feet)</div>
                          <div className="text-3xl font-bold text-primary">{Number(res.VF).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {Number(res.VF) >= 0 ? "Add shims" : "Remove shims"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Horizontal Direction</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-accent/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Near</div>
                          <div className="text-3xl font-bold text-primary">{Number(res.HN).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {Number(res.HN) >= 0 ? "Push Back → Front" : "Push Front → Back"}
                          </div>
                        </div>
                        <div className="bg-accent/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Far</div>
                          <div className="text-3xl font-bold text-primary">{Number(res.HF).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {Number(res.HF) >= 0 ? "Push Front → Back" : "Push Back → Front"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario para crear/actualizar reporte */}
          {res && !isDemo && (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  {reportSaved && !hasChanges ? "Reporte Guardado" : hasChanges ? "Actualizar Reporte" : "Guardar Reporte"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportSaved && !hasChanges ? (
                  <div className="text-sm p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 text-2xl">✓</div>
                      <div className="flex-1">
                        <p className="font-medium text-green-700 mb-1">Este reporte ya está guardado</p>
                        <p className="text-muted-foreground text-xs">
                          Si deseas guardar un nuevo cálculo, modifica los valores en los pasos anteriores.
                        </p>
                        {pdfUrl && (
                          <a className="text-primary underline font-medium text-sm mt-2 inline-block" href={pdfUrl} target="_blank" rel="noreferrer">
                            Ver/Descargar PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <ReportMeta 
                      onCreate={handleCreateReport} 
                      creating={creating}
                      isUpdate={hasChanges}
                    />
                    {pdfUrl && (
                      <div className="text-sm p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                        ✓ Reporte {hasChanges ? 'actualizado' : 'creado'} exitosamente.{" "}
                        <a className="text-primary underline font-medium" href={pdfUrl} target="_blank" rel="noreferrer">
                          Ver/Descargar PDF
                        </a>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Aviso en DEMO */}
          {res && isDemo && (
            <Card className="bg-card border-yellow-400/30">
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <span className="text-sm">
                    Para guardar o exportar a PDF, inicia sesión y usa la versión completa en{" "}
                    <span className="font-medium">/app/calculations</span>.
                  </span>
                  <a href={LOGIN_URL} className="shrink-0">
                    <Button size="sm" variant="default">Iniciar sesión y continuar</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navegación */}
          <Card className="bg-card">
            <CardContent className="py-4">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  ← Volver a lecturas
                </Button>
                {pdfUrl && (
                  <Button onClick={() => window.location.reload()}>
                    Nuevo cálculo
                  </Button>
                )}
              </div>
              {error && <div className="text-destructive text-sm mt-3">{error}</div>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers de UI ---------- */
function Field({ label, children }) {
  return (
    <div className="grid grid-cols-2 gap-3 items-center">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ResultCard({ title, value, note }) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{Number(value).toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function ReportMeta({ onCreate, creating, isUpdate }) {
  const [title, setTitle] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{isUpdate ? "Actualizar datos del reporte" : "Datos del reporte"}</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <input
          className="h-10 rounded-md border border-border bg-input px-3 text-sm"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="h-10 rounded-md border border-border bg-input px-3 text-sm"
          placeholder="Equipment ID (optional)"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
        />
        <input
          className="h-10 rounded-md border border-border bg-input px-3 text-sm"
          placeholder="Notes / Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onCreate({ title, equipmentId, description })} disabled={creating}>
          {creating ? (isUpdate ? "Actualizando..." : "Creando...") : (isUpdate ? "Actualizar Reporte" : "Crear Reporte")}
        </Button>
      </div>
    </div>
  );
}
