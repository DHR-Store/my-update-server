// my-update-server/server.js

// api/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const releases = [
  {
    version: "3.2.5", //latest
    releaseNotes: "Exciting new features!\n- Added dark mode support\n- Improved performance for large lists",
    downloadUrl: "https://your-vercel-domain.vercel.app/downloads/your-app-v1.0.2.apk", // 🔁 Update this after deploy
    fileName: "your-app-v1.0.2.apk",
    publishedAt: "2025-08-06T12:00:00Z"
  },
  {
    version: "1.0.1",
    releaseNotes: "Bug fixes and performance improvements.\n- Fixed login issue\n- Improved UI responsiveness",
    downloadUrl: "https://your-vercel-domain.vercel.app/downloads/your-app-v1.0.1.apk",
    fileName: "your-app-v1.0.1.apk",
    publishedAt: "2025-08-01T10:00:00Z"
  },
  {
    version: "1.0.0",
    releaseNotes: "Initial release.",
    downloadUrl: "https://your-vercel-domain.vercel.app/downloads/your-app-v1.0.0.apk",
    fileName: "your-app-v1.0.0.apk",
    publishedAt: "2025-07-20T09:00:00Z"
  }
];

// API Route
app.get('/api/latest-release', (req, res) => {
  res.json(releases[0]);
});

// 🔁 No app.listen() for Vercel
module.exports = app;
