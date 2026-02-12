
import { LogEntry } from '../types';

/**
 * Mocks and encapsulates Android-specific functionality.
 * In a real production app, these would call Capacitor.Plugins.
 */
export const androidBridge = {
  requestPermissions: async (): Promise<boolean> => {
    // Mocking permission requests
    console.log("Requesting Android permissions...");
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  },

  handleCall: (action: 'answer' | 'end', addLog: (log: LogEntry) => void) => {
    addLog({
      id: Math.random().toString(),
      type: 'action',
      message: `Native Call Action: ${action.toUpperCase()}`,
      timestamp: new Date()
    });
    // Implementation would use a Capacitor plugin for Telephony
  },

  openWhatsApp: (phoneNumber: string, addLog: (log: LogEntry) => void) => {
    const url = `whatsapp://send?phone=${phoneNumber}`;
    addLog({
      id: Math.random().toString(),
      type: 'action',
      message: `Opening WhatsApp: ${phoneNumber}`,
      timestamp: new Date()
    });
    window.open(url, '_blank');
  },

  toggleForegroundService: (active: boolean, addLog: (log: LogEntry) => void) => {
    addLog({
      id: Math.random().toString(),
      type: 'system',
      message: `Foreground Service: ${active ? 'ENABLED' : 'DISABLED'}`,
      timestamp: new Date()
    });
  }
};
