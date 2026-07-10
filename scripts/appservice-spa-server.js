'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const versionPath = path.join(root, 'version.json');
const serverStartedAtUtc = new Date().toISOString();
const longTtlSeconds = 31536000;

function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function setLongCache(res) {
  res.setHeader('Cache-Control', `public, max-age=${longTtlSeconds}, immutable`);
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

app.get('/__version', (req, res) => {
  setNoCache(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json(getVersionInfo());
});

app.get('/index.html', (req, res) => {
  setNoCache(res);
  res.sendFile(indexPath);
});

app.use(express.static(root, {
  etag: true,
  setHeaders: (res, filePath) => {
    const fileName = path.basename(filePath);
    const isHashedAsset = /-[A-Za-z0-9]{8,}\.(?:js|css|mjs|map|svg|png|jpg|jpeg|gif|webp|woff2?)$/i.test(fileName);
    if (isHashedAsset) {
      setLongCache(res);
      return;
    }

    if (/\.(?:html)$/i.test(fileName)) {
      setNoCache(res);
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

app.get('*', (req, res) => {
  setNoCache(res);
  res.sendFile(indexPath);
});

if (!fs.existsSync(indexPath)) {
  console.error(`index.html not found at ${indexPath}`);
  process.exit(1);
}

const port = Number(process.env.PORT || 8080);
app.listen(port, '0.0.0.0', () => {
  console.log(`SPA server running on port ${port}, serving ${root}`);
});
