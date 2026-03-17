import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800'
};

const TOAST_PROGRESS_STYLES = {
  success: 'bg-emerald-500/75',
  error: 'bg-red-500/75',
  info: 'bg-slate-500/60'
};

const ToastItem = ({ toast, onClose }) => {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, toast.expiresAt - Date.now()));

  useEffect(() => {
    const updateRemaining = () => {
      setRemainingMs(Math.max(0, toast.expiresAt - Date.now()));
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 100);
    return () => window.clearInterval(intervalId);
  }, [toast.expiresAt]);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressWidth = toast.duration > 0 ? `${Math.max(0, (remainingMs / toast.duration) * 100)}%` : '0%';

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-[22px] border px-4 py-3 shadow-lg backdrop-blur ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
          <p className="text-sm">{toast.message}</p>
          <p className="mt-2 text-[11px] font-medium opacity-70">Closing in {remainingSeconds}s</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="shrink-0 text-xs font-semibold opacity-70 transition hover:opacity-100"
        >
          Close
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full transition-[width] duration-100 linear ${TOAST_PROGRESS_STYLES[toast.type] || TOAST_PROGRESS_STYLES.info}`}
          style={{ width: progressWidth }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      if (!message) return null;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const nextToast = {
        id,
        type: options.type || 'success',
        title: options.title || '',
        message,
        duration: Number.isFinite(options.duration) ? options.duration : 3200
      };

      nextToast.expiresAt = Date.now() + nextToast.duration;

      setToasts((current) => [...current, nextToast]);

      const timeoutId = window.setTimeout(() => {
        removeToast(id);
      }, nextToast.duration);

      timeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [removeToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess: (message, options = {}) => showToast(message, { ...options, type: 'success' }),
      showError: (message, options = {}) => showToast(message, { ...options, type: 'error' }),
      removeToast
    }),
    [removeToast, showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1600] flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
