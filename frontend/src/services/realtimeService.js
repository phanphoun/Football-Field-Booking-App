import authService from './authService';

// Build ws url for rendering.
const buildWsUrl = () => {
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  const wsBase = origin.startsWith('https://')
    ? origin.replace('https://', 'wss://')
    : origin.replace('http://', 'ws://');
  return `${wsBase}/ws`;
};

const realtimeService = {
  connect: ({ onMessage, onOpen, onError, onClose } = {}) => {
    const token = authService.getToken();
    if (!token) return null;

    const socket = new WebSocket(`${buildWsUrl()}?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      if (onOpen) onOpen();
    };

    socket.onerror = (event) => {
      if (onError) onError(event);
    };

    socket.onclose = (event) => {
      if (onClose) onClose(event);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (onMessage) onMessage(message);
      } catch (_) {}
    };

    return socket;
  }
};

export default realtimeService;
