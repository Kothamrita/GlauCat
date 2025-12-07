"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * IrisTracker (CDN FaceMesh) — robust fallback version
 *
 * - Loads @mediapipe/face_mesh via CDN at runtime (no broken NPM import).
 * - Uses landmark groups to compute eye centers and iris proxies.
 * - Auto-calibrates for a few seconds to avoid false "abnormal".
 * - Draws overlay: face box + eye rings.
 * - Calls onComplete({ left, right, up, down, verdict }) when done.
 *
 * Usage:
 * <IrisTracker durationSec={12} onComplete={(res) => {...}} />
 */

type ResultSummary = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  verdict: "normal" | "abnormal";
};

export default function IrisTracker({
  durationSec = 12,
  onComplete,
}: {
  durationSec?: number;
  onComplete: (r: ResultSummary) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("Idle — press Start");
  const [running, setRunning] = useState(false);
  const detections = useRef({ left: 0, right: 0, up: 0, down: 0 });
  const baseline = useRef<{ lx: number; ly: number; rx: number; ry: number } | null>(null);
  const calibFrames = useRef(0);
  const frameCount = useRef(0);

  // thresholds (tweak these if needed)
  const DX_THRESHOLD = 0.035; // normalized delta for left/right
  const DY_THRESHOLD = 0.03; // normalized delta for up/down
  const MIN_DETECTIONS = 8; // number of frames to count a direction as seen
  const CALIB_DURATION_FRAMES = 40; // calibration frames (~1s @30fps)

  // helper: dynamically load script
  function loadScriptOnce(src: string) {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).__faceMeshLoaded && (window as any).FaceMesh) {
        return resolve();
      }
      // check existing tags
      const existing = Array.from(document.getElementsByTagName("script")).find((s) => s.src === src);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", (e) => reject(e));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => {
        (window as any).__faceMeshLoaded = true;
        resolve();
      };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  useEffect(() => {
    let faceMesh: any = null;
    let animationId = 0;
    let stream: MediaStream | null = null;
    let stopTimer: any = null;
    let isMounted = true;

    async function start() {
      try {
        setStatus("Loading face mesh model...");
        // load face_mesh from jsdelivr CDN — this exposes window.FaceMesh
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

        // ensure FaceMesh is available
        const FaceMeshLib = (window as any).FaceMesh;
        if (!FaceMeshLib) {
          setStatus("FaceMesh not available in this browser (CDN failure)");
          return;
        }

        // start camera at high resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (!isMounted) return;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();

        // create FaceMesh instance (no camera_utils)
        faceMesh = new FaceMeshLib({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);

        // small delay then begin
        setStatus("Calibrating — look at center");
        baseline.current = null;
        calibFrames.current = 0;
        frameCount.current = 0;
        detections.current = { left: 0, right: 0, up: 0, down: 0 };

        // frame loop using faceMesh.send({image: video})
        async function process() {
          if (!videoRef.current) return;
          try {
            await faceMesh.send({ image: videoRef.current });
          } catch (err) {
            // ignore single-frame errors
          }
          animationId = requestAnimationFrame(process);
        }
        process();

        // stop after durationSec
        stopTimer = setTimeout(() => {
          finishAndCleanup();
        }, durationSec * 1000);

        setRunning(true);
        setStatus("Running — follow instructions");
      } catch (err) {
        console.error("IrisTracker start error:", err);
        setStatus("Camera / model error — allow camera and try again");
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        setRunning(false);
      }
    }

    function finishAndCleanup() {
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setRunning(false);
      // evaluate detections
      const d = detections.current;
      const leftOK = d.left >= MIN_DETECTIONS;
      const rightOK = d.right >= MIN_DETECTIONS;
      const upOK = d.up >= MIN_DETECTIONS;
      const downOK = d.down >= MIN_DETECTIONS;
      const allOK = leftOK && rightOK && upOK && downOK;
      setStatus(allOK ? "Done — normal" : "Done — possible abnormal");
      onComplete({
        left: leftOK,
        right: rightOK,
        up: upOK,
        down: downOK,
        verdict: allOK ? "normal" : "abnormal",
      });
    }

    // called by FaceMesh onResults
    function onResults(results: any) {
      if (!isMounted) return;
      const c = canvasRef.current;
      const v = videoRef.current;
      if (!v || !c) return;

      const ctx = c.getContext("2d")!;
      const vw = v.videoWidth || v.clientWidth;
      const vh = v.videoHeight || v.clientHeight;
      c.width = vw;
      c.height = vh;
      ctx.clearRect(0, 0, vw, vh);

      frameCount.current += 1;

      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        // draw "no face" overlay
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, vw, vh);
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No face detected — centre your face", vw / 2, vh / 2);
        return;
      }

      const lm = results.multiFaceLandmarks[0];

      // Eye landmark indices groups (MediaPipe face mesh standard indices)
      const leftEyeIdx = [33, 133, 159, 158, 157, 173, 246]; // approximate ring
      const rightEyeIdx = [362, 263, 386, 385, 384, 398, 466];

      // compute centroid of each eye (normalized coordinates)
      function eyeCentroid(indices: number[]) {
        let sx = 0,
          sy = 0;
        for (const i of indices) {
          sx += lm[i].x;
          sy += lm[i].y;
        }
        return { x: sx / indices.length, y: sy / indices.length };
      }

      const leftC = eyeCentroid(leftEyeIdx);
      const rightC = eyeCentroid(rightEyeIdx);

      // convert normalized coords to pixels
      const leftPx = { x: leftC.x * vw, y: leftC.y * vh };
      const rightPx = { x: rightC.x * vw, y: rightC.y * vh };

      // draw face box approx using bounding box from landmarks min/max
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of lm) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      const box = { left: minX * vw, top: minY * vh, w: (maxX - minX) * vw, h: (maxY - minY) * vh };

      // overlay: translucent stage
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      roundRect(ctx, box.left, box.top, box.w, box.h, 14);
      ctx.stroke();

      // eye highlight rings
      drawRing(ctx, leftPx.x, leftPx.y, 22, "rgba(59,130,246,0.35)");
      drawRing(ctx, rightPx.x, rightPx.y, 22, "rgba(59,130,246,0.35)");

      // small dots: eye centers
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(leftPx.x, leftPx.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightPx.x, rightPx.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // calibration: build baseline average for first CALIB_DURATION_FRAMES frames
      if (!baseline.current && calibFrames.current < CALIB_DURATION_FRAMES) {
        if (!baseline.current) baseline.current = { lx: leftC.x, ly: leftC.y, rx: rightC.x, ry: rightC.y };
        // running average
        baseline.current.lx = (baseline.current.lx * calibFrames.current + leftC.x) / (calibFrames.current + 1);
        baseline.current.ly = (baseline.current.ly * calibFrames.current + leftC.y) / (calibFrames.current + 1);
        baseline.current.rx = (baseline.current.rx * calibFrames.current + rightC.x) / (calibFrames.current + 1);
        baseline.current.ry = (baseline.current.ry * calibFrames.current + rightC.y) / (calibFrames.current + 1);
        calibFrames.current += 1;
        const pct = Math.round((calibFrames.current / CALIB_DURATION_FRAMES) * 100);
        setStatus(`Calibrating — please look at center (${pct}%)`);
        if (calibFrames.current >= CALIB_DURATION_FRAMES) {
          setStatus("Calibrated — now look LEFT/RIGHT/UP/DOWN when prompted");
        }
        return;
      }

      // baseline must exist after calibration
      if (!baseline.current) {
        // fallback: treat as calibrated
        baseline.current = { lx: leftC.x, ly: leftC.y, rx: rightC.x, ry: rightC.y };
      }

      // compute deltas (normalized)
      const ldx = leftC.x - baseline.current.lx;
      const ldy = leftC.y - baseline.current.ly;
      const rdx = rightC.x - baseline.current.rx;
      const rdy = rightC.y - baseline.current.ry;

      // average both eyes' deltas
      const dx = (ldx + rdx) / 2;
      const dy = (ldy + rdy) / 2;

      // count detections if thresholds crossed
      if (dx <= -DX_THRESHOLD) detections.current.left += 1;
      if (dx >= DX_THRESHOLD) detections.current.right += 1;
      if (dy <= -DY_THRESHOLD) detections.current.up += 1;
      if (dy >= DY_THRESHOLD) detections.current.down += 1;

      // occasionally update status counts
      if (frameCount.current % 6 === 0) {
        setStatus(
          `Running — L:${detections.current.left} R:${detections.current.right} U:${detections.current.up} D:${detections.current.down}`
        );
      }
    }

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (running) start();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (stopTimer) clearTimeout(stopTimer);
      if (faceMesh && (faceMesh as any).close) {
        try {
          (faceMesh as any).close();
        } catch {}
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [running, durationSec, onComplete]);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 360, height: 270, background: "#000", borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} playsInline muted />
          <canvas ref={canvasRef} style={{ position: "relative", top: -270, pointerEvents: "none" }} />
        </div>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: "#fff" }}>Status:</strong> <span style={{ color: "#d1d5db" }}>{status}</span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => {
                // reset counters and start
                detections.current = { left: 0, right: 0, up: 0, down: 0 };
                baseline.current = null;
                frameCount.current = 0;
                setRunning(true);
              }}
              disabled={running}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: running ? "#777" : "#2563eb",
                color: "#fff",
                cursor: running ? "default" : "pointer",
                boxShadow: running ? "none" : "0 8px 20px rgba(37,99,235,0.24)",
              }}
            >
              {running ? "Running..." : "Start Eye Test"}
            </button>

            <button
              onClick={() => {
                // immediate stop: call onComplete using current counts
                setRunning(false);
                const d = detections.current;
                const leftOK = d.left >= MIN_DETECTIONS;
                const rightOK = d.right >= MIN_DETECTIONS;
                const upOK = d.up >= MIN_DETECTIONS;
                const downOK = d.down >= MIN_DETECTIONS;
                const allOK = leftOK && rightOK && upOK && downOK;
                setStatus(allOK ? "Stopped — normal" : "Stopped — possible abnormal");
                onComplete({
                  left: leftOK,
                  right: rightOK,
                  up: upOK,
                  down: downOK,
                  verdict: allOK ? "normal" : "abnormal",
                });
              }}
              disabled={!running}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#111827",
                color: "#fff",
                cursor: running ? "pointer" : "default",
              }}
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
