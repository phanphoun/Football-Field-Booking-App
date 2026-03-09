const jwt = require('jsonwebtoken');

let WebSocketServer = null;

const getWebSocketServerClass = () => {
  if (WebSocketServer) return WebSocketServer;

  try {
    ({ WebSocketServer } = require('ws'));
    return WebSocketServer;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[ws] ws package is not installed, realtime notifications are disabled');
    }
    return null;
  }
};

let webSocketServer = null;
const userConnections = new Map();

const addUserConnection = (userId, socket) => {
  const key = String(userId);
  const existing = userConnections.get(key) || new Set();
  existing.add(socket);
  userConnections.set(key, existing);
};

const removeUserConnection = (userId, socket) => {
  const key = String(userId);
  const existing = userConnections.get(key);
  if (!existing) return;
  existing.delete(socket);
  if (existing.size === 0) userConnections.delete(key);
};

const sendEvent = (socket, event, payload) => {
  if (!socket || socket.readyState !== socket.OPEN) return;
  socket.send(
    JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString()
    })
  );
};

const emitToUser = (userId, event, payload) => {
  const sockets = userConnections.get(String(userId));
  if (!sockets || sockets.size === 0) return 0;

  let delivered = 0;
  sockets.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      sendEvent(socket, event, payload);
      delivered += 1;
    }
  });
  return delivered;
};

const emitToAll = (event, payload) => {
  if (!webSocketServer) return 0;
  let delivered = 0;
  webSocketServer.clients.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      sendEvent(socket, event, payload);
      delivered += 1;
    }
  });
  return delivered;
};

const resolveTokenFromRequest = (request) => {
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/', `http://${host}`);
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  return null;
};

const initializeWebSocketServer = (httpServer) => {
  if (webSocketServer) return webSocketServer;

  const ResolvedWebSocketServer = getWebSocketServerClass();
  if (!ResolvedWebSocketServer) return null;

  webSocketServer = new ResolvedWebSocketServer({
    server: httpServer,
    path: '/ws'
  });

  webSocketServer.on('connection', (socket, request) => {
    const token = resolveTokenFromRequest(request);
    if (!token) {
      socket.close(1008, 'Missing auth token');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.id;
      if (!userId) {
        socket.close(1008, 'Invalid token payload');
        return;
      }

      socket.userId = userId;
      socket.isAlive = true;
      addUserConnection(userId, socket);
      sendEvent(socket, 'ws:connected', { userId });

      socket.on('pong', () => {
        socket.isAlive = true;
      });

      socket.on('message', (data) => {
        try {
          const message = JSON.parse(String(data));
          if (message?.type === 'ping') {
            sendEvent(socket, 'ws:pong', { ok: true });
          }
        } catch (_) {}
      });

      socket.on('close', () => {
        removeUserConnection(userId, socket);
      });
    } catch (_) {
      socket.close(1008, 'Unauthorized');
    }
  });

  const heartbeat = setInterval(() => {
    if (!webSocketServer) return;
    webSocketServer.clients.forEach((socket) => {
      if (!socket.isAlive) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  webSocketServer.on('close', () => {
    clearInterval(heartbeat);
    userConnections.clear();
    webSocketServer = null;
  });

  return webSocketServer;
};

module.exports = {
  initializeWebSocketServer,
  emitToUser,
  emitToAll
};
