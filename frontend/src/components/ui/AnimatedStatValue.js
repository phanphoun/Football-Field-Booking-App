import React, { useEffect, useState } from 'react';

const formatNumber = (value) => Math.round(Number(value || 0)).toLocaleString();

const formatCurrency = (value, currency = 'USD') => {
  const amount = Number(value || 0);
  return amount.toLocaleString(undefined, { style: 'currency', currency });
};

const AnimatedStatValue = ({ value, type = 'number', currency = 'USD', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    let frameId;
    let startTime;
    const duration = 900;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(target * easedProgress);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(step);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  const formattedValue = type === 'currency' ? formatCurrency(displayValue, currency) : formatNumber(displayValue);

  return <div className={className}>{formattedValue}</div>;
};

export default AnimatedStatValue;
