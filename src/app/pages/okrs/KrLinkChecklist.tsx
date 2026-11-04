export interface KrLinkOption {
  id: number;
  name: string;
}

interface KrLinkChecklistProps {
  id: string;
  legend: string;
  options: KrLinkOption[];
  selectedIds: number[];
  invalid?: boolean;
  describedBy?: string;
  emptyText: string;
  onToggle: (id: number) => void;
}

export function KrLinkChecklist({
  id,
  legend,
  options,
  selectedIds,
  invalid = false,
  describedBy,
  emptyText,
  onToggle,
}: KrLinkChecklistProps) {
  const legendId = `${id}-legend`;
  return (
    <fieldset
      aria-labelledby={legendId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={`rounded-md border p-3 ${invalid ? "border-[#B42318]" : "border-gray-200"}`}
    >
      <legend id={legendId} className="sr-only">{legend}</legend>
      <div className="mb-2 flex items-center justify-between gap-2" aria-hidden="true">
        <span className="text-xs font-bold text-gray-800">{legend}</span>
        <span className="text-xs text-gray-500">{selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"}</span>
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyText}</p>
      ) : (
        <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {options.map((option) => {
            const checked = selectedIds.includes(option.id);
            const inputId = `${id}-${option.id}`;
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 ${checked ? "border-[#5454E9] bg-[#F4F4FE]" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.id)}
                  className="mt-0.5 accent-[#5454E9]"
                />
                <span className="text-sm leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{option.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
