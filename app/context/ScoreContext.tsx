"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ScoreContextType {
  glaucomaScore: number | null;
  setGlaucomaScore: (score: number | null) => void;
  cataractScore: number | null;
  setCataractScore: (score: number | null) => void;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [glaucomaScore, setGlaucomaScore] = useState<number | null>(null);
  const [cataractScore, setCataractScore] = useState<number | null>(null);

  // ---------------------------
  // LOAD FROM LOCAL STORAGE ONCE
  // ---------------------------
  useEffect(() => {
    const g = window.localStorage.getItem("glaucomaScore");
    const c = window.localStorage.getItem("cataractScore");

    if (g !== null) {
      const parsed = Number(g);
      if (!isNaN(parsed)) setGlaucomaScore(parsed);
    }

    if (c !== null) {
      const parsed = Number(c);
      if (!isNaN(parsed)) setCataractScore(parsed);
    }
  }, []);

  // ---------------------------
  // SYNC TO LOCAL STORAGE
  // ---------------------------
  useEffect(() => {
    if (glaucomaScore !== null) {
      window.localStorage.setItem("glaucomaScore", String(glaucomaScore));
    }
  }, [glaucomaScore]);

  useEffect(() => {
    if (cataractScore !== null) {
      window.localStorage.setItem("cataractScore", String(cataractScore));
    }
  }, [cataractScore]);

  return (
    <ScoreContext.Provider
      value={{
        glaucomaScore,
        setGlaucomaScore,
        cataractScore,
        setCataractScore,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  const ctx = useContext(ScoreContext);
  if (!ctx)
    throw new Error("useScore must be used inside a ScoreProvider");

  return ctx;
}
