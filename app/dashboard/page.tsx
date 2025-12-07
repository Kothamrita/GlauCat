'use client';
import { useState, useEffect, useRef } from 'react';
import { useScore } from '../context/ScoreContext';
import styles from '../components/style.module.css';

export default function Dashboard() {
  const { glaucomaScore, setGlaucomaScore, cataractScore, setCataractScore } = useScore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);

  // Stepper for risk assessment
  const [step, setStep] = useState(1);

  // Compute severity dynamically (higher score = better vision, lower risk)
  const glaucomaSeverity =
    glaucomaScore === null ? '' : glaucomaScore <= 3 ? 'High' : glaucomaScore <= 6 ? 'Moderate' : 'Low';
  const cataractSeverity =
    cataractScore === null ? '' : cataractScore <= 3 ? 'High' : cataractScore <= 6 ? 'Moderate' : 'Low';

  // Camera setup
  useEffect(() => {
    if (cameraOn && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current!.srcObject = stream;
          videoRef.current!.play();
        })
        .catch((err) => console.error('Error accessing camera:', err));
    } else if (!cameraOn && videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [cameraOn]);

  // Navigation
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className={styles.container}>
      <h1>GlauCat Dashboard</h1>
      <p>Welcome to your Glaucoma & Cataract monitoring platform.</p>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)} className={styles.button}>
        {cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
      </button>
      {cameraOn && <video ref={videoRef} className={styles.video} />}

      {/* Quick Score Summary */}
      <div className={styles.card}>
        <h2>Current Scores</h2>
        <p>Glaucoma Score: {glaucomaScore ?? 'Not set'} ({glaucomaSeverity})</p>
        <p>Cataract Score: {cataractScore ?? 'Not set'} ({cataractSeverity})</p>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        <span className={step === 1 ? styles.activeStep : ''}>1. Glaucoma</span>
        <span className={step === 2 ? styles.activeStep : ''}>2. Cataract</span>
        <span className={step === 3 ? styles.activeStep : ''}>3. Summary</span>
      </div>

      {/* Step 1: Glaucoma */}
      {step === 1 && (
        <div className={styles.card}>
          <h2>Glaucoma Assessment</h2>
          <input
            type="number"
            placeholder="Enter glaucoma score (1-10)"
            value={glaucomaScore ?? ''}
            onChange={(e) => setGlaucomaScore(Number(e.target.value))}
            className={styles.input}
          />
          <div className={styles.buttons}>
            <button onClick={nextStep} className={styles.button}>Next</button>
          </div>
        </div>
      )}

      {/* Step 2: Cataract */}
      {step === 2 && (
        <div className={styles.card}>
          <h2>Cataract Assessment</h2>
          <input
            type="number"
            placeholder="Enter cataract score (1-10)"
            value={cataractScore ?? ''}
            onChange={(e) => setCataractScore(Number(e.target.value))}
            className={styles.input}
          />
          <div className={styles.buttons}>
            <button onClick={prevStep} className={styles.button}>Back</button>
            <button onClick={nextStep} className={styles.button}>Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className={styles.card}>
          <h2>Summary</h2>
          <p>Glaucoma Score: {glaucomaScore} ({glaucomaSeverity})</p>
          <p>Cataract Score: {cataractScore} ({cataractSeverity})</p>
          <p>
            Recommendations:
            <br />
            {glaucomaScore && glaucomaScore <= 3
              ? 'Consult an ophthalmologist for glaucoma follow-up.'
              : 'Glaucoma risk is low or moderate.'}
            <br />
            {cataractScore && cataractScore <= 3
              ? 'Consult an ophthalmologist for cataract evaluation.'
              : 'Cataract risk is low or moderate.'}
          </p>
          <button onClick={() => setStep(1)} className={styles.button}>Restart Assessment</button>
        </div>
      )}
    </div>
  );
}
