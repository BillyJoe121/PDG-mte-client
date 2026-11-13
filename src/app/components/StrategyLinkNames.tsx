import { Fragment } from "react";

const LEADING_CODE = /^([A-Za-z]+\d+)\b([\s\S]*)$/;

/** Comma-separated goal and bet names with their leading code in bold, e.g. **O1** · Alianzas. */
export function StrategyLinkNames({ names, empty }: { names: ReadonlyArray<string | null | undefined>; empty: string }) {
  const items = names.map((name) => name?.trim()).filter((name): name is string => Boolean(name));
  if (!items.length) return <>{empty}</>;
  return (
    <>
      {items.map((name, index) => {
        const match = LEADING_CODE.exec(name);
        return (
          <Fragment key={`${index}-${name}`}>
            {index > 0 && ", "}
            {match ? <><strong className="font-extrabold">{match[1]}</strong>{match[2]}</> : name}
          </Fragment>
        );
      })}
    </>
  );
}
