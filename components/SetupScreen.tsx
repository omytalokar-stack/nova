
import React, { useState, useEffect } from 'react';
import { androidBridge } from '../services/androidBridge';

interface SetupScreenProps {
  onComplete: () => void;
  onAlreadyAllowed?: () => Promise<boolean>;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, onAlreadyAllowed }) => {
  const [permissions, setPermissions] = useState({
    microphone: false,
    contacts: false,
    calls: false,
  });
  const [loading, setLoading] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [permissionsDenied, setPermissionsDenied] = useState(false);

  // Check if permissions are already granted on component mount
  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        // Try to query microphone permission status
        const permissionStatus = await navigator.permissions?.query?.({ name: 'microphone' });
        
        if (permissionStatus?.state === 'granted') {
          // Permissions already granted, auto-proceed
          setPermissions({
            microphone: true,
            contacts: true,
            calls: true,
          });
          setCheckingPermissions(false);
          
          // Auto-complete after brief delay to show success
          setTimeout(() => {
            onComplete();
          }, 500);
          return;
        }

        // Also check if getUserMedia works (fallback for older browsers)
        if (permissionStatus?.state !== 'denied') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            setPermissions({
              microphone: true,
              contacts: true,
              calls: true,
            });
            setCheckingPermissions(false);
            
            setTimeout(() => {
              onComplete();
            }, 500);
            return;
          } catch (e) {
            // Permissions not yet requested
            console.log("Permissions not yet requested");
          }
        } else {
          setPermissionsDenied(true);
        }
      } catch (err) {
        console.log("Could not check permissions:", err);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkExistingPermissions();
  }, [onComplete]);

  const requestAll = async () => {
    setLoading(true);
    try {
      // Request real microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Native mock bridge calls
      await androidBridge.requestPermissions();
      
      setPermissions({
        microphone: true,
        contacts: true,
        calls: true,
      });
      
      setPermissionsDenied(false);
      
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      console.error("Permission request failed:", err);
      setPermissionsDenied(true);
      alert("Microphone permission is required for Nova AI to function. Please enable it in your device settings.");
    } finally {
      setLoading(false);
    }
  };

  const skipPermissions = async () => {
    // If callback provided, check permissions before allowing skip
    if (onAlreadyAllowed) {
      setLoading(true);
      try {
        const granted = await onAlreadyAllowed();
        if (granted) {
          console.log('[ALREADY ALLOWED?] Permission check passed');
          setTimeout(() => {
            onComplete();
          }, 500);
        } else {
          console.log('[ALREADY ALLOWED?] Permission check failed');
          setPermissionsDenied(true);
          alert("Microphone permission is required. Please check your device settings.");
        }
      } catch (err) {
        console.error('[ALREADY ALLOWED?] Check failed:', err);
        setPermissionsDenied(true);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback for web: just proceed
      onComplete();
    }
  };

  // Loading state - checking existing permissions
  if (checkingPermissions) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            NOVA AI
          </h1>
          <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Voice Core Synchronization</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl w-full max-w-md space-y-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-300 text-sm">Checking system permissions...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {permissionsDenied && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            <p className="font-semibold mb-2">⚠️ Permissions Denied</p>
            <p>Go to device settings and allow microphone access for Nova AI.</p>
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={requestAll}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>AUTHORIZE ACCESS <i className="fas fa-chevron-right text-xs"></i></>
            )}
          </button>

          <button 
            onClick={skipPermissions}
            disabled={loading}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-sm text-gray-400 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
                <span>CHECKING...</span>
              </div>
            ) : (
              <>ALREADY ALLOWED? <i className="fas fa-arrow-right text-xs ml-2"></i></>
            )}
          </button>
        </div>
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
