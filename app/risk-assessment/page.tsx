'use client';
import { useScore } from '../context/ScoreContext';
import styles from '../components/style.module.css';
import { useState } from 'react';

export default function RiskAssessment() {
  const { glaucomaScore, setGlaucomaScore, cataractScore, setCataractScore } = useScore();
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className={styles.container}>
      <h1>Risk Assessment</h1>
      {/* Stepper & Forms here */}
      {step === 1 && (
        <div className={styles.card}>
          <h2>Glaucoma Test</h2>
          <input
            type="number"
            placeholder="Enter glaucoma score"
            value={glaucomaScore ?? ''}
            onChange={(e) => setGlaucomaScore(Number(e.target.value))}
            className={styles.input}
          />
          <button onClick={nextStep} className={styles.button}>Next</button>
        </div>
      )}
      {step === 2 && (
        <div className={styles.card}>
          <h2>Cataract Test</h2>
          <input
            type="number"
            placeholder="Enter cataract score"
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
      {step === 3 && (
        <div className={styles.card}>
          <h2>Summary</h2>
          <p>Glaucoma Score: {glaucomaScore}</p>
          <p>Cataract Score: {cataractScore}</p>
          <button onClick={() => setStep(1)} className={styles.button}>Restart</button>
        </div>
      )}
    </div>
  );
}
