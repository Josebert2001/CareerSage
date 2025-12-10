
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Radio, Volume2 } from 'lucide-react';
import { LIVE_SYSTEM_PROMPT } from '../constants';
import { arrayBufferToBase64, base64ToArrayBuffer, float32To16BitPCM, pcmToAudioBuffer } from '../utils/audio';

interface VoiceSessionProps {
  onEndSession: () => void;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({ onEndSession }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [volume, setVolume] = useState(0);

  // Audio Contexts & Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Session & Playback State
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    startSession();
    return () => {
      cleanupSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    if (!apiKey) {
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      // Input: 16kHz for Gemini
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz from Gemini
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);

      // Setup Analyzer for visualizer
      analyzerRef.current = outputAudioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      outputNodeRef.current.connect(analyzerRef.current);
      startVisualizer();

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Live API
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: LIVE_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }], // Enable Search Grounding for Voice
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            console.log('Voice session opened');
            setStatus('connected');
            setIsConnected(true);
            setupAudioInput(stream);
          },
          onmessage: async (message: LiveServerMessage) => {
            await handleServerMessage(message);
          },
          onclose: () => {
            console.log('Voice session closed');
            setStatus('disconnected');
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error('Voice session error:', err);
            setStatus('error');
          }
        }
      });

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('error');
    }
  };

  const setupAudioInput = (stream: MediaStream) => {
    if (!inputAudioContextRef.current) return;

    inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
    // Buffer size 4096, 1 input channel, 1 output channel
    processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return;

      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16 PCM ArrayBuffer
      const pcm16 = float32To16BitPCM(inputData);
      // Convert to Base64
      const base64Data = arrayBufferToBase64(new Uint8Array(pcm16));

      sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      });
    };

    inputSourceRef.current.connect(processorRef.current);
    processorRef.current.connect(inputAudioContextRef.current.destination);
  };

  const handleServerMessage = async (message: LiveServerMessage) => {
    const serverContent = message.serverContent;

    // Handle Interruption (User spoke while AI was speaking)
    if (serverContent?.interrupted) {
      stopAllScheduledAudio();
      return;
    }

    // Handle Audio Output
    const modelTurn = serverContent?.modelTurn;
    if (modelTurn?.parts) {
      for (const part of modelTurn.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Audio = part.inlineData.data;
          await queueAudioChunk(base64Audio);
        }
      }
    }
  };

  const queueAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current || !outputNodeRef.current) return;

    const ctx = outputAudioContextRef.current;
    const audioBytes = base64ToArrayBuffer(base64Audio);
    
    try {
      const audioBuffer = await pcmToAudioBuffer(audioBytes, ctx, 24000);
      
      // Schedule playback
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputNodeRef.current);

      // Determine start time (cursor)
      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      // Track source for cancellation
      scheduledSourcesRef.current.add(source);
      source.onended = () => {
        scheduledSourcesRef.current.delete(source);
      };

    } catch (e) {
      console.error("Error decoding audio chunk", e);
    }
  };

  const stopAllScheduledAudio = () => {
    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) { /* ignore already stopped */ }
    });
    scheduledSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startVisualizer = () => {
    const update = () => {
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        // Calculate average volume
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const cleanupSession = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
    
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    
    stopAllScheduledAudio();
  };

  // UI Components
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn p-6">
      <div className="relative mb-12">
        {/* Visualizer Circle */}
        <div 
          className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-100 ease-out border-4 ${
            status === 'connected' ? 'border-emerald-500/30' : 'border-slate-200'
          }`}
          style={{
            transform: `scale(${1 + (volume / 255) * 0.5})`,
            boxShadow: `0 0 ${volume / 2}px rgba(16, 185, 129, 0.5)`
          }}
        >
          <div className="bg-white p-6 rounded-full shadow-lg relative z-10">
            {status === 'connecting' && <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full" />}
            {status === 'connected' && <Radio className="w-16 h-16 text-emerald-600 animate-pulse" />}
            {status === 'error' && <PhoneOff className="w-16 h-16 text-red-500" />}
          </div>
        </div>

        {/* Status Text */}
        <div className="absolute -bottom-10 left-0 right-0 text-center">
            <p className="text-lg font-medium text-slate-700">
                {status === 'connecting' && "Connecting to CareerSage Voice..."}
                {status === 'connected' && (isMuted ? "Microphone Muted" : "Listening (Search Enabled)...")}
                {status === 'error' && "Connection Failed"}
            </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all ${
            isMuted 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          disabled={status !== 'connected'}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={onEndSession}
          className="bg-red-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>

      <div className="mt-8 p-4 bg-emerald-50 text-emerald-800 rounded-lg max-w-md text-center text-sm">
        <p>Tip: Ask about real-time updates like "When is the next JAMB exam?" or "What are current tech salaries?"</p>
      </div>
    </div>
  );
};

export default VoiceSession;
