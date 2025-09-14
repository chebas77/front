import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

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

        console.groupCollapsed("%c[REPORTS] GET /api/reports", "color:#22d3ee");
        console.log("status:", res.status);
        console.table(json.items || json);
        console.groupEnd();

        if (!res.ok || !json.ok) throw new Error(json.error || "Error al cargar reportes");
        if (!cancel) setItems(json.items);
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, []);

  const openPdf = (r) => {
    // si la API ya devuelve file_url, úsalo. Si no, intenta armarlo con file_path
    const url = r.file_url || (r.file_path ? `${API}${r.file_path.startsWith("/") ? "" : "/"}${r.file_path}` : null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
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
              <div className="flex gap-2 pt-2">
                <Button onClick={() => openPdf(r)}>Ver PDF</Button>
                {r.file_url && (
                  <a href={r.file_url} download className="inline-flex">
                    <Button variant="outline">Descargar</Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
