
import React, { useState, useEffect } from 'react';
import { androidBridge } from '../services/androidBridge';

interface SetupScreenProps {
  onComplete: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [permissions, setPermissions] = useState({
    microphone: false,
    contacts: false,
    calls: false,
  });
  const [loading, setLoading] = useState(false);

  const requestAll = async () => {
    setLoading(true);
    // Real microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Native mock bridge calls
      await androidBridge.requestPermissions();
      
      setPermissions({
        microphone: true,
        contacts: true,
        calls: true,
      });
      
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      console.error("Microphone denied", err);
      alert("Microphone permission is required for Nova AI to function.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          NOVA AI
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Voice Core Synchronization</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-md space-y-6">
        <h2 className="text-xl font-bold border-b border-white/10 pb-4">Initializing Systems...</h2>
        
        <div className="space-y-4">
          <PermissionRow icon="fa-microphone" label="Vocal Interface" status={permissions.microphone} />
          <PermissionRow icon="fa-address-book" label="Social Directory" status={permissions.contacts} />
          <PermissionRow icon="fa-phone-flip" label="Telephony Module" status={permissions.calls} />
        </div>

        <button 
          onClick={requestAll}
          disabled={loading}
          className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>AUTHORIZE ACCESS <i className="fas fa-chevron-right text-xs"></i></>
          )}
        </button>
      </div>
    </div>
  );
};

const PermissionRow: React.FC<{ icon: string; label: string; status: boolean }> = ({ icon, label, status }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
    {status && <i className="fas fa-check-circle text-green-500"></i>}
  </div>
);

export default SetupScreen;
