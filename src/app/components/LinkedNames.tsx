/** A count followed by the names it counts, for the detail fields that list linked records. */
export function LinkedNames({ count, names }: { count: number; names: string[] }) {
  if (count === 0) return <span className="text-gray-500">0 · Sin vínculos</span>;
  return (
    <div className="min-w-0">
      <span className="font-bold">{count}</span>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-snug" style={{ overflowWrap: "anywhere" }}>
        {names.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
      </ul>
    </div>
  );
}
