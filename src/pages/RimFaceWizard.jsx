import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RimFaceWizard() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [skipLeftSide, setSkipLeftSide] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [variance, setVariance] = useState(null);
  const [range, setRange] = useState(null);
  const [finalOutput, setFinalOutput] = useState(null);

  const [physical, setPhysical] = useState({ H: "", D: "", E: "", F: "", G: "" });
  const [indicators, setIndicators] = useState({
    R0: "0", R90: "", R180: "", R270: "",
    F0: "0", F90: "", F180: "", F270: "",
    SAG: "0"
  });
  const [project, setProject] = useState({ machine_name: "", description: "" });

  const onPhy = e => setPhysical(s => ({ ...s, [e.target.name]: e.target.value }));
  const onInd = e => setIndicators(s => ({ ...s, [e.target.name]: e.target.value }));
  const onPrj = e => setProject(s => ({ ...s, [e.target.name]: e.target.value }));

  async function newSession() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API}/api/rim-face/session`, {
        method: "POST", headers,
        credentials: "include", body: JSON.stringify(project)
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Cannot create session");
      setSessionId(data.sessionId);
      setStep(2);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function savePhysical() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API}/api/rim-face/session/${sessionId}/physical`, {
        method: "PUT", headers,
        credentials: "include",
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(physical).map(([k,v])=>[k, v===""? null:Number(v)])),
          skipLeftSide
        })
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Invalid Physical Data");
      setStep(3);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function saveIndicators() {
    setLoading(true); setError("");
    try {
      const body = Object.fromEntries(Object.entries(indicators).map(([k,v]) => [k, Number(v)]));
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API}/api/rim-face/session/${sessionId}/indicators`, {
        method: "PUT", headers,
        credentials: "include", body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Invalid Indicators");
      setVariance(data.variance); setRange(data.range);
      setStep(4);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function calculate() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API}/api/rim-face/session/${sessionId}/calculate`, {
        method: "POST", credentials: "include", headers
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Calc error");
      setFinalOutput(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Navigation → New */}
      {step === 1 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Rim & Face Alignment — New</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Machine Identification</label>
                <input name="machine_name" value={project.machine_name} onChange={onPrj}
                       className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <input name="description" value={project.description} onChange={onPrj}
                       className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={newSession} disabled={loading}>{loading ? "..." : "Next >"}</Button>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Step 1 of 3: Physical Data Input */}
      {step === 2 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Step 1 of 3: Physical Data Input</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Swing Diameter, (H)</label>
                <input name="H" value={physical.H} onChange={onPhy} className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
              <div>
                <label className="text-sm">Front Feet, Right Side (D)</label>
                <input name="D" value={physical.D} onChange={onPhy} className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
              <div>
                <label className="text-sm">Back Feet, Right Side (E)</label>
                <input name="E" value={physical.E} onChange={onPhy} className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
              {!skipLeftSide && (
                <>
                  <div>
                    <label className="text-sm">Front Feet, Left Side (F)</label>
                    <input name="F" value={physical.F} onChange={onPhy} className="w-full h-10 rounded-md border border-border bg-input px-3" />
                  </div>
                  <div>
                    <label className="text-sm">Back Feet, Left Side (G)</label>
                    <input name="G" value={physical.G} onChange={onPhy} className="w-full h-10 rounded-md border border-border bg-input px-3" />
                  </div>
                </>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={skipLeftSide} onChange={e => setSkipLeftSide(e.target.checked)} />
              Check here to skip "F" and "G" inputs. (Skip Left Side)
            </label>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>{"< Previous"}</Button>
              <Button onClick={savePhysical} disabled={loading}>{loading ? "..." : "Next >"}</Button>
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Step 2 of 3: Dial Gage Data Input */}
      {step === 3 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Step 2 of 3: Dial Gage Data Input</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {["R0","R90","R180","R270"].map(k => (
                <div key={k}><label className="text-sm">{k} Rim</label>
                  <input name={k} value={indicators[k]} onChange={onInd} className="w-full h-10 rounded-md border border-border bg-input px-3" />
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {["F0","F90","F180","F270"].map(k => (
                <div key={k}><label className="text-sm">{k} Face</label>
                  <input name={k} value={indicators[k]} onChange={onInd} className="w-full h-10 rounded-md border border-border bg-input px-3" />
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Number(indicators.SAG) !== 0} onChange={e => onInd({ target: { name: "SAG", value: e.target.checked ? "0" : "0" }})} />
              Sag Measurement Input (enter SAG below if any)
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="text-sm">SAG</label>
                <input name="SAG" value={indicators.SAG} onChange={onInd} className="w-full h-10 rounded-md border border-border bg-input px-3" />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>{"< Previous"}</Button>
              <Button onClick={saveIndicators} disabled={loading}>{loading ? "..." : "Next >"}</Button>
            </div>

            {variance && range && (
              <div className="text-xs text-muted-foreground mt-4">
                <div>VALIDITY RULE — Variance (Auto-Filled): Rim@180° off by: {variance.rim180_off_by}, Face@180° off by: {variance.face180_off_by}</div>
                <div>Range Calculation: Rim@180°: {range.rim180_within}, Face@180°: {range.face180_within}; Rim(Max): {range.rim_max}, Face(Max): {range.face_max}</div>
              </div>
            )}

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Step 3 of 3: Review/Final Input Data */}
      {step === 4 && (
        <Card className="bg-card">
          <CardHeader><CardTitle>Review/Final Input Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">Session #{sessionId}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>{"< Previous"}</Button>
              <Button onClick={calculate} disabled={loading}>{loading ? "Calculating..." : "Calculate"}</Button>
            </div>

            {finalOutput && (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-2">Vertical Direction — Right of Coupling</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border border-border p-3">Near: {Number(finalOutput.results.VN).toFixed(2)}</div>
                    <div className="rounded border border-border p-3">Far: {Number(finalOutput.results.VF).toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Horizontal Direction — Right of Coupling</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border border-border p-3">Near: {Number(finalOutput.results.HN).toFixed(2)}</div>
                    <div className="rounded border border-border p-3">Far: {Number(finalOutput.results.HF).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="text-destructive text-sm">{error}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
