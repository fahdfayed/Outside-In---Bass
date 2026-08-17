import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AudioRecorder.css';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const RECORDING_DURATION = 60;

function frequencyToMidi(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

function midiToNoteName(midiNumber) {
  const noteIndex = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export default function AudioRecorder({ sessionId, exerciseNumber, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const recordingRef = useRef(false);
  const chunksRef = useRef([]);
  const detectionsRef = useRef([]);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      recordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const releaseAudio = () => {
    recordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const uploadRecording = async () => {
    setLoading(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('exerciseNumber', exerciseNumber);
      formData.append('detectedNotes', JSON.stringify(detectionsRef.current));

      const response = await axios.post(
        `/api/recordings/${sessionId}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const { analysis } = response.data;
      setFeedback([
        `Accuracy: ${analysis.accuracy.toFixed(1)}%`,
        `Correct notes: ${analysis.notes.correctCount}`,
        `Missed notes: ${analysis.notes.missedCount}`,
        'Moving to next exercise...'
      ]);

      setTimeout(() => onRecordingComplete(response.data), 2000);
    } catch (err) {
      console.error('Error uploading recording:', err);
      setFeedback(['Error uploading recording']);
    } finally {
      setLoading(false);
    }
  };

  const detectPitchLoop = (sampleRate) => {
    const analyser = analyserRef.current;
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!recordingRef.current || !analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(buffer);

      let maxValue = 0;
      let maxBin = 0;
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > maxValue) {
          maxValue = buffer[i];
          maxBin = i;
        }
      }

      if (maxValue / 255 > 0.1) {
        const nyquist = sampleRate / 2;
        const frequency = (maxBin * nyquist) / buffer.length;

        if (frequency > 40 && frequency < 400) {
          const midi = frequencyToMidi(frequency);
          setDetectedPitch({
            frequency: frequency.toFixed(1),
            note: midiToNoteName(midi),
            confidence: Math.round((maxValue / 255) * 100)
          });

          // Log one entry per note change rather than one per animation frame.
          const last = detectionsRef.current[detectionsRef.current.length - 1];
          if (!last || last.midi !== midi) {
            detectionsRef.current.push({
              midi,
              timestamp: (performance.now() - startTimeRef.current) / 1000
            });
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;
      audioContext.createMediaStreamSource(stream).connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        releaseAudio();
        uploadRecording();
      };

      mediaRecorder.start();
      recordingRef.current = true;
      detectionsRef.current = [];
      startTimeRef.current = performance.now();
      setIsRecording(true);
      setRecordingTime(0);
      setDetectedPitch(null);
      setFeedback(['Recording started...']);

      detectPitchLoop(audioContext.sampleRate);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= RECORDING_DURATION - 1) {
            stopRecording();
            return RECORDING_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setFeedback(['Error: could not access microphone']);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
    setIsRecording(false);
    mediaRecorderRef.current.stop();
  };

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="audio-recorder">
      <div className="recorder-controls">
        {!isRecording ? (
          <button className="record-button" onClick={startRecording} disabled={loading}>
            <span className="record-icon">⚫</span>
            Start Recording
          </button>
        ) : (
          <button className="record-button recording" onClick={stopRecording}>
            <span className="record-icon blink">⚫</span>
            Recording...
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-display">
          <div className="time-display">{formatTime(recordingTime)}</div>
          <div className="pitch-display">
            {detectedPitch ? (
              <>
                <div className="detected-note">{detectedPitch.note}</div>
                <div className="detected-freq">{detectedPitch.frequency} Hz</div>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${detectedPitch.confidence}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="no-pitch">Waiting for input...</div>
            )}
          </div>
        </div>
      )}

      {feedback.length > 0 && (
        <div className="feedback-panel">
          {feedback.map((msg, idx) => (
            <div key={idx} className="feedback-line">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
