// src/pages/Calculations.jsx
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Calculations() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [res, setRes] = useState(null); // { VN,VF,HN,HF }

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

  const onPhy = (e) => setPhy((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onInd = (e) => setInd((s) => ({ ...s, [e.target.name]: e.target.value }));

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

      const resp = await fetch(`${API}/api/alignment/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const r = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (e) {
      console.error("[REPORT] Error:", e);
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
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
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Step 3 of 3: Review / Final Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen */}
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Physical dimensions (inches)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>H: {phy.H}</li>
                  <li>D: {phy.D}</li>
                  <li>E: {phy.E}</li>
                  {!phy.skipLeftSide && (
                    <>
                      <li>F: {phy.F}</li>
                      <li>G: {phy.G}</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dial indicator readings</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    Rim — 90°:{ind.R90}, 180°:{ind.R180}, 270°:{ind.R270}
                  </li>
                  <li>
                    Face — 90°:{ind.F90}, 180°:{ind.F180}, 270°:{ind.F270}
                  </li>
                  <li>Adjusted for SAG @90°: {ind.SAG}</li>
                </ul>
              </div>
            </div>

            {/* Resultados Near/Far */}
            {res && (
              <div className="grid md:grid-cols-4 gap-4">
                <ResultCard title="Vertical — Near" value={res.VN} note="Add/Remove shims (Front Feet)" />
                <ResultCard title="Vertical — Far" value={res.VF} note="Add/Remove shims (Back Feet)" />
                <ResultCard title="Horizontal — Near" value={res.HN} note="Push Back > Front" />
                <ResultCard title="Horizontal — Far" value={res.HF} note="Push Front > Back" />
              </div>
            )}

            {/* Crear Reporte (PDF + BD) */}
            {res && (
              <>
                <ReportMeta onCreate={handleCreateReport} creating={creating} />
                {pdfUrl && (
                  <div className="text-sm mt-2">
                    Reporte listo:&nbsp;
                    <a className="text-primary underline" href={pdfUrl} target="_blank">
                      Descargar PDF
                    </a>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                &lt; Previous
              </Button>
              <Button onClick={() => window.print()}>Print (temporal)</Button>
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
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

function ReportMeta({ onCreate, creating }) {
  const [title, setTitle] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Crear Reporte</h3>
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
          {creating ? "Creating..." : "Create Report"}
        </Button>
      </div>
    </div>
  );
}
