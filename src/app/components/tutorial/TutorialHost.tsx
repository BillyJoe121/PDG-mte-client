import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { PlatformTutorial } from "../PlatformTutorial";
import { StartTutorialContext } from "./tutorialContext";
import { hasCompletedTutorial, markTutorialCompleted } from "./tutorialStorage";
import { WelcomeModal } from "./WelcomeModal";

/**
 * welcome and help are the two mandatory cards of the first visit; tour is the full guided tour,
 * started from the help button.
 */
type Phase = "welcome" | "help" | "tour" | null;

export function TutorialHost() {
  const { usuario } = useAuth();
  const userId = usuario?.id;
  const [phase, setPhase] = useState<Phase>(null);

  useEffect(() => {
    if (userId && !hasCompletedTutorial(userId)) setPhase("welcome");
  }, [userId]);

  const start = useCallback(() => setPhase("tour"), []);
  const close = (finished: boolean) => {
    if (finished && userId) markTutorialCompleted(userId);
    setPhase(null);
  };

  return (
    <StartTutorialContext.Provider value={start}>
      <Outlet />
      {userId && phase === "welcome" && <WelcomeModal onNext={() => setPhase("help")} />}
      {userId && <PlatformTutorial open={phase === "help" || phase === "tour"} onboarding={phase === "help"} onClose={close} />}
    </StartTutorialContext.Provider>
  );
}
