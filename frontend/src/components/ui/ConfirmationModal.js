import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  badgeLabel = 'Confirmation',
  showCancel = true,
  showConfirm = true,
  closeOnOverlay = true,
  children,
  onConfirm,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    // Handle key down interactions.
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle confirm interactions.
  const handleConfirm = () => {
    onConfirm?.();
  };

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-lg';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-lg';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-lg';
    }
  };

  const getBadgeVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 sm:p-8 bg-gray-900/80 backdrop-blur-sm"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className="relative min-w-[320px] max-h-[calc(100vh-4rem)] my-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transform transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <div className="relative max-h-[calc(100vh-4rem)] overflow-y-auto p-7">
          <button
            type="button"
            className="absolute top-5 right-5 inline-flex items-center justify-center w-10 h-10 border-0 rounded-full bg-gray-100/90 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <span className={`inline-flex items-center mb-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getBadgeVariantClasses()}`}>
            {badgeLabel}
          </span>

          <h2 id="confirmation-modal-title" className="m-0 text-gray-900 text-2xl font-bold leading-tight">
            {title}
          </h2>

          {message ? <p className="m-0 text-gray-600 text-sm leading-6">{message}</p> : null}
          {children ? <div className="mt-6">{children}</div> : null}

          <div className="flex justify-end gap-3 mt-7 sm:flex-row sm:justify-end">
            {showCancel && (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                onClick={onClose}
              >
                {cancelLabel}
              </button>
            )}
            {showConfirm && (
              <button
                type="button"
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantClasses()}`}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
