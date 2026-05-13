import { ImpactoIA } from "../data/mockData";

export type ImpactoTipo = "objetivo-apuesta" | "objetivo-meta" | "kr-objetivo" | "proyecto-kr";

export interface CalcularImpactoInput {
  tipo: ImpactoTipo;
  origen: { titulo: string; descripcion?: string };
  destino: { titulo: string; descripcion?: string };
  contexto?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Hash determinista a partir de las cadenas, para que el mismo input dé el mismo %
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function porcentajePorTipo(tipo: ImpactoTipo, seed: number): number {
  // Rangos calibrados para cada tipo de relación
  const rango: Record<ImpactoTipo, [number, number]> = {
    "objetivo-apuesta": [25, 70],
    "objetivo-meta": [20, 65],
    "kr-objetivo": [15, 50],
    "proyecto-kr": [10, 45],
  };
  const [min, max] = rango[tipo];
  const span = max - min + 1;
  return min + (seed % span);
}

function justificar(input: CalcularImpactoInput, pct: number): string {
  const { tipo, origen, destino } = input;
  const nivel = pct >= 50 ? "alto" : pct >= 30 ? "moderado" : "acotado";
  const conectores: Record<ImpactoTipo, string> = {
    "objetivo-apuesta": "contribuye a la apuesta estratégica",
    "objetivo-meta": "aporta al cumplimiento de la meta institucional",
    "kr-objetivo": "avanza el objetivo",
    "proyecto-kr": "moviliza el resultado clave",
  };
  return (
    `El componente "${origen.titulo}" ${conectores[tipo]} "${destino.titulo}" con un impacto ${nivel} (${pct}%). ` +
    `La estimación pondera alineación temática, alcance declarado y horizonte temporal. ` +
    `Revísala y ajústala manualmente si conoces evidencia adicional que justifique un valor distinto.`
  );
}

export async function calcularImpacto(input: CalcularImpactoInput): Promise<ImpactoIA> {
  await sleep(700 + Math.random() * 600);
  const seed = hashString(`${input.tipo}|${input.origen.titulo}|${input.destino.titulo}|${input.contexto ?? ""}`);
  const porcentaje = porcentajePorTipo(input.tipo, seed);
  return {
    porcentaje,
    justificacion: justificar(input, porcentaje),
    origen: "ia",
    calculadoEn: new Date().toISOString(),
  };
}
