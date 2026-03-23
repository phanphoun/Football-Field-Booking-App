import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Sign-In is only available in the browser.'));
      return;
    }

    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In.')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Sign-In.'));
    document.head.appendChild(script);
  });

const GoogleAuthButton = ({ onCredential, onError, disabled = false, text = 'continue_with' }) => {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      if (!GOOGLE_CLIENT_ID) {
        setLoadError('Google sign-in is not configured yet.');
      }
      return;
    }

    let active = true;

    loadGoogleScript()
      .then((google) => {
        if (!active || !google?.accounts?.id || !buttonRef.current || initializedRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredential?.(response.credential);
              return;
            }
            onError?.('Google sign-in did not return a credential.');
          }
        });

        buttonRef.current.innerHTML = '';
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: Math.min(buttonRef.current.offsetWidth || 320, 360)
        });

        initializedRef.current = true;
        setReady(true);
      })
      .catch((error) => {
        if (!active) return;
        const message = error?.message || 'Failed to load Google sign-in.';
        setLoadError(message);
        onError?.(message);
      });

    return () => {
      active = false;
    };
  }, [onCredential, onError, text]);

  if (loadError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {loadError}
      </div>
    );
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={buttonRef} className="flex min-h-[44px] justify-center" />
      {!ready ? <div className="mt-2 text-center text-xs text-slate-500">Loading Google sign-in...</div> : null}
    </div>
  );
};

export default GoogleAuthButton;
