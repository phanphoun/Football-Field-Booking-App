import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AuthModalShell = ({
  badgeLabel,
  title,
  description,
  children,
  maxWidth = 460,
  homeLinkState
}) => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 sm:p-8 bg-gray-900/80 backdrop-blur-sm"
    >
      <div
        className="relative min-w-[320px] max-h-[calc(100vh-4rem)] my-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transform transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out"
        style={{
          width: `min(100%, ${maxWidth}px)`,
          display: 'flex',
          flexDirection: 'column'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="relative max-h-[calc(100vh-4rem)] overflow-y-auto p-7">
          <button
            type="button"
            className="absolute top-5 right-5 inline-flex items-center justify-center w-10 h-10 border-0 rounded-full bg-gray-100/90 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/')}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <span className="inline-flex items-center mb-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] bg-emerald-100 text-emerald-700 border-emerald-200">
            {badgeLabel}
          </span>

          <h2 id="auth-modal-title" className="m-0 text-gray-900 text-2xl font-bold leading-tight">
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          )}

          <div className="mt-6">
            {children}
          </div>

          {homeLinkState && (
            <div className="mt-6 text-center">
              <Link
                to="/"
                state={homeLinkState}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModalShell;
