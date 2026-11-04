/** Single strip of plain counters, for pages that open with a summary. */
export function CounterStrip({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <dl className="sgp-print-avoid grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3">
          <dt className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{item.label}</dt>
          <dd className="mt-1.5 text-[17px] font-bold leading-none text-[#111827]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
