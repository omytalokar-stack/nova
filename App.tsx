
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SetupScreen from './components/SetupScreen';
import AIPulse from './components/AIPulse';
import { AppState, LogEntry, TranscriptionPart } from './types';
import { MODEL_NAME, SYSTEM_INSTRUCTION, SAMPLE_RATE_IN, SAMPLE_RATE_OUT } from './constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeBase64, decodeAudioData, createPcmBlob } from './services/audioUtils';
import { androidBridge } from './services/androidBridge';

// Audio Worklet Code as a Data URL for low-latency capture
const WORKLET_CODE = `
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      this.port.postMessage(channelData);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PcmProcessor);
`;
const WORKLET_URL = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'application/javascript' }));

const App: React.FC = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transcriptions, setTranscriptions] = useState<TranscriptionPart[]>([]);
  
  // Refs for persistent objects
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const reconnectIntervalRef = useRef<number | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [...prev, { ...entry, id: Math.random().toString(), timestamp: new Date() }]);
  }, []);

  const addTranscription = useCallback((part: TranscriptionPart) => {
    setTranscriptions(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === part.role) {
        return [...prev.slice(0, -1), { ...last, text: last.text + part.text }];
      }
      return [...prev, part];
    });
  }, []);

  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const connectToGemini = useCallback(async () => {
    if (sessionRef.current) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      addLog({ type: 'system', message: 'Connecting to Nova Core...' });
      
      const session = await ai.live.connect({
        model: MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            addLog({ type: 'system', message: 'Vocal core stabilized. Nova is online.' });
            setAppState(AppState.IDLE);
            if (reconnectIntervalRef.current) {
              clearInterval(reconnectIntervalRef.current);
              reconnectIntervalRef.current = null;
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio output
            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64 && audioContextOutRef.current) {
              setAppState(AppState.SPEAKING);
              const ctx = audioContextOutRef.current;
              const bytes = decodeBase64(audioBase64);
              const buffer = await decodeAudioData(bytes, ctx, SAMPLE_RATE_OUT, 1);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setAppState(AppState.IDLE);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Transcription
            if (message.serverContent?.outputTranscription) {
              addTranscription({ id: Date.now().toString(), role: 'model', text: message.serverContent.outputTranscription.text });
            } else if (message.serverContent?.inputTranscription) {
              addTranscription({ id: Date.now().toString(), role: 'user', text: message.serverContent.inputTranscription.text });
            }

            // Interruptions
            if (message.serverContent?.interrupted) {
              stopAllAudio();
              addLog({ type: 'system', message: 'Nova interrupted.' });
            }
          },
          onerror: (err) => {
            console.error("Gemini Error:", err);
            setAppState(AppState.ERROR);
            addLog({ type: 'system', message: 'Vocal link lost. Attempting resync...' });
            sessionRef.current = null;
            initReconnect();
          },
          onclose: () => {
            addLog({ type: 'system', message: 'Connection closed.' });
            sessionRef.current = null;
            initReconnect();
          }
        }
      });

      sessionRef.current = session;

      // Initialize Audio In (Worklet)
      if (!audioContextInRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctxIn = new AudioContext({ sampleRate: SAMPLE_RATE_IN });
        await ctxIn.audioWorklet.addModule(WORKLET_URL);
        
        const source = ctxIn.createMediaStreamSource(stream);
        const processor = new AudioWorkletNode(ctxIn, 'pcm-processor');
        
        processor.port.onmessage = (e) => {
          const inputData = e.data;
          if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({ media: createPcmBlob(inputData) });
          }
        };
        
        source.connect(processor);
        audioContextInRef.current = ctxIn;
      }

      // Initialize Audio Out
      if (!audioContextOutRef.current) {
        audioContextOutRef.current = new AudioContext({ sampleRate: SAMPLE_RATE_OUT });
      }

    } catch (err) {
      console.error("Connection Failed:", err);
      setAppState(AppState.ERROR);
      initReconnect();
    }
  }, [addLog, addTranscription, stopAllAudio]);

  const initReconnect = useCallback(() => {
    if (reconnectIntervalRef.current) return;
    reconnectIntervalRef.current = window.setInterval(() => {
      connectToGemini();
    }, 3000);
  }, [connectToGemini]);

  const handleStartSession = () => {
    setIsSetup(true);
    connectToGemini();
    androidBridge.toggleForegroundService(true, addLog);
  };

  if (!isSetup) {
    return <SetupScreen onComplete={handleStartSession} />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <i className="fas fa-microchip text-xs"></i>
          </div>
          <span className="font-black tracking-tighter text-xl">NOVA<span className="text-blue-500">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${appState === AppState.ERROR ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Linked</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1e26_1px,transparent_1px)] [background-size:40px_40px] opacity-20 pointer-events-none"></div>
        
        <AIPulse state={appState} />
        
        <div className="mt-8 text-center space-y-2 z-10">
          <h2 className="text-2xl font-light tracking-widest text-blue-200">
            {appState === AppState.SPEAKING ? 'TRANSMITTING' : appState === AppState.LISTENING ? 'LISTENING' : 'STANDBY'}
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-[0.3em]">Quantum Encrypted Link Active</p>
        </div>
      </main>

      {/* Panels Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-1/3 min-h-[250px] border-t border-white/10 bg-[#0a0a0c]">
        
        {/* Transcription Panel */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Live Transcription</span>
            <i className="fas fa-closed-captioning text-gray-600 text-xs"></i>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm">
            {transcriptions.length === 0 && (
              <p className="text-gray-700 italic text-center py-4">Waiting for audio signal...</p>
            )}
            {transcriptions.map((t) => (
              <div key={t.id} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] uppercase font-bold text-gray-600 mb-1">{t.role}</span>
                <p className={`p-3 rounded-2xl max-w-[90%] ${t.role === 'user' ? 'bg-blue-900/40 text-blue-100 rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none'}`}>
                  {t.text}
                </p>
              </div>
            ))}
            <div ref={transcriptionEndRef} />
          </div>
        </div>

        {/* Activity Log Panel */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Activity Stream</span>
            <i className="fas fa-terminal text-gray-600 text-xs"></i>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.id} className="text-[11px] mb-2 font-mono flex gap-3">
                <span className="text-gray-600 shrink-0">{log.timestamp.toLocaleTimeString([], { hour12: false })}</span>
                <span className={`
                  ${log.type === 'system' ? 'text-cyan-500' : ''}
                  ${log.type === 'action' ? 'text-orange-400 font-bold' : ''}
                  ${log.type === 'ai' ? 'text-blue-400' : 'text-gray-400'}
                `}>
                  [{log.type.toUpperCase()}] {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Android Optimized) */}
      <div className="p-4 bg-black border-t border-white/10 flex justify-around items-center gap-4">
         <ActionButton icon="fa-phone-slash" color="bg-red-500/20 text-red-500" onClick={() => androidBridge.handleCall('end', addLog)} label="End Call" />
         <ActionButton icon="fa-phone" color="bg-green-500/20 text-green-500" onClick={() => androidBridge.handleCall('answer', addLog)} label="Answer" />
         <ActionButton icon="fa-whatsapp" color="bg-emerald-500/20 text-emerald-500" onClick={() => androidBridge.openWhatsApp('+1234567890', addLog)} label="WhatsApp" />
         <ActionButton icon="fa-power-off" color="bg-white/5 text-gray-500" onClick={() => window.location.reload()} label="Reset" />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: string; color: string; onClick: () => void; label: string }> = ({ icon, color, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 group`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-90 ${color}`}>
      <i className={`fab ${icon.startsWith('fa-whatsapp') ? icon : 'fas ' + icon} text-lg`}></i>
    </div>
    <span className="text-[9px] uppercase font-bold text-gray-500">{label}</span>
  </button>
);

export default App;
