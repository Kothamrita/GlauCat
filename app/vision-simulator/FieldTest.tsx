import { useState, useRef } from 'react';

// Simulated visual field test: user clicks when dot appears
type FieldResult = { score: number; misses: number; avg: number; rts: number[] };

export default function FieldTest({ onResult }: { onResult: (result: FieldResult) => void }) {
  const [started, setStarted] = useState(false);
  const [dotVisible, setDotVisible] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const reactionTimesRef = useRef<number[]>([]);
  const [misses, setMisses] = useState(0);
  const missesRef = useRef(0);
  const [trial, setTrial] = useState(0);
  const trialRef = useRef(0);
  const [dotPos, setDotPos] = useState<{ left: number; top: number }>({ left: 100, top: 50 });
  const [done, setDone] = useState(false);
  // Configurable test difficulty (user/developer can change before starting)
  const [totalTrials, setTotalTrials] = useState(6);
  const totalTrialsRef = useRef(6);
  const [maxReaction, setMaxReaction] = useState(2000); // ms
  const maxReactionRef = useRef(2000);

  const startTimeRef = useRef<number | null>(null);
  const dotVisibleRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const randomDotPos = () => {
    const positions = [
      { left: 10, top: 10 },
      { left: 170, top: 10 },
      { left: 10, top: 70 },
      { left: 170, top: 70 },
      { left: 10, top: 40 },
      { left: 170, top: 40 },
    ];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const getRandomDelay = () => 1000 + Math.random() * 1000;

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const [showMissFeedback, setShowMissFeedback] = useState(false);

  const showDot = () => {
    clearTimer();
    setDotVisible(false);
    dotVisibleRef.current = false;
    const delay = getRandomDelay();
    const missDelay = delay + maxReactionRef.current;
    timerRef.current = window.setTimeout(() => {
      // miss
      if (dotVisibleRef.current) {
        missesRef.current += 1;
        setMisses(missesRef.current);
        setShowMissFeedback(true);
        // flash feedback
        window.setTimeout(() => setShowMissFeedback(false), 700);
        console.log('Missed dot at trial', trialRef.current + 1);
      }
      dotVisibleRef.current = false;
      setDotVisible(false);
      // advance
      if (trialRef.current + 1 < totalTrialsRef.current) {
        trialRef.current += 1;
        setTrial(trialRef.current);
        showDot();
      } else {
        finishTest();
      }
    }, missDelay);
    window.setTimeout(() => {
      setDotPos(randomDotPos());
      setDotVisible(true);
      dotVisibleRef.current = true;
      startTimeRef.current = Date.now();
    }, delay);
  };

  const startTest = () => {
    // reset refs and state
    clearTimer();
    reactionTimesRef.current = [];
    setReactionTimes([]);
    missesRef.current = 0;
    setMisses(0);
    trialRef.current = 0;
    setTrial(0);
    // sync refs for configurable values
    totalTrialsRef.current = totalTrials;
    maxReactionRef.current = maxReaction;
    setDone(false);
    setStarted(true);
    showDot();
  };

  const handleClick = () => {
    if (!dotVisibleRef.current || !startTimeRef.current) return;
    // eslint-disable-next-line
    const reaction = Date.now() - startTimeRef.current;
    // update refs and state synchronously
    reactionTimesRef.current = [...reactionTimesRef.current, reaction];
    setReactionTimes([...reactionTimesRef.current]);
    // clear miss timer
    clearTimer();
    dotVisibleRef.current = false;
    setDotVisible(false);
    // advance or finish
    if (trialRef.current + 1 < totalTrialsRef.current) {
      trialRef.current += 1;
      setTrial(trialRef.current);
      // short pause before next dot
      timerRef.current = window.setTimeout(showDot, 800);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    clearTimer();
    setDone(true);
    // compute average using ref to ensure last click included
    const rts = reactionTimesRef.current;
    const avg = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : maxReaction;
    let score = 10 - missesRef.current - Math.round((avg - 200) / 200);
    score = Math.max(1, Math.min(10, score));
    console.log('FieldTest finished. rts=', rts, 'misses=', missesRef.current, 'avg=', avg, 'score=', score);
    // Provide detailed result to caller
    onResult({ score, misses: missesRef.current, avg, rts });
  };

  if (!started)
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Trials:</label>
          <input type="number" min={3} max={12} value={totalTrials} onChange={(e) => setTotalTrials(Math.max(3, Math.min(12, Number(e.target.value) || 6)))} style={{ width: 60 }} />
          <label style={{ marginLeft: 12, marginRight: 8 }}>Max reaction (ms):</label>
          <input type="number" min={800} max={5000} value={maxReaction} onChange={(e) => setMaxReaction(Math.max(800, Math.min(5000, Number(e.target.value) || 2000)))} style={{ width: 90 }} />
        </div>
        <button onClick={startTest}>Start Visual Field Test</button>
      </div>
    );

  if (done)
    return <div style={{ textAlign: 'center', minHeight: 120 }}>
      <div style={{ margin: 16 }}>
        Test complete.<br />
        Misses: {misses} / {totalTrials}<br />
        Avg. Reaction: {reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : '-'} ms
      </div>
      <div style={{ color: misses > 1 ? 'red' : '#333' }}>
        {misses > 1 ? 'Possible visual field loss detected.' : 'Visual field appears normal.'}
      </div>
    </div>;

  return (
    <div style={{ textAlign: 'center', minHeight: 120 }}>
      <div style={{ margin: 16 }}>
        Trial {trial + 1} of {totalTrials}
      </div>
      <div style={{ position: 'relative', width: 200, height: 100, margin: '0 auto', background: showMissFeedback ? '#ffdddd' : '#eee', borderRadius: 8, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 10, height: 10, background: '#333', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
        {dotVisible && (
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              left: dotPos.left,
              top: dotPos.top,
              width: 20,
              height: 20,
              background: 'red',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            title="Click when you see the dot"
          />
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        {dotVisible ? 'Click the red dot!' : 'Wait for the dot...'}
      </div>
    </div>
  );
}