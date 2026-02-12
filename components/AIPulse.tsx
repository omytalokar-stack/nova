
import React from 'react';
import { AppState } from '../types';

interface AIPulseProps {
  state: AppState;
}

const AIPulse: React.FC<AIPulseProps> = ({ state }) => {
  const getPulseColor = () => {
    switch (state) {
      case AppState.SPEAKING: return 'bg-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.6)]';
      case AppState.LISTENING: return 'bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.6)]';
      case AppState.ERROR: return 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)]';
      case AppState.SETUP: return 'bg-gray-500 shadow-none';
      default: return 'bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Rings */}
      <div className={`absolute w-full h-full rounded-full border border-blue-500/20 ${state === AppState.SPEAKING || state === AppState.LISTENING ? 'pulse-ring' : ''}`}></div>
      <div className={`absolute w-3/4 h-3/4 rounded-full border border-purple-500/20 delay-500 ${state === AppState.SPEAKING || state === AppState.LISTENING ? 'pulse-ring' : ''}`}></div>
      
      {/* Central Core */}
      <div className={`relative w-24 h-24 rounded-full ${getPulseColor()} flex items-center justify-center transition-all duration-500 z-10 pulse-dot`}>
        <i className={`fas ${state === AppState.SPEAKING ? 'fa-volume-up' : state === AppState.LISTENING ? 'fa-microphone' : 'fa-bolt'} text-white text-3xl`}></i>
      </div>
      
      {/* Dynamic Glow Overlay */}
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${getPulseColor()}`}></div>
    </div>
  );
};

export default AIPulse;
