'use client';


// components/AdminAlert.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, AlertCircle, Info, 
  X, Terminal, ChevronDown, ChevronUp 
} from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertLog {
  timestamp: string;
  message: string;
  data?: any;
}

interface AdminAlertProps {
  type: AlertType;
  title: string;
  message: string;
  logs?: AlertLog[];
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function AdminAlert({
  type,
  title,
  message,
  logs = [],
  onClose,
  autoClose = true,
  duration = 5000
}: AdminAlertProps) {
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />
  };

  const colors = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  const pulseColors = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`${colors[type]} text-white rounded-lg shadow-2xl border-2 overflow-hidden`}
      style={{ minWidth: '400px' }}
    >
      {/* Pulse animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 ${pulseColors[type]} opacity-30 animate-pulse`} />
      </div>

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 animate-bounce">
            {icons[type]}
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-white/90">{message}</p>
            
            {logs.length > 0 && (
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="mt-2 flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>View Logs ({logs.length})</span>
                {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs section */}
        <AnimatePresence>
          {showLogs && logs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-white/20"
            >
              <div className="bg-black/20 rounded p-2 max-h-48 overflow-y-auto">
                <div className="font-mono text-xs space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-white/80">
                      <span className="text-white/50">[{log.timestamp}]</span> {log.message}
                      {log.data && (
                        <pre className="text-white/60 ml-4 mt-1">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar for auto-close */}
      {autoClose && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="h-1 bg-white/30 origin-left"
        />
      )}
    </motion.div>
  );
}

// Alert Container Component
interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  logs?: AlertLog[];
  autoClose?: boolean;
  duration?: number;
}

export function AdminAlertContainer() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const handleAlert = (event: CustomEvent<Omit<AlertItem, 'id'>>) => {
      const newAlert: AlertItem = {
        ...event.detail,
        id: Date.now().toString()
      };
      setAlerts(prev => [...prev, newAlert]);
    };

    window.addEventListener('admin-alert' as any, handleAlert);
    return () => window.removeEventListener('admin-alert' as any, handleAlert);
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div 
      className="fixed right-4 z-[9999] space-y-3"
      style={{ top: '33vh' }} // Position 1/3 down the page
    >
      <AnimatePresence>
        {alerts.map(alert => (
          <AdminAlert
            key={alert.id}
            {...alert}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper function to show alerts
export function showAdminAlert(
  type: AlertType,
  title: string,
  message: string,
  logs?: AlertLog[],
  autoClose = true,
  duration = 5000
) {
  const event = new CustomEvent('admin-alert', {
    detail: { type, title, message, logs, autoClose, duration }
  });
  window.dispatchEvent(event);
}

// Logging helper
export function createLog(message: string, data?: any): AlertLog {
  return {
    timestamp: new Date().toLocaleTimeString(),
    message,
    data
  };
}