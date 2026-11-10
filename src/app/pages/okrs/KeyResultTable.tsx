import { ArchiveRestore, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { KeyResult } from "../../services/strategicApi";
import { lifecycleLabel } from "../../utils/strategicLifecycle";
import { keyResultStatusOf } from "./keyResultListModel";
import { COLORS } from "./okrsShared";

const COLUMNS = ["Código", "Key Result", "Estado", "Avance registrado", "Periodo", "Metas", "Apuestas", "Acción"];

function linkNames(links: KeyResult["goals"], emptyLabel: string) {
  return links?.length ? links.map((link) => link.name).join(", ") : emptyLabel;
}

interface KeyResultTableProps {
  items: KeyResult[];
  canRestore: boolean;
  restoringId: number | null;
  onOpen: (item: KeyResult) => void;
  onRestore: (item: KeyResult) => void;
}

export function KeyResultTable({ items, canRestore, restoringId, onOpen, onRestore }: KeyResultTableProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white" style={{ border: `1px solid ${COLORS.border}` }}>
      <Table aria-label="Key Results" style={{ minWidth: 1040, fontSize: 12 }}>
        <TableHeader>
          <TableRow style={{ backgroundColor: "#F8F9FB" }}>
            {COLUMNS.map((column) => (
              <TableHead key={column} scope="col" style={{ fontSize: 10.5, fontWeight: 800, color: "#374151", whiteSpace: "normal" }}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const archived = Boolean(item.archived);
            const restoring = restoringId === item.id;
            return (
              <TableRow key={item.id} style={{ opacity: archived ? 0.78 : 1 }}>
                <TableCell style={{ fontWeight: 800, color: COLORS.gray }}>KR-{String(item.id).padStart(2, "0")}</TableCell>
                <TableCell style={{ minWidth: 300, maxWidth: 420, whiteSpace: "normal" }}>
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="text-left underline-offset-2 hover:underline"
                    style={{ fontWeight: 750, color: COLORS.text, overflowWrap: "anywhere" }}
                  >
                    {item.name}
                  </button>
                </TableCell>
                <TableCell>{lifecycleLabel(keyResultStatusOf(item))}{archived ? " · Archivado" : ""}</TableCell>
                <TableCell style={{ fontWeight: 800 }}>{item.progressPercentage}%</TableCell>
                <TableCell>{item.academicPeriodName ?? "Sin periodo"}</TableCell>
                <TableCell style={{ minWidth: 150, whiteSpace: "normal" }}>{linkNames(item.goals, "Sin meta")}</TableCell>
                <TableCell style={{ minWidth: 150, whiteSpace: "normal" }}>{linkNames(item.strategicBets, "Sin apuesta")}</TableCell>
                <TableCell>
                  {archived && canRestore ? (
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      disabled={restoring}
                      aria-label={`Restaurar ${item.name}`}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 disabled:opacity-50"
                      style={{ border: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 800, color: "#374151" }}
                    >
                      {restoring ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <ArchiveRestore size={13} aria-hidden="true" />}
                      Restaurar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      aria-label={`Ver detalle de ${item.name}`}
                      className="inline-flex min-h-[32px] items-center rounded-md px-2.5"
                      style={{ border: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 800, color: "#374151" }}
                    >
                      Ver detalle
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
