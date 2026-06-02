import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X, Copy, Check, Info, AlertTriangle } from 'lucide-react';
import { AppToast } from '../types';

interface ToastContainerProps {
  toasts: AppToast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 w-full max-w-sm sm:max-w-md pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: AppToast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const duration = toast.duration || 6000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Progress bar decrement
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    // Auto-dismiss timeout
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!toast.referenceNumber) return;
    navigator.clipboard.writeText(toast.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Icon selector based on type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-400 shrink-0" />;
    }
  };

  // Styled color configuration matching Alpha design system
  const getCardStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-[#0a0f0d]/95 text-emerald-300 shadow-[0_8px_32px_rgba(16,185,129,0.1),_inset_0_1px_0_rgba(16,185,129,0.15)]';
      case 'warning':
        return 'border-amber-500/30 bg-[#14110b]/95 text-amber-300 shadow-[0_8px_32px_rgba(245,158,11,0.05),_inset_0_1px_0_rgba(245,158,11,0.1)]';
      case 'error':
        return 'border-red-500/30 bg-[#160a0a]/95 text-red-200 shadow-[0_8px_32px_rgba(239,68,68,0.05),_inset_0_1px_0_rgba(239,68,68,0.1)]';
      default:
        return 'border-blue-500/30 bg-[#0c0f16]/95 text-blue-300 shadow-[0_8px_32px_rgba(59,130,246,0.05)]';
    }
  };

  const getProgressStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, y: 0, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, rotation: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      className={`pointer-events-auto w-full p-4.5 rounded-xl border flex flex-col gap-3 backdrop-blur-md relative overflow-hidden group select-none ${getCardStyle()}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex flex-col gap-1 text-left">
            <span className="font-sans font-bold text-white text-xs leading-snug">
              {toast.title}
            </span>
            <p className="font-sans text-[11px] text-white/70 leading-relaxed font-medium">
              {toast.message}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {toast.referenceNumber && (
        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-0.5 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 px-2 py-1 rounded">
            <span className="text-white/40 font-black tracking-wider text-[9px]">REF:</span>
            <span className="font-bold text-white font-mono select-all truncate max-w-[150px] sm:max-w-[200px]">
              {toast.referenceNumber}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-all font-sans font-bold cursor-pointer select-none active:scale-95 ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 shrink-0" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 shrink-0" />
                <span>Copy Ref</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Underlay progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${getProgressStyle()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
