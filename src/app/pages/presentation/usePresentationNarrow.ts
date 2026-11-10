import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 639px)";

function matches() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(NARROW_QUERY).matches;
}

/** True below the `sm` breakpoint, where the charts switch to horizontal bars. */
export function usePresentationNarrow() {
  const [narrow, setNarrow] = useState(matches);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return narrow;
}
