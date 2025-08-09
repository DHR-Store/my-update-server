// my-update-server/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.2.5",
    releaseNotes: "Exciting new features!\n- Added dark mode support\n- Improved performance for large lists",
    downloadUrl: "https://www.sendspace.com/file/etyk00",
    fileName: "your-app-v1.0.2.apk",
    publishedAt: "2025-08-06T12:00:00Z"
  },
  {
    version: "1.0.1",
    releaseNotes: "Bug fixes and performance improvements.\n- Fixed login issue\n- Improved UI responsiveness",
    downloadUrl: "https://your-vercel-app-domain.vercel.app/downloads/your-app-v1.0.1.apk",
    fileName: "your-app-v1.0.1.apk",
    publishedAt: "2025-08-01T10:00:00Z"
  }
];

// Endpoint to get the latest release information
app.get('/api/latest-release', (req, res) => {
  console.log('Request received for /api/latest-release');
  if (releases.length > 0) {
    res.json(releases[0]);
  } else {
    res.status(404).json({ message: "No releases found." });
  }
});

// New endpoint to send a push notification with an updated hardcoded message
app.post('/api/send-push-notification', async (req, res) => {
  const { pushToken, title } = req.body;

  // Since the message is hardcoded, we only need to check for the pushToken and title.
  if (!pushToken || !title) {
    return res.status(400).json({ error: 'Missing pushToken or title' });
  }

  // Construct the push notification payload for Expo. The message is hardcoded here.
  const notification = {
    to: pushToken,
    title: title,
    body: "Hello app user, how was the day going?", // <-- The updated hardcoded message is placed here
    sound: 'default',
    data: { someData: 'goes here' },
  };

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    const expoReceipt = await expoResponse.json();
    console.log('Expo Push API Response:', expoReceipt);

    if (expoReceipt.data && expoReceipt.data[0] && expoReceipt.data[0].status === 'error') {
      console.error('Error sending push notification:', expoReceipt.data[0].details);
      return res.status(500).json({ error: 'Failed to send push notification via Expo', details: expoReceipt.data[0].details });
    }

    res.status(200).json({ success: true, receipt: expoReceipt });

  } catch (error) {
    console.error('Error in /api/send-push-notification:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Export the app for Vercel
module.exports = app;

