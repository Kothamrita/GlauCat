"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";   // ✅ only ONCE
import type { ComponentType } from "react";
import { useScore } from "../context/ScoreContext";
import styles from "../components/style.module.css";

const IrisTracker = dynamic(() => import("./IrisTracker"), { ssr: false });   // correct




type FieldResult = { score: number; misses: number; avg: number; rts: number[] };

// Dynamic imports
const FieldTest = dynamic(
  () =>
    import("./FieldTest").then((mod) => ({
      default: mod.default as ComponentType<{
        onResult: (result: FieldResult) => void;
      }>,
    })),
  { ssr: false }
);

const ContrastTest = dynamic(
  () =>
    import("./ContrastTest").then((mod) => ({
      default: mod.default as ComponentType<{
        onResult: (score: number) => void;
      }>,
    })),
  { ssr: false }
);

export default function VisualSimulator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const streamRef = useRef<MediaStream | null>(null);

  // Shared score context
  const {
    glaucomaScore,
    setGlaucomaScore,
    cataractScore,
    setCataractScore,
  } = useScore();

  // Derived severity
  const glaucomaSeverity =
    glaucomaScore === null
      ? ""
      : glaucomaScore <= 3
      ? "High"
      : glaucomaScore <= 6
      ? "Moderate"
      : "Low";

  const cataractSeverity =
    cataractScore === null
      ? ""
      : cataractScore <= 3
      ? "High"
      : cataractScore <= 6
      ? "Moderate"
      : "Low";

  // Camera setup
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (!mounted) return;

        streamRef.current = s;
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(msg);
      }
    };

    if (cameraOn) {
      if (!streamRef.current) start();
      else if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      mounted = false;
    };
  }, [cameraOn]);

  // Step state
  const [fieldTestResult, setFieldTestResult] = useState<number | null>(null);
  const [fieldTestStats, setFieldTestStats] = useState<FieldResult | null>(null);
  const [contrastTestResult, setContrastTestResult] = useState<number | null>(
    null
  );

  const [eyeAssessment, setEyeAssessment] = useState("Not started");
  const [eyeAssessmentResult, setEyeAssessmentResult] = useState("");
  const [tracking, setTracking] = useState(false);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className={styles.container}>
      <h1 style={{ color: "#fff", textShadow: "0 2px 8px #000" }}>
        Vision Simulator
      </h1>

      {/* Camera toggle */}
      <button
        onClick={() => setCameraOn((prev) => !prev)}
        className={styles.button}
        style={{
          background: "#000",
          color: "#fff",
          border: "1px solid #fff",
          marginBottom: 16,
        }}
      >
        {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
      </button>

      {cameraError && (
        <div style={{ color: "salmon", marginBottom: 12 }}>
          Camera error: {cameraError}
        </div>
      )}

      {/* Stepper */}
      <div className={styles.stepper} style={{ color: "#fff" }}>
        <span className={step === 1 ? styles.activeStep : ""}>
          1. Glaucoma Test
        </span>
        <span className={step === 2 ? styles.activeStep : ""}>
          2. Glaucoma Field
        </span>
        <span className={step === 3 ? styles.activeStep : ""}>
          3. Cataract Test
        </span>
        <span className={step === 4 ? styles.activeStep : ""}>
          4. Cataract Contrast
        </span>
        <span className={step === 5 ? styles.activeStep : ""}>
          5. Eye Movement
        </span>
        <span className={step === 6 ? styles.activeStep : ""}>6. Summary</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className={styles.card}>
          <h2>Glaucoma Simulation</h2>
          <p>
            We will measure peripheral detection with a quick visual field test.
          </p>

          <div className={styles.buttons}>
            <button className={styles.button} onClick={nextStep}>
              Start Field Test
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className={styles.card}>
          <h2>Glaucoma Visual Field Test</h2>
          <p>Click the dot as soon as you see it.</p>

          <FieldTest
            onResult={(result: FieldResult) => {
              setFieldTestResult(result.score);
              setFieldTestStats(result);
              setGlaucomaScore(result.score);
            }}
          />

          <div className={styles.buttons}>
            <button className={styles.button} onClick={prevStep}>
              Back
            </button>
            <button className={styles.button} onClick={nextStep}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className={styles.card}>
          <h2>Cataract Simulation</h2>
          <p>We will run a color/contrast plate test.</p>

          <div className={styles.buttons}>
            <button className={styles.button} onClick={prevStep}>
              Back
            </button>
            <button className={styles.button} onClick={nextStep}>
              Start Contrast Test
            </button>
          </div>
        </div>
      )}

      {/* ⭐⭐⭐ STEP 4 — FIXED ALIGNMENT ⭐⭐⭐ */}
      {step === 4 && (
        <div className={styles.card}>
          <h2 style={{ textAlign: "center" }}>Cataract Contrast Test</h2>
          <p style={{ textAlign: "center" }}>
            Identify the number you see in the image below.
          </p>

          {/* PERFECT CENTER FIX */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              marginTop: "1rem",
            }}
          >
            <ContrastTest
              onResult={(score: number) => {
                setContrastTestResult(score);
                setCataractScore(score);
              }}
            />
          </div>

          <div className={styles.buttons}>
            <button className={styles.button} onClick={prevStep}>
              Back
            </button>
            <button className={styles.button} onClick={nextStep}>
              Next
            </button>
          </div>
        </div>
      )}
    {/* STEP 5 — Real Eye Tracking */}
    {step === 5 && (
  <div className={styles.card}>
    <h2>Eye Movement Assessment (Iris Tracking)</h2>

    <IrisTracker
      durationSec={12}
      onComplete={(r) => {
        setEyeAssessment("Complete");

        const isNormal = r.left && r.right && r.up && r.down;

        setEyeAssessmentResult(
          isNormal
            ? "Eye movement appears normal."
            : "Abnormal eye movement detected."
        );
      }}
    />

    <div className={styles.buttons}>
      <button className={styles.button} onClick={prevStep}>
        Back
      </button>

      <button
        className={styles.button}
        disabled={eyeAssessment !== "Complete"}
        onClick={nextStep}
      >
        Next
      </button>
    </div>
  </div>
)}


      {/* STEP 6 */}
      {step === 6 && (
        <div className={styles.card}>
          <h2>Simulation Summary</h2>

          <p>
            <strong>Glaucoma Score:</strong> {glaucomaScore} (
            {glaucomaSeverity})
          </p>

          {fieldTestStats && (
            <div style={{ fontSize: 13, color: "#bbb" }}>
              <div>Misses: {fieldTestStats.misses}</div>
              <div>
                Avg reaction: {Math.round(fieldTestStats.avg)}
                ms
              </div>
            </div>
          )}

          <p>
            <strong>Cataract Score:</strong> {cataractScore} (
            {cataractSeverity})
          </p>

          <p>
            <strong>Eye Movement:</strong>{" "}
            {eyeAssessmentResult || "Not assessed"}
          </p>

          <button
            className={styles.button}
            onClick={() => setStep(1)}
            style={{ marginTop: 16 }}
          >
            Restart Simulation
          </button>

          <button
            className={styles.button}
            onClick={() => {
              setGlaucomaScore(null);
              setCataractScore(null);
              setFieldTestResult(null);
              setContrastTestResult(null);
              setFieldTestStats(null);
            }}
            style={{ marginLeft: 12, marginTop: 16 }}
          >
            Reset Scores
          </button>
        </div>
      )}
    </div>
  );
}
