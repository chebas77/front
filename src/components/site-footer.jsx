import { useState } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";

const YEAR = new Date().getFullYear();
const VERSION = import.meta.env.VITE_APP_VERSION || "v1.0.0";

export function SiteFooter() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {YEAR} Industrial Alignment Pro</span>
            <span className="hidden md:inline-block">•</span>
            <span className="hidden md:inline-block">Todos los derechos reservados</span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={() => setShowPrivacy(true)} className="hover:underline">
              Privacidad
            </button>
            <button onClick={() => setShowTerms(true)} className="hover:underline">
              Términos
            </button>
           <a href="mailto:manuel.rodriguez.j@tecsup.edu.pe" className="hover:underline">
  Contacto
</a>

            <a
              href="https://github.com/chebas77"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 flex items-center gap-1"
              aria-label="Repositorio en GitHub"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-xs opacity-80">Versión {VERSION}</span>
          </div>
        </div>
      </footer>

      {/* Modal: Privacidad */}
      <Dialog
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Política de Privacidad"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPrivacy(false)}>Cerrar</Button>
          </div>
        }
      >
        <p>
          Recopilamos datos mínimos necesarios para operar la plataforma:
          correo y nombre a través de Google OAuth, registros de uso para
          mejorar el servicio y metadatos técnicos (navegador, IP abreviada).
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Autenticación mediante cookie <code>httpOnly</code> (JWT).</li>
          <li>No vendemos datos ni los compartimos con terceros con fines publicitarios.</li>
          <li>Puedes solicitar eliminación de cuenta y datos asociados escribiendo a soporte.</li>
          <li>Conservamos logs por un tiempo limitado para análisis y seguridad.</li>
        </ul>
        <p>
          Para detalles operativos (retención, subprocesadores, copias de seguridad),
          contáctanos en <a href="mailto:soporte@alignment.pro" className="underline">soporte@alignment.pro</a>.
        </p>
      </Dialog>

      {/* Modal: Términos */}
      <Dialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Términos y Condiciones"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTerms(false)}>Aceptar</Button>
          </div>
        }
      >
        <p>
          Al usar Industrial Alignment Pro aceptas: (1) utilizar la plataforma
          conforme a la ley; (2) no intentar vulnerar la seguridad; (3) que el
          servicio se ofrece “tal cual”, sin garantías implícitas; (4) podemos
          actualizar el servicio y estos términos.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="font-medium">Uso profesional:</span> la interpretación técnica de resultados es responsabilidad del usuario.</li>
          <li><span className="font-medium">Disponibilidad:</span> buscamos alta disponibilidad, pero pueden ocurrir interrupciones programadas o fortuitas.</li>
          <li><span className="font-medium">Propiedad:</span> tu información y proyectos te pertenecen; nos otorgas permiso para procesarlos con el fin de operar el servicio.</li>
          <li><span className="font-medium">Limitación de responsabilidad:</span> no somos responsables por pérdidas indirectas o lucro cesante.</li>
        </ul>
        <p>
          Si representas a una empresa y necesitas un acuerdo específico (DPA, SLA),
          escríbenos a <a href="mailto:soporte@alignment.pro" className="underline">soporte@alignment.pro</a>.
        </p>
      </Dialog>
    </>
  );
}
