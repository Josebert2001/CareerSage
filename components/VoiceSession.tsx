
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import React, { useEffect, useRef, useState } from 'react';
import { FileText, Mic, MicOff, PhoneOff, Radio } from 'lucide-react';
import { LIVE_SYSTEM_PROMPT } from '../constants';
import { UserProfile } from '../types';
import { arrayBufferToBase64, base64ToArrayBuffer, float32To16BitPCM, pcmToAudioBuffer } from '../utils/audio';

interface VoiceSessionProps {
  onEndSession: () => void;
  userProfile: UserProfile;
  onGenerateReport: () => void;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({ onEndSession, userProfile, onGenerateReport }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [volume, setVolume] = useState(0);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    startSession();
    return () => {
      cleanupSession();
    };
  }, []);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (inputAudioContextRef.current.state === 'suspended') await inputAudioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);

      analyzerRef.current = outputAudioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      outputNodeRef.current.connect(analyzerRef.current);
      startVisualizer();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const profileContext = userProfile.name 
        ? `\n\nUSER PROFILE DATA:\n${JSON.stringify(userProfile, null, 2)}` 
        : '\n\nUSER PROFILE: Fresh user.';

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          systemInstruction: LIVE_SYSTEM_PROMPT + profileContext,
          tools: [{ googleSearch: {} }],
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsConnected(true);
            setupAudioInput(stream);
          },
          onmessage: async (message: LiveServerMessage) => {
            await handleServerMessage(message);
          },
          onclose: () => {
            setStatus('disconnected');
            setIsConnected(false);
          },
          onerror: async (err) => {
            console.error('Voice session error:', err);
            setStatus('error');
            if (window.aistudio?.openSelectKey) {
                await window.aistudio.openSelectKey();
            }
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
    processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(inputData);
      const base64Data = arrayBufferToBase64(new Uint8Array(pcm16));
      sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({
          media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
        });
      });
    };
    inputSourceRef.current.connect(processorRef.current);
    processorRef.current.connect(inputAudioContextRef.current.destination);
  };

  const handleServerMessage = async (message: LiveServerMessage) => {
    const serverContent = message.serverContent;
    if (serverContent?.interrupted) {
      stopAllScheduledAudio();
      return;
    }
    const modelTurn = serverContent?.modelTurn;
    if (modelTurn?.parts) {
      for (const part of modelTurn.parts) {
        if (part.inlineData && part.inlineData.data) {
          await queueAudioChunk(part.inlineData.data);
        }
      }
    }
  };

  const queueAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current || !outputNodeRef.current) return;
    const ctx = outputAudioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    const audioBytes = base64ToArrayBuffer(base64Audio);
    try {
      const audioBuffer = await pcmToAudioBuffer(audioBytes, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputNodeRef.current);
      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      scheduledSourcesRef.current.add(source);
      source.onended = () => scheduledSourcesRef.current.delete(source);
    } catch (e) { console.error(e); }
  };

  const stopAllScheduledAudio = () => {
    scheduledSourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    scheduledSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startVisualizer = () => {
    const update = () => {
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        setVolume(dataArray.reduce((a, b) => a + b) / dataArray.length);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn p-6">
      <div className="relative mb-12">
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
      </div>
      <div className="flex flex-col items-center gap-6 mt-8">
        <div className="flex items-center gap-6">
            <button onClick={() => setIsMuted(!isMuted)} className="p-4 rounded-full bg-slate-100">{isMuted ? <MicOff /> : <Mic />}</button>
            <button onClick={onEndSession} className="bg-red-500 text-white px-8 py-3 rounded-full font-semibold">End Call</button>
        </div>
        {status === 'connected' && <button onClick={onGenerateReport} className="bg-emerald-600 text-white px-6 py-2.5 rounded-full">Generate Written Plan</button>}
      </div>
    </div>
  );
};

export default VoiceSession;
