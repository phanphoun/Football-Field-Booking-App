const { createProxyMiddleware } = require('http-proxy-middleware');

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:5000';

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_PROXY_TARGET,
      changeOrigin: true
    })
  );
};
