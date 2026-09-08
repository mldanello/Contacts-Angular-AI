'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const versionPath = path.join(root, 'version.json');
const serverStartedAtUtc = new Date().toISOString();
const longTtlSeconds = 31536000;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
};

function setNoCache(headers) {
  headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  headers.Pragma = 'no-cache';
  headers.Expires = '0';
}

function setLongCache(headers) {
  headers['Cache-Control'] = `public, max-age=${longTtlSeconds}, immutable`;
}

function setDefaultCache(headers) {
  headers['Cache-Control'] = 'public, max-age=3600';
}

function sendJson(res, statusCode, payload, noCache = false) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (noCache) {
    setNoCache(headers);
  }
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(payload));
}

function sendBuffer(res, statusCode, headers, buffer) {
  res.writeHead(statusCode, headers);
  res.end(buffer);
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function resolveSafePath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname);
  const normalized = path.normalize(decodedPath).replace(/^([\\/])+/, '');
  const fullPath = path.resolve(root, normalized);
  if (!fullPath.startsWith(path.resolve(root))) {
    return null;
  }
  return fullPath;
}

function cacheHeadersForFile(filePath) {
  const headers = {};
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  headers['Content-Type'] = contentTypes[ext] || 'application/octet-stream';

  const isHashedAsset = /-[A-Za-z0-9]{8,}\.(?:js|css|mjs|map|svg|png|jpg|jpeg|gif|webp|woff2?)$/i.test(fileName);
  if (isHashedAsset) {
    setLongCache(headers);
    return headers;
  }

  if (ext === '.html') {
    setNoCache(headers);
    return headers;
  }

  setDefaultCache(headers);
  return headers;
}

function serveFile(res, filePath) {
  const headers = cacheHeadersForFile(filePath);
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      sendText(res, 500, 'Internal server error');
      return;
    }
    sendBuffer(res, 200, headers, data);
  });
}

function serveIndex(res) {
  fs.readFile(indexPath, (readErr, data) => {
    if (readErr) {
      sendText(res, 500, 'index.html not found');
      return;
    }
    const headers = { 'Content-Type': 'text/html; charset=utf-8' };
    setNoCache(headers);
    sendBuffer(res, 200, headers, data);
  });
}

function getVersionInfo() {
  const fallback = {
    appName: 'angular-ai-contacts',
    appVersion: 'unknown',
    buildTimestampUtc: serverStartedAtUtc,
    gitCommit: null,
    serverStartedAtUtc
  };

  if (!fs.existsSync(versionPath)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    return {
      ...fallback,
      ...parsed,
      serverStartedAtUtc
    };
  } catch (error) {
    return {
      ...fallback,
      parseError: 'version.json could not be parsed'
    };
  }
}

if (!fs.existsSync(indexPath)) {
  console.error(`index.html not found at ${indexPath}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = requestUrl.pathname;

  if (pathname === '/__version') {
    sendJson(res, 200, getVersionInfo(), true);
    return;
  }

  if (pathname === '/index.html' || pathname === '/') {
    serveIndex(res);
    return;
  }

  const requestedPath = resolveSafePath(pathname);
  if (!requestedPath) {
    sendText(res, 400, 'Bad request');
    return;
  }

  fs.stat(requestedPath, (statErr, stats) => {
    if (!statErr && stats.isFile()) {
      serveFile(res, requestedPath);
      return;
    }

    serveIndex(res);
  });
});

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => {
  console.log(`SPA server running on port ${port}, serving ${root}`);
});
