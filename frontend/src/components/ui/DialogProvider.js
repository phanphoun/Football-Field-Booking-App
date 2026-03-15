import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DialogContext = createContext(null);

const DIALOG_STYLES = {
  confirm: {
    icon: ExclamationTriangleIcon,
    iconClassName: 'text-amber-600',
    confirmClassName: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    confirmText: 'OK',
    cancelText: 'Cancel'
  },
  alert: {
    icon: InformationCircleIcon,
    iconClassName: 'text-blue-600',
    confirmClassName: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    confirmText: 'OK',
    cancelText: ''
  }
};

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialogState(null);
  }, []);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        type: 'confirm',
        title: options.title || 'Please Confirm',
        message,
        confirmText: options.confirmText || DIALOG_STYLES.confirm.confirmText,
        cancelText: options.cancelText || DIALOG_STYLES.confirm.cancelText
      });
    });
  }, []);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        type: 'alert',
        title: options.title || 'Notice',
        message,
        confirmText: options.confirmText || DIALOG_STYLES.alert.confirmText
      });
    });
  }, []);

  const contextValue = useMemo(() => ({ confirm, showAlert }), [confirm, showAlert]);
  const config = dialogState ? DIALOG_STYLES[dialogState.type] : null;
  const Icon = config?.icon;

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogState && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => closeDialog(dialogState.type === 'confirm' ? false : true)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                {Icon ? (
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <Icon className={`h-6 w-6 ${config.iconClassName}`} />
                  </span>
                ) : null}
                <div>
                  <h2 id="app-dialog-title" className="text-base font-semibold text-slate-900">
                    {dialogState.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeDialog(dialogState.type === 'confirm' ? false : true)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">{dialogState.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
              {dialogState.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {dialogState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${config.confirmClassName}`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
