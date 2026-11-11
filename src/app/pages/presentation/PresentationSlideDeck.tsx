import type { PresentationSlide } from "../../services/reportsApi";
import { PresentationProgress, PresentationStage } from "./PresentationStageView";
import { PresentationStageControls } from "./PresentationStageControls";
import { PresentationSlideOverview } from "./PresentationSlideOverview";

interface Props {
  slides: PresentationSlide[];
  currentIndex: number;
  periodName: string;
  onIndexChange: (index: number) => void;
  fullscreen: boolean;
  onToggleFullscreen?: () => void;
  controlsVisible: boolean;
  overviewOpen: boolean;
  onToggleOverview: () => void;
  onExit: () => void;
}

/** Presentar view: the scaled stage, its floating controls, progress and the thumbnail grid. */
export function PresentationSlideDeck({
  slides,
  currentIndex,
  periodName,
  onIndexChange,
  fullscreen,
  onToggleFullscreen,
  controlsVisible,
  overviewOpen,
  onToggleOverview,
  onExit,
}: Props) {
  const lastIndex = Math.max(slides.length - 1, 0);
  const currentSlide = slides[currentIndex];

  if (!currentSlide) {
    return (
      <div className="grid flex-1 place-items-center bg-[#111827] p-6 text-center">
        <p style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>No hay diapositivas registradas para este periodo.</p>
      </div>
    );
  }

  return (
    <div className="presentation-deck relative flex-1 min-h-0 overflow-hidden bg-[#111827]">
      <PresentationStage
        slide={currentSlide}
        index={currentIndex}
        total={slides.length}
        periodName={periodName}
        hideCursor={!controlsVisible && !overviewOpen}
      />
      <PresentationProgress index={currentIndex} total={slides.length} />
      <PresentationStageControls
        index={currentIndex}
        total={slides.length}
        concealed={!controlsVisible && !overviewOpen}
        overviewOpen={overviewOpen}
        fullscreen={fullscreen}
        onPrevious={() => onIndexChange(Math.max(currentIndex - 1, 0))}
        onNext={() => onIndexChange(Math.min(currentIndex + 1, lastIndex))}
        onToggleOverview={onToggleOverview}
        onToggleFullscreen={onToggleFullscreen}
        onExit={onExit}
      />
      {overviewOpen && (
        <PresentationSlideOverview
          slides={slides}
          currentIndex={currentIndex}
          periodName={periodName}
          onSelect={(index) => {
            onIndexChange(index);
            onToggleOverview();
          }}
          onClose={onToggleOverview}
        />
      )}
    </div>
  );
}
