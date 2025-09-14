import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AlignmentWizard() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [form, setForm] = useState({
    method: "rim_face",
    machine_name: "",
    description: "",
    // Dimensiones
    H: "", D: "", E: "", F: "", G: "",
    // Lecturas
    R90: "", R180: "", R270: "",
    F90: "", F180: "", F270: "",
    SAG: "",
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  async function createSession() {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/api/alignment/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          method: form.method,
          machine_name: form.machine_name || null,
          description: form.description || null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "No se pudo crear sesión");
      setSessionId(data.sessionId);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function saveDimensionsNext() {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/api/alignment/session/${sessionId}/dimensions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          H: Number(form.H), D: Number(form.D), E: Number(form.E),
          F: form.F ? Number(form.F) : null,
          G: form.G ? Number(form.G) : null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Error guardando dimensiones");
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function saveReadingsNext() {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/api/alignment/session/${sessionId}/readings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          R90: Number(form.R90), R180: Number(form.R180), R270: Number(form.R270),
          F90: Number(form.F90), F180: Number(form.F180), F270: Number(form.F270),
          SAG: form.SAG ? Number(form.SAG) : null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Error guardando lecturas");
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function doCalculate() {
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/api/alignment/session/${sessionId}/calculate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Error de cálculo");
      setResults(data.results); // { VN,VF,HN,HF }
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Paso 1: Datos del proyecto */}
      {step === 1 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Nuevo Proyecto – Método Rim & Face</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Nombre de máquina</label>
                <input name="machine_name" className="w-full h-10 rounded-md border border-border bg-input px-3"
                       value={form.machine_name} onChange={onChange} placeholder="Ej. Bomba A - Línea 1" />
              </div>
              <div>
                <label className="text-sm">Descripción</label>
                <input name="description" className="w-full h-10 rounded-md border border-border bg-input px-3"
                       value={form.description} onChange={onChange} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={createSession} disabled={loading}>{loading ? "Creando..." : "Siguiente"}</Button>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Dimensiones */}
      {step === 2 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Dimensiones (inches)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {["H","D","E","F","G"].map(k => (
                <div key={k}>
                  <label className="text-sm">{k}</label>
                  <input name={k} value={form[k]} onChange={onChange} placeholder="0"
                         className="w-full h-10 rounded-md border border-border bg-input px-3" />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={saveDimensionsNext} disabled={loading}>{loading ? "Guardando..." : "Siguiente"}</Button>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Lecturas */}
      {step === 3 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Lecturas de Indicadores</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-semibold">Rim</h4>
              {["R90","R180","R270"].map(k => (
                <div key={k}>
                  <label className="text-sm">{k}</label>
                  <input name={k} value={form[k]} onChange={onChange} placeholder="0"
                         className="w-full h-10 rounded-md border border-border bg-input px-3" />
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-semibold">Face</h4>
              {["F90","F180","F270"].map(k => (
                <div key={k}>
                  <label className="text-sm">{k}</label>
                  <input name={k} value={form[k]} onChange={onChange} placeholder="0"
                         className="w-full h-10 rounded-md border border-border bg-input px-3" />
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm">SAG (opcional)</label>
                <input name="SAG" value={form.SAG} onChange={onChange} placeholder="0"
                       className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button onClick={saveReadingsNext} disabled={loading}>{loading ? "Guardando..." : "Siguiente"}</Button>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Resumen + Cálculo */}
      {step === 4 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Resumen y Cálculo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">Sesión #{sessionId}</div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
              <Button onClick={doCalculate} disabled={loading}>{loading ? "Calculando..." : "Calcular"}</Button>
            </div>

            {results && (
              <div className="grid md:grid-cols-4 gap-4 mt-4">
                {Object.entries(results).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-4">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="text-2xl font-bold">{Number(v).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
