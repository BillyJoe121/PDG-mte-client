import { DETAIL_BLUE_BUTTON_CLASS, DETAIL_GRAY_DISABLED_BUTTON_CLASS, DETAIL_GREEN_BUTTON_CLASS } from "../../components/DetailModal";
import type { StrategyLink } from "../../services/strategicApi";
import type { HierarchyRootKind } from "./hierarchyTableLink";

interface StrategyJumpButtonsProps {
  goal?: StrategyLink;
  bet?: StrategyLink;
  onOpen: (rootType: HierarchyRootKind, root: StrategyLink) => void;
}

/** "Ver en Meta" and "Ver en Apuesta": green and blue with a link, gray and disabled without one. */
export function StrategyJumpButtons({ goal, bet, onOpen }: StrategyJumpButtonsProps) {
  return (
    <>
      <JumpButton label="Ver en Meta" emptyLabel="Sin Meta vinculada" link={goal} className={DETAIL_GREEN_BUTTON_CLASS} onOpen={(root) => onOpen("GOAL", root)} />
      <JumpButton label="Ver en Apuesta" emptyLabel="Sin Apuesta vinculada" link={bet} className={DETAIL_BLUE_BUTTON_CLASS} onOpen={(root) => onOpen("STRATEGIC_BET", root)} />
    </>
  );
}

function JumpButton({ label, emptyLabel, link, className, onOpen }: { label: string; emptyLabel: string; link?: StrategyLink; className: string; onOpen: (root: StrategyLink) => void }) {
  if (!link) {
    return (
      <button type="button" disabled title={emptyLabel} aria-label={`${label}: ${emptyLabel.toLowerCase()}`} className={DETAIL_GRAY_DISABLED_BUTTON_CLASS}>
        {label}
      </button>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(link)} title={`Ver en la tabla de la jerarquía: ${link.name}`} className={className}>
      {label}
    </button>
  );
}
