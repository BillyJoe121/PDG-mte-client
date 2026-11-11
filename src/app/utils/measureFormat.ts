/**
 * Reads a value together with its measurement unit the way a person would write it:
 * "88%" instead of "88 Porcentaje", "24" instead of "24 Numero", "Sí"/"No" for yes/no units.
 * Units are free text in the catalog, so they are recognised by name.
 */

const NUMBER_FORMAT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** Lowercase, without accents or extra spaces, for comparing unit names. */
function normalize(unit: string) {
  return unit.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

const PERCENT = /^(%|porcentaje|porcentajes|por ?ciento|pct)$/;
const PLAIN_COUNT = /^(numero|numeros|numerico|numerica|cantidad|conteo|unidad|unidades|n|#|no\.?)$/;
const YES_NO = /^(si ?\/ ?no|si-no|booleano|booleana|binario|binaria)$/;
const INDEX = /^indice$/;

/** Spelling fixes for unit names that usually arrive without accents. */
const ACCENTED: Record<string, string> = { indice: "índice", numero: "número", numeros: "números", dias: "días", anos: "años", horas: "horas" };

function unitWord(unit: string) {
  const fixed = ACCENTED[normalize(unit)];
  if (fixed) return fixed;
  // Acronyms (COP, USD, SMMLV) keep their capitals; other names read in lowercase after the number.
  return unit === unit.toUpperCase() ? unit : unit.charAt(0).toLowerCase() + unit.slice(1);
}

export function formatNumber(value: number) {
  return NUMBER_FORMAT.format(value);
}

/** Value with its unit in natural Spanish; empty when there is no value. */
export function formatMeasure(value: number | null | undefined, unitName: string | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  const amount = formatNumber(value);
  const unit = unitName?.trim();
  if (!unit) return amount;
  const key = normalize(unit);
  if (PERCENT.test(key)) return `${amount}%`;
  if (PLAIN_COUNT.test(key)) return amount;
  if (YES_NO.test(key)) return value === 1 ? "Sí" : value === 0 ? "No" : amount;
  if (INDEX.test(key)) return `índice de ${amount}`;
  return `${amount} ${unitWord(unit)}`;
}
