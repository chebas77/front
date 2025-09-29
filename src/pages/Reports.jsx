import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { jsPDF } from "jspdf";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Reports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API}/api/reports`, { credentials: "include" });
        const json = await res.json();

        if (!res.ok || !json.ok) throw new Error(json.error || "Error al cargar reportes");
        if (!cancel) {
          setItems(json.items);
        }
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, []);

  const generatePdf = (r) => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Alignment Procedure Report", 105, yPosition, null, null, "center");
    yPosition += 15;

    // Fecha del reporte
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Date: ${new Date(r.created_at).toLocaleString()}`, 105, yPosition, null, null, "center");
    yPosition += 10;

    // Método Rim and Face
    doc.text("Rim and Face Method", 105, yPosition, null, null, "center");
    yPosition += 20;

    // Información del Usuario
    doc.setFontSize(11);
    doc.text(`User: ${r.user_name || r.user_email || "N/A"}`, 20, yPosition);
    yPosition += 5;
    if (r.equipment_id) doc.text(`Equipment ID: ${r.equipment_id}`, 20, yPosition);
    yPosition += 5;
    if (r.title) doc.text(`Title: ${r.title}`, 20, yPosition);
    yPosition += 10;

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Dimensiones
    const dims = r.dims || {};
    if (Object.keys(dims).length > 0) {
      doc.setFontSize(12);
      doc.text("Equipment Measurements (inches):", 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`H (Swing diameter): ${dims.H ?? 'N/A'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`D (Near feet → face): ${dims.D ?? 'N/A'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`E (Feet spacing): ${dims.E ?? 'N/A'}`, 20, yPosition);
      yPosition += 5;
      if (dims.F || dims.G) {
        doc.text(`F (Left front): ${dims.F ?? 'N/A'}`, 20, yPosition);
        yPosition += 5;
        doc.text(`G (Left back): ${dims.G ?? 'N/A'}`, 20, yPosition);
        yPosition += 8;
      }
    } else {
      doc.text("Equipment Measurements: Data not available", 20, yPosition);
      yPosition += 8;
    }

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Indicadores
    const indicators = r.indicators || {};
    if (Object.keys(indicators).length > 0) {
      doc.setFontSize(12);
      doc.text("Dial Indicator Readings:", 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Rim — 90°: ${indicators.R90 ?? 'N/A'}, 180°: ${indicators.R180 ?? 'N/A'}, 270°: ${indicators.R270 ?? 'N/A'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Face — 90°: ${indicators.F90 ?? 'N/A'}, 180°: ${indicators.F180 ?? 'N/A'}, 270°: ${indicators.F270 ?? 'N/A'}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Adjusted for SAG @90°: ${r.sag ?? 'N/A'}`, 20, yPosition);
      yPosition += 10;
    } else {
      doc.text("Dial Indicator Readings: Data not available", 20, yPosition);
      yPosition += 8;
    }

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Resultados Calculados
    const results = r.results || {};
    doc.setFontSize(12);
    doc.text("Calculated Results:", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);

    if (Object.keys(results).length > 0) {
      const resultsArr = [
        ["Vertical — Near (VN)", results.VN ?? 'N/A'],
        ["Vertical — Far  (VF)", results.VF ?? 'N/A'],
        ["Horizontal — Near (HN)", results.HN ?? 'N/A'],
        ["Horizontal — Far  (HF)", results.HF ?? 'N/A'],
      ];
      resultsArr.forEach((result, index) => {
        doc.text(result[0], 20, yPosition + index * 8);
        doc.text(
          typeof result[1] === "number" ? result[1].toFixed(2) : result[1],
          150,
          yPosition + index * 8,
          null,
          null,
          "right"
        );
      });
      yPosition += resultsArr.length * 8 + 5;
    } else {
      doc.text("Calculated Results: Data not available", 20, yPosition);
      yPosition += 8;
    }

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Notas
    if (r.description) {
      doc.setFontSize(12);
      doc.text("Notes:", 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(r.description, 20, yPosition);
    }

    doc.save(`${r.title || 'report'}.pdf`);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis reportes</h1>
        <span className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${items.length} reporte(s)`}
        </span>
      </div>

      {err && <div className="text-destructive text-sm">{err}</div>}

      {!loading && items.length === 0 && (
        <Card className="bg-card">
          <CardContent className="py-8">
            <p className="text-muted-foreground">
              Aún no tienes reportes. Crea uno desde <span className="font-semibold">Cálculos</span>.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r) => (
          <Card key={r.id} className="bg-card">
            <CardHeader>
              <CardTitle className="truncate text-card-foreground">
                {r.title || `Reporte #${r.id}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at || r.createdAt).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {r.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                <div><b>Usuario:</b> {r.user_name || r.user_email || r.user_id}</div>
                <div><b>Equipo:</b> {r.equipment_id || "N/A"}</div>
                <div><b>H:</b> {r.dims?.H ?? "N/A"} <b>D:</b> {r.dims?.D ?? "N/A"} <b>E:</b> {r.dims?.E ?? "N/A"}</div>
                <div><b>VN:</b> {r.results?.VN ?? "N/A"} <b>VF:</b> {r.results?.VF ?? "N/A"} <b>HN:</b> {r.results?.HN ?? "N/A"} <b>HF:</b> {r.results?.HF ?? "N/A"}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => generatePdf(r)}>Ver PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
