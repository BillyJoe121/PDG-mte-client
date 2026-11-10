import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { PlatformTutorial } from "../PlatformTutorial";
import { StartTutorialContext } from "./tutorialContext";
import { hasCompletedTutorial, markTutorialCompleted } from "./tutorialStorage";

/**
 * Keeps the guided tour above every screen, including the presentation mode that has no app
 * layout, so it survives moving between them.
 */
export function TutorialHost() {
  const { usuario } = useAuth();
  const userId = usuario?.id;
  const [tutorial, setTutorial] = useState<{ open: boolean; mandatory: boolean }>({ open: false, mandatory: false });

  // The first visit of each user in this browser starts the tour, and it must be completed.
  useEffect(() => {
    if (userId && !hasCompletedTutorial(userId)) setTutorial({ open: true, mandatory: true });
  }, [userId]);

  const start = useCallback(() => setTutorial({ open: true, mandatory: false }), []);
  const close = (finished: boolean) => {
    if (finished && userId) markTutorialCompleted(userId);
    setTutorial({ open: false, mandatory: false });
  };

  return (
    <StartTutorialContext.Provider value={start}>
      <Outlet />
      {userId && <PlatformTutorial open={tutorial.open} mandatory={tutorial.mandatory} onClose={close} />}
    </StartTutorialContext.Provider>
  );
}
