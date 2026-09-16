import { CircleHelp, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

type HelpContent = {
  title: string;
  purpose: string;
  steps: string[];
  tip: string;
};

const defaultHelp: HelpContent = {
  title: "Módulo MTE",
  purpose: "Consulta el estado de la trazabilidad estratégica y navega por los módulos disponibles según tu rol.",
  steps: [
    "Usa el menú lateral para cambiar de módulo.",
    "Aplica filtros antes de revisar un listado extenso.",
    "Abre los detalles para consultar relaciones, responsables y trazabilidad.",
  ],
  tip: "Los controles disponibles dependen de los permisos de tu rol institucional.",
};

const helpByRoute: Array<{ match: (pathname: string) => boolean; content: HelpContent }> = [
  {
    match: (pathname) => pathname.startsWith("/jerarquia"),
    content: {
      title: "Jerarquía Estratégica",
      purpose: "Organiza Apuestas, Metas y sus relaciones para mantener la cadena de trazabilidad institucional.",
      steps: [
        "Filtra por período para revisar la vigencia de la jerarquía.",
        "Selecciona una Apuesta o Meta para consultar su detalle y relaciones.",
        "Usa las acciones de gestión solo cuando debas crear, editar o archivar elementos estratégicos.",
      ],
      tip: "Antes de archivar, revisa las relaciones activas: el historial se conserva para auditoría.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/okrs") || pathname.startsWith("/krs"),
    content: {
      title: "Objetivos y Key Results",
      purpose: "Gestiona los objetivos de corto plazo, sus indicadores y el avance medible de cada Key Result.",
      steps: [
        "Filtra por Apuesta, Meta, departamento o período para acotar los resultados.",
        "Abre un Objetivo para revisar sus KRs y sus estados de ciclo de vida.",
        "Registra valores de KR con la unidad de medida definida para conservar cálculos consistentes.",
      ],
      tip: "Un Objetivo cerrado no admite cambios ordinarios; verifica su estado antes de iniciar una gestión.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/proyectos"),
    content: {
      title: "Proyectos e iniciativas",
      purpose: "Consulta y gestiona las iniciativas que contribuyen a los Key Results institucionales.",
      steps: [
        "Usa los filtros y la búsqueda para encontrar la iniciativa.",
        "Abre la ficha para actualizar fechas, responsables, estado y vínculos con KRs.",
        "Al vincular un KR, valida el peso y el tipo de contribución antes de guardar.",
      ],
      tip: "Las fechas y períodos se validan antes de guardar; el cierre real no puede ser anterior al inicio.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/consistencia"),
    content: {
      title: "Consistencia estratégica",
      purpose: "Revisa alertas que pueden afectar la calidad de la trazabilidad y corrige cada elemento desde su acción asociada.",
      steps: [
        "Filtra alertas según el período o tipo de inconsistencia.",
        "Lee el detalle para comprender el dato que requiere corrección.",
        "Usa la acción correctiva para ir directamente al registro relacionado.",
      ],
      tip: "Las acciones correctivas preservan el contexto del elemento para evitar búsquedas manuales.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/reportes"),
    content: {
      title: "Reportes y exportaciones",
      purpose: "Prepara vistas consolidadas para seguimiento, análisis y socialización institucional.",
      steps: [
        "Define los filtros que deben aparecer en el reporte.",
        "Verifica los totales y la tabla de detalle antes de exportar.",
        "Usa la exportación apropiada para compartir una instantánea del estado consultado.",
      ],
      tip: "Los reportes reflejan los filtros activos; verifica el período antes de compartirlos.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/catalogos"),
    content: {
      title: "Catálogos institucionales",
      purpose: "Administra períodos y unidades de medida que sirven como referencia para los demás módulos.",
      steps: [
        "Consulta primero si el período o unidad ya existe.",
        "Crea o ajusta valores respetando el tipo de unidad.",
        "Evita modificar un catálogo que ya esté siendo usado sin validar su impacto.",
      ],
      tip: "Las unidades utilizadas conservan restricciones para proteger la integridad de datos históricos.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/auditoria"),
    content: {
      title: "Auditoría",
      purpose: "Consulta el historial de cambios relevantes de la plataforma sin modificar la información registrada.",
      steps: [
        "Filtra por fechas, usuario o entidad para reducir los eventos.",
        "Abre un evento para comparar el estado anterior y posterior.",
        "Usa el detalle como evidencia al revisar una modificación.",
      ],
      tip: "La auditoría es de consulta: las correcciones se realizan desde el módulo propietario del registro.",
    },
  },
];

export function getContextualHelp(pathname: string): HelpContent {
  return helpByRoute.find((entry) => entry.match(pathname))?.content ?? defaultHelp;
}

interface ContextualHelpProps {
  onStartTutorial?: () => void;
}

export function ContextualHelp({ onStartTutorial }: ContextualHelpProps) {
  const { pathname } = useLocation();
  const content = getContextualHelp(pathname);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Ayuda sobre ${content.title}`}
          title={`Ayuda sobre ${content.title}`}
          className="flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-gray-100"
          style={{ border: "1.5px solid #000" }}
        >
          <CircleHelp size={17} aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-2 border-black bg-white p-5 sm:max-w-xl">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-base font-black text-black">Ayuda: {content.title}</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-5 text-gray-600">{content.purpose}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3" aria-label="Pasos recomendados">
          {content.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-5 text-gray-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-black text-white">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex items-start gap-2 rounded-md bg-[#FFF7ED] p-3 text-sm leading-5 text-[#9A3412]" role="note">
          <Lightbulb className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
          <span><strong>Consejo:</strong> {content.tip}</span>
        </div>
        {onStartTutorial && (
          <button
            type="button"
            onClick={() => { setOpen(false); onStartTutorial(); }}
            className="rounded-md bg-black px-3 py-2 text-sm font-black text-white hover:bg-gray-800"
          >
            Iniciar recorrido guiado
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
