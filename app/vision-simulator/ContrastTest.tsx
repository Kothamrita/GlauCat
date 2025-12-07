"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ContrastTest C4 — Pro (SVG plates, calibration, staircase/adaptive difficulty)
 *
 * Props:
 *   onResult: (score: number) => void
 *
 * Behavior:
 *   - Step 0: Calibration (eye-chart + slider) — user scales plates for their screen
 *   - Steps 1..N: Adaptive plates (gratings, noise, low-contrast numbers)
 *   - Uses a simple 1-up/1-down staircase: correct -> harder, incorrect -> easier
 *   - Shows running progress and final score; calls onResult(finalScore)
 */

type Plate =
  | {
      type: "grating";
      orientation: "vertical" | "horizontal" | "diagonal";
      baseContrast: number; // 0..1
      freq: number;
    }
  | {
      type: "noise";
      answer: string; // number string
      baseDifficulty: number; // 1..3
    }
  | {
      type: "number";
      answer: string;
      baseContrast: number; // 0..1
    };

export default function ContrastTest({
  onResult,
}: {
  onResult: (score: number) => void;
}) {
  // ---------- CONFIG ----------
  const PLATE_SIZE_PX = 220; // base drawing size (will be scaled by user calibration)
  const TOTAL_TRIALS = 9; // nominal plates; staircase may sample from pool multiple times
  const MIN_CONTRAST = 0.08;
  const MAX_CONTRAST = 0.98;

  // Base plate pool (we will adapt contrast by difficulty)
  const basePlates = useMemo<Plate[]>(
    () => [
      { type: "grating", orientation: "vertical", baseContrast: 0.85, freq: 8 },
      { type: "grating", orientation: "horizontal", baseContrast: 0.7, freq: 12 },
      { type: "grating", orientation: "diagonal", baseContrast: 0.55, freq: 10 },

      { type: "noise", answer: "12", baseDifficulty: 1 },
      { type: "noise", answer: "8", baseDifficulty: 2 },
      { type: "noise", answer: "29", baseDifficulty: 3 },

      { type: "number", answer: "5", baseContrast: 0.32 },
      { type: "number", answer: "3", baseContrast: 0.22 },
      { type: "number", answer: "7", baseContrast: 0.14 },
    ],
    []
  );

  // ---------- STATE ----------
  const [phase, setPhase] = useState<"calibration" | "testing" | "done">(
    "calibration"
  );
  const [scale, setScale] = useState(1); // calibration scale multiplier (1 = default)
  const [trialIndex, setTrialIndex] = useState(0); // how many trials completed
  const [staircaseLevel, setStaircaseLevel] = useState(4); // difficulty index 0..8 (0 easy, 8 hard)
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [history, setHistory] = useState<
    { plate: Plate; contrast: number; correct: boolean; user: string }[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep a randomized trial order seeded from basePlates — but we will sample adaptively
  const rngSeed = useRef(Math.floor(Math.random() * 1e9));
  function randomChoice<T>(arr: T[]) {
    return arr[Math.floor(Math.abs(hash((rngSeed.current + Date.now()) % 9999999)) % arr.length)];
  }
  // a tiny deterministic-ish hash helper (not crypto)
  function hash(x: number) {
    return (x * 9301 + 49297) % 233280;
  }

  // ---------- ADAPTIVE STAIRCASE ----------
  // We'll map staircaseLevel (0..8) -> contrast multiplier (0..1)
  const levelToContrast = (level: number, baseContrast: number) => {
    // convert level (0..8) to factor [0.2 .. 1.0] (lower => harder)
    const factor = 0.2 + (level / 8) * 0.8;
    // clamp
    const c = Math.max(MIN_CONTRAST, Math.min(MAX_CONTRAST, baseContrast * factor));
    return Number(c.toFixed(3));
  };

  // For noise plates, baseDifficulty will be converted to effective "contrast" proxy
  const levelToDifficulty = (level: number, baseDifficulty: number) => {
    // baseDifficulty 1..3, level increases -> harder
    // produce a pseudo contrast value for rendering decisions (0..1)
    const factor = 0.2 + (level / 8) * 0.8;
    return Math.max(0.05, Math.min(1, 1 - (baseDifficulty - 1) * 0.15) * factor);
  };

  // Choose a plate for the current trial based on staircaseLevel (simple mix strategy)
  const choosePlateForLevel = (level: number) => {
    // Use deterministic-ish sampling: pick one of basePlates keyed by (trialIndex + level) % N
    const idx = (trialIndex + level + Math.abs(hash(rngSeed.current)) ) % basePlates.length;
    return basePlates[idx];
  };

  // current plate details derived from staircase and base plate
  const currentPlate = useMemo(() => {
    const plate = choosePlateForLevel(staircaseLevel);
    if (!plate) return null;
    if (plate.type === "grating") {
      const contrast = levelToContrast(staircaseLevel, plate.baseContrast);
      return { ...plate, contrast } as Plate & { contrast?: number };
    }
    if (plate.type === "number") {
      const contrast = levelToContrast(staircaseLevel, plate.baseContrast);
      return { ...plate, contrast } as Plate & { contrast?: number };
    }
    if (plate.type === "noise") {
      const difficultyFactor = levelToDifficulty(staircaseLevel, plate.baseDifficulty);
      return { ...plate, difficultyFactor } as Plate & { difficultyFactor?: number };
    }
    return plate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex, staircaseLevel, rngSeed.current]);

  // Autofocus input when plate changes (if in testing)
  useEffect(() => {
    if (phase === "testing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, trialIndex, staircaseLevel]);

  // ---------- DRAWING (SVG render helpers) ----------
  // We'll render SVG inside the React JSX. For gratings, create repeated rectangles or pattern.
  function GratingSVG({ orientation, contrast, freq }: { orientation: "vertical" | "horizontal" | "diagonal"; contrast: number; freq: number; }) {
    // contrast 0..1 maps to color range
    // produce a stripe group using rects (size PLATE_SIZE_PX)
    const size = PLATE_SIZE_PX * scale;
    const stripeCount = Math.max(4, Math.round(freq * (scale)));
    const stripeWidth = size / stripeCount;
    // color mapping: center gray 128, contrast -> amplitude
    const amp = Math.round(contrast * 120);
    // produce an array of colors
    const rects = [];
    for (let i = 0; i < stripeCount; i++) {
      // alternate brightness
      const base = 128 + (i % 2 === 0 ? amp : -amp);
      const col = `rgb(${base},${base},${base})`;
      rects.push({ i, col });
    }

    const viewBox = `0 0 ${size} ${size}`;
    return (
      <svg width={size} height={size} viewBox={viewBox} role="img" aria-label="Contrast grating">
        {orientation === "vertical" &&
          rects.map((r) => (
            <rect key={r.i} x={r.i * stripeWidth} y={0} width={stripeWidth + 0.5} height={size} fill={r.col} />
          ))}
        {orientation === "horizontal" &&
          rects.map((r) => (
            <rect key={r.i} x={0} y={r.i * stripeWidth} width={size} height={stripeWidth + 0.5} fill={r.col} />
          ))}
        {orientation === "diagonal" && (
          <g transform={`translate(${size/2},${size/2}) rotate(45)`}>
            {rects.map((r) => (
              <rect key={r.i} x={(r.i - stripeCount/2) * stripeWidth} y={-size} width={stripeWidth + 0.5} height={size*2} fill={r.col} />
            ))}
          </g>
        )}
        {/* frame */}
        <rect x={0} y={0} width={size} height={size} fill="none" stroke="#333" rx={10} />
      </svg>
    );
  }

  function NoisePlateSVG({ answer, difficultyFactor }: { answer: string; difficultyFactor: number; }) {
    const size = PLATE_SIZE_PX * scale;
    // difficultyFactor low -> harder (less difference between number and background)
    const dots = 1200; // number of color dots
    // We'll create a background of many small rects with randomish colors
    // To keep DOM reasonable, we use <rect> grid instead of thousands of tiny elements — create 40x40 grid
    const grid = 40;
    const cell = Math.max(3, Math.round(size / grid));
    const cellsPerRow = Math.ceil(size / cell);
    const rows = Math.ceil(size / cell);
    const colors: string[] = [];
    for (let r = 0; r < rows * cellsPerRow; r++) {
      // background palette influenced by difficultyFactor
      const rcol = Math.round(140 + Math.random() * (80 * difficultyFactor));
      const gcol = Math.round(120 + Math.random() * (60 * difficultyFactor));
      const bcol = Math.round(120 + Math.random() * (80 * difficultyFactor));
      colors.push(`rgb(${rcol},${gcol},${bcol})`);
    }
    // number color slightly different
    const numberColor = `rgba(${80 + Math.round(60 * difficultyFactor)},${70 + Math.round(60 * difficultyFactor)},${70 + Math.round(60 * difficultyFactor)},0.9)`;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Colored noise plate">
        <rect x={0} y={0} width={size} height={size} fill="#eee" rx={10} />
        {colors.map((c, i) => {
          const x = (i % cellsPerRow) * cell;
          const y = Math.floor(i / cellsPerRow) * cell;
          return <rect key={i} x={x} y={y} width={cell + 0.5} height={cell + 0.5} fill={c} />;
        })}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={Math.round(size * 0.45)} fontWeight={700} fill={numberColor} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
          {answer}
        </text>
        <rect x={0} y={0} width={size} height={size} fill="none" stroke="#333" rx={10} />
      </svg>
    );
  }

  function LowContrastNumberSVG({ answer, contrast }: { answer: string; contrast: number }) {
    const size = PLATE_SIZE_PX * scale;
    // mid-gray background
    const bg = 210;
    const val = Math.round( bg * (1 - contrast) ); // make number darker when contrast higher
    const col = `rgb(${val},${val},${val})`;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Low contrast number">
        <rect x={0} y={0} width={size} height={size} fill={`rgb(${bg},${bg},${bg})`} rx={10} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={Math.round(size * 0.5)} fill={col} fontWeight={800} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
          {answer}
        </text>
        <rect x={0} y={0} width={size} height={size} fill="none" stroke="#333" rx={10} />
      </svg>
    );
  }

  // ---------- HANDLERS ----------
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ans = (currentAnswer || "").toString().trim();
    // avoid auto-advance if empty (user must type something)
    if (ans.length === 0) {
      // flash or focus
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    // evaluate correctness
    const target = (currentPlate as any)?.answer ?? null;
    let correct = false;
    if (currentPlate?.type === "grating") {
      // orientation matching
      correct = ans.toLowerCase() === (currentPlate as any).orientation.toLowerCase();
    } else if (currentPlate?.type === "noise" || currentPlate?.type === "number") {
      correct = ans.toLowerCase() === String((currentPlate as any).answer).toLowerCase();
    }

    // save history
    const record = {
      plate: currentPlate as Plate,
      contrast: (currentPlate as any).contrast ?? (currentPlate as any).difficultyFactor ?? 0,
      correct,
      user: ans,
    };
    setHistory((h) => [...h, record]);

    // Staircase 1-up/1-down:
    if (correct) {
      setStaircaseLevel((lvl) => Math.min(8, lvl + 1)); // harder
    } else {
      setStaircaseLevel((lvl) => Math.max(0, lvl - 1)); // easier
    }

    // advance trial
    setAnswers((a) => [...a, ans]);
    setCurrentAnswer("");
    setTrialIndex((t) => t + 1);

    // if finished
    if (trialIndex + 1 >= TOTAL_TRIALS) {
      // compute score (use history + last record)
      setTimeout(() => {
        finishTest([...history, record]);
      }, 120); // tiny delay so UI updates
      return;
    }
  };

  const finishTest = (allRecords: { plate: Plate; contrast: number; correct: boolean; user: string }[]) => {
    const correctCount = allRecords.filter((r) => r.correct).length;
    // map 0..TOTAL_TRIALS -> 1..10
    const finalScore = Math.max(1, Math.round((correctCount / TOTAL_TRIALS) * 9) + 1);
    setShowResult(true);
    setPhase("done");
    onResult(finalScore);
  };

  // ---------- UI (Calibration step + Testing plates + Results) ----------
  if (phase === "calibration") {
    return (
      <div style={{ textAlign: "center" }}>
        <h3 style={{ marginBottom: 8 }}>Distance & Scale Calibration</h3>
        <p style={{ color: "#cbd5e1", marginBottom: 12, maxWidth: 420, marginInline: "auto" }}>
          Use the slider to scale the test plates so the eye-chart letter below is about the size you would read from your viewing distance (~40cm for phone, ~1m for laptop). This improves test accuracy.
        </p>

        {/* Simple eye-chart SVG preview (scales with slider) */}
        <div style={{ margin: "8px auto", width: Math.round(PLATE_SIZE_PX * scale) }}>
          <svg width={PLATE_SIZE_PX * scale} height={(PLATE_SIZE_PX * scale) * 0.6} viewBox={`0 0 ${PLATE_SIZE_PX * scale} ${PLATE_SIZE_PX * 0.6}`}>
            <rect x={0} y={0} width={PLATE_SIZE_PX * scale} height={(PLATE_SIZE_PX * scale) * 0.6} fill="transparent" />
            <text x="50%" y="32%" textAnchor="middle" fontSize={Math.round(PLATE_SIZE_PX * scale * 0.22)} fontWeight={800}>E</text>
            <text x="50%" y="60%" textAnchor="middle" fontSize={Math.round(PLATE_SIZE_PX * scale * 0.12)}>FP</text>
            <text x="50%" y="80%" textAnchor="middle" fontSize={Math.round(PLATE_SIZE_PX * scale * 0.08)}>TOZ</text>
          </svg>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 10 }}>
          <label style={{ color: "#cbd5e1" }}>Scale</label>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: 260 }}
          />
          <div style={{ width: 36, textAlign: "center" }}>{scale.toFixed(2)}x</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => {
              setPhase("testing");
              setTrialIndex(0);
              setHistory([]);
              setAnswers([]);
              setStaircaseLevel(4); // middle difficulty
            }}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done" && showResult) {
    // compute final record-based score for display (history length maybe TOTAL_TRIALS)
    const correct = history.filter((r) => r.correct).length;
    const displayScore = Math.max(1, Math.round((correct / TOTAL_TRIALS) * 9) + 1);
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Test complete</h3>
        <div style={{ marginBottom: 8 }}>Correct: {correct} / {TOTAL_TRIALS}</div>
        <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Score: {displayScore} / 10</div>

        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "left" }}>
          <strong>Details</strong>
          <ol>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {h.plate.type === "grating" ? `Grating (${(h.plate as any).orientation})` : h.plate.type === "noise" ? `Noise (${(h.plate as any).answer})` : `Number (${(h.plate as any).answer})`} — your: {h.user || "(empty)"} — {h.correct ? <span style={{ color: "lightgreen" }}>Correct</span> : <span style={{ color: "salmon" }}>Wrong</span>}
              </li>
            ))}
          </ol>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              // restart
              setPhase("calibration");
              setShowResult(false);
              setTrialIndex(0);
              setHistory([]);
              setAnswers([]);
              setCurrentAnswer("");
            }}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Testing phase: render the current plate and the input
  const p = currentPlate as any;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 8 }}>
        Trial {trialIndex + 1} / {TOTAL_TRIALS} — difficulty level {staircaseLevel}
      </div>

      <div style={{ margin: "8px auto", width: Math.round(PLATE_SIZE_PX * scale) }}>
        {/* render chosen plate type */}
        {p && p.type === "grating" && (
          <GratingSVG orientation={(p as any).orientation} contrast={(p as any).contrast} freq={(p as any).freq} />
        )}

        {p && p.type === "noise" && (
          <NoisePlateSVG answer={(p as any).answer} difficultyFactor={(p as any).difficultyFactor ?? 0.6} />
        )}

        {p && p.type === "number" && (
          <LowContrastNumberSVG answer={(p as any).answer} contrast={(p as any).contrast ?? 0.3} />
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        style={{ marginTop: 12 }}
      >
        <input
          ref={inputRef}
          placeholder="Enter the number/orientation (e.g. 12 or vertical)"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          style={{
            padding: "0.6rem 0.9rem",
            borderRadius: 8,
            border: "1px solid #aaa",
            width: 200,
            textAlign: "center",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter triggers submit (explicit)
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <button
          type="submit"
          style={{
            marginLeft: 10,
            padding: "0.55rem 0.9rem",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {trialIndex + 1 < TOTAL_TRIALS ? "Next" : "Submit"}
        </button>
      </form>

      {/* quick hint + accessibility */}
      <div style={{ marginTop: 10, color: "#cbd5e1" }}>
        <small>
          Tip: type orientation for gratings (vertical / horizontal / diagonal). For number plates type the number you see.
        </small>
      </div>
    </div>
  );
}
