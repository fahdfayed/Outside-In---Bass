import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Metronome } from '../audio/metronome';
import { SpeechCoach } from '../audio/speech';
import { detectPitch, NoteTracker } from '../audio/pitch';

const ANALYSIS_FPS = 20;
const ANALYSIS_WINDOW = 4096;
const CORRECTION_GAP_MS = 12000;
const TEMPO_DROP = 10;

// Drives a whole routine after one Start press: schedules blocks, listens
// continuously, scores each block, speaks corrections, and inserts a repair
// block when a block fails. The only control needed during a run is stop().
export function useHandsFreeSession() {
  const [state, setState] = useState('idle'); // idle | countIn | running | finishing | done | error
  const [block, setBlock] = useState(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [detected, setDetected] = useState(null);
  const [noteCount, setNoteCount] = useState(0);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [tempo, setTempo] = useState(90);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [error, setError] = useState(null);

  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const bufferRef = useRef(null);
  const metronomeRef = useRef(null);
  const speechRef = useRef(null);
  const trackerRef = useRef(null);

  const queueRef = useRef([]);
  const cursorRef = useRef(0);
  const blockStartRef = useRef(0);
  const sessionStartRef = useRef(0);
  const tempoRef = useRef(90);
  const repairedRef = useRef(new Set());
  const sessionIdRef = useRef(null);
  const stoppedRef = useRef(false);
  const tickRef = useRef(null);
  const analysisRef = useRef(null);
  // The interval callbacks are created once, so anything they read that changes
  // between renders has to go through a ref or they will see stale values.
  const stateRef = useRef('idle');
  const advanceRef = useRef(null);

  const setPhase = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const addLog = useCallback((message) => {
    setLog((prev) => [...prev.slice(-40), { message, at: Date.now() }]);
  }, []);

  const teardown = useCallback(() => {
    stoppedRef.current = true;
    if (tickRef.current) clearInterval(tickRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    tickRef.current = null;
    analysisRef.current = null;

    metronomeRef.current?.dispose();
    speechRef.current?.cancel();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close();

    metronomeRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  // Score the block that just finished, then decide what comes next.
  const finishBlock = useCallback(
    async (finished) => {
      const events = trackerRef.current?.events ?? [];
      trackerRef.current?.reset();
      setNoteCount(0);

      let analysis = null;
      try {
        const form = new FormData();
        form.append('exerciseNumber', String(finished.index + 1));
        form.append('detectedNotes', JSON.stringify(events));
        form.append('key', finished.key);
        form.append('mode', finished.mode);
        form.append('tempo', String(finished.tempo));
        form.append('blockSeconds', String(finished.durationSec));
        form.append('expectOutside', String(Boolean(finished.expectOutside)));
        form.append('axis', finished.axis);
        form.append('blockType', finished.type);
        form.append('isRepair', String(Boolean(finished.isRepair)));

        const { data } = await axios.post(
          `/api/recordings/${sessionIdRef.current}/upload`,
          form
        );
        analysis = data.analysis;
      } catch (err) {
        console.error('Block scoring failed:', err);
        addLog('Could not score that block — carrying on.');
        return;
      }

      const passed = analysis.accuracy >= finished.passScore;
      setResults((prev) => [
        ...prev,
        {
          name: finished.name,
          axis: finished.axis,
          isRepair: finished.isRepair,
          expectOutside: Boolean(finished.expectOutside),
          score: analysis.accuracy,
          passed,
          feedback: analysis.feedback,
          outside: analysis.outside,
          habits: analysis.habits ?? []
        }
      ]);
      addLog(
        `${finished.name}: ${analysis.accuracy.toFixed(0)}% — ${passed ? 'pass' : 'below target'}`
      );

      // Unstable timing slows the whole routine down, not just this block.
      if (analysis.tempoStability < 60 && tempoRef.current > 50) {
        tempoRef.current = Math.max(50, tempoRef.current - TEMPO_DROP);
        setTempo(tempoRef.current);
        speechRef.current?.speak(
          `Timing is unstable. Dropping the tempo to ${tempoRef.current}.`,
          { priority: 2 }
        );
        addLog(`Tempo reduced to ${tempoRef.current} BPM.`);
      } else if (analysis.feedback?.length) {
        speechRef.current?.speak(analysis.feedback[0], {
          priority: 1,
          minGapMs: CORRECTION_GAP_MS
        });
      }

      // A failed block earns exactly one repair, inserted next in the queue.
      if (!passed && !finished.isRepair && !repairedRef.current.has(finished.index)) {
        repairedRef.current.add(finished.index);
        try {
          const { data: repair } = await axios.post('/api/routines/repair', {
            block: finished,
            reasons: analysis.feedback ?? []
          });
          queueRef.current.splice(cursorRef.current, 0, repair);
          setTotalBlocks(queueRef.current.length);
          addLog(`Repair block queued for ${finished.name}.`);
        } catch (err) {
          console.error('Could not build repair block:', err);
        }
      }
    },
    [addLog]
  );

  const startBlock = useCallback((next) => {
    // A repair block runs at its own reduced tempo; everything else follows the
    // routine's current tempo, which may have been lowered mid-session.
    const blockTempo = next.isRepair
      ? next.tempo
      : Math.min(next.tempo, tempoRef.current);

    metronomeRef.current?.setTempo(blockTempo);
    trackerRef.current?.reset();
    setNoteCount(0);
    setBlock({ ...next, tempo: blockTempo });
    setBlockIndex(cursorRef.current);
    setBlockElapsed(0);
    blockStartRef.current = Date.now();

    speechRef.current?.speak(`${next.name}. ${next.instruction}`, {
      priority: 2,
      interrupt: true
    });
    addLog(`Started: ${next.name} at ${blockTempo} BPM`);
  }, [addLog]);

  const advance = useCallback(async () => {
    const finished = queueRef.current[cursorRef.current];
    cursorRef.current += 1;

    if (finished) await finishBlock(finished);
    if (stoppedRef.current) return;

    const next = queueRef.current[cursorRef.current];
    if (!next) {
      setPhase('done');
      speechRef.current?.speak('Session complete. Well done.', {
        priority: 2,
        interrupt: true
      });
      metronomeRef.current?.stop();
      try {
        await axios.put(`/api/sessions/${sessionIdRef.current}/complete`, {
          exercises_completed: cursorRef.current
        });
      } catch (err) {
        console.error('Could not mark session complete:', err);
      }
      return;
    }

    startBlock(next);
  }, [finishBlock, startBlock, setPhase]);

  advanceRef.current = advance;

  const start = useCallback(
    async ({ sessionType, durationSeconds, tempo: requestedTempo, key, mode }) => {
      setError(null);
      setResults([]);
      setLog([]);
      stoppedRef.current = false;
      repairedRef.current = new Set();
      cursorRef.current = 0;

      let routine;
      let session;
      try {
        const { data } = await axios.post('/api/routines/start', {
          session_type: sessionType,
          duration_seconds: durationSeconds,
          tempo: requestedTempo,
          key,
          mode
        });
        routine = data.routine;
        session = data.session;
      } catch (err) {
        setError('Could not build the routine. Is the server running?');
        setPhase('error');
        return null;
      }

      sessionIdRef.current = session.id;
      queueRef.current = routine.blocks.map((b) => ({ ...b }));
      setTotalBlocks(queueRef.current.length);
      tempoRef.current = routine.baseTempo;
      setTempo(routine.baseTempo);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      } catch (err) {
        setError('Microphone access is required for a hands-free session.');
        setPhase('error');
        return null;
      }

      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSIS_WINDOW;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      metronomeRef.current = new Metronome(ctx);
      speechRef.current = new SpeechCoach();
      trackerRef.current = new NoteTracker({ minFrames: 2 });

      setPhase('countIn');
      sessionStartRef.current = Date.now();
      speechRef.current.speak(
        `${routine.key} ${routine.mode}. ${routine.blocks.length} blocks. Starting in five.`,
        { priority: 2, interrupt: true }
      );

      metronomeRef.current.setTempo(routine.baseTempo);
      metronomeRef.current.start();

      // Continuous listening for the whole run.
      analysisRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const result = detectPitch(bufferRef.current, ctx.sampleRate);
        setDetected(result);

        if (result) {
          const elapsed = (Date.now() - blockStartRef.current) / 1000;
          const event = trackerRef.current.push(result, Math.max(0, elapsed));
          if (event) setNoteCount(trackerRef.current.events.length);
        } else {
          trackerRef.current.push(null, 0);
        }
      }, 1000 / ANALYSIS_FPS);

      // Single clock drives count-in and every block transition.
      tickRef.current = setInterval(() => {
        if (stoppedRef.current) return;

        const totalElapsed = (Date.now() - sessionStartRef.current) / 1000;
        setSessionElapsed(totalElapsed);

        if (stateRef.current === 'done') return;

        if (!blockStartRef.current) {
          if (totalElapsed >= routine.countInSeconds) {
            setPhase('running');
            startBlock(queueRef.current[0]);
          }
          return;
        }

        const current = queueRef.current[cursorRef.current];
        if (!current) return;

        const elapsed = (Date.now() - blockStartRef.current) / 1000;
        setBlockElapsed(elapsed);

        if (elapsed >= current.durationSec) {
          blockStartRef.current = Date.now();
          advanceRef.current?.();
        }
      }, 200);

      return { session, routine };
    },
    [advance, startBlock, state]
  );

  const stop = useCallback(() => {
    speechRef.current?.speak('Stopping.', { priority: 2, interrupt: true });
    teardown();
    setPhase('done');
    if (sessionIdRef.current) {
      axios
        .put(`/api/sessions/${sessionIdRef.current}/complete`, {
          exercises_completed: cursorRef.current
        })
        .catch((err) => console.error('Could not mark session complete:', err));
    }
  }, [teardown, setPhase]);

  return {
    state,
    block,
    blockIndex,
    blockElapsed,
    sessionElapsed,
    detected,
    noteCount,
    results,
    log,
    tempo,
    error,
    totalBlocks,
    sessionId: sessionIdRef.current,
    start,
    stop
  };
}
