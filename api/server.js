// my-update-server/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Add a root endpoint to prevent 404 errors on the base URL
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Update API!</h1><p>Please use the /api/latest-release or /api/send-fcm-notification endpoints.</p>');
});

// A simple in-memory storage for FCM tokens. In a real app, you would use a database.
const fcmTokens = new Set();

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.2.6",
    releaseNotes: "Exciting new features!\n- Added dark mode support\n- Improved performance for large lists",
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.5.apk",
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
    res.json(releases[0]); // Return the latest release
  } else {
    res.status(404).send('No releases found');
  }
});

// New endpoint to save the FCM token
app.post('/api/save-fcm-token', (req, res) => {
  const { token } = req.body;
  if (token) {
    fcmTokens.add(token);
    console.log('FCM token saved:', token);
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ error: 'Missing token' });
  }
});

// New endpoint to send a push notification via FCM
app.post('/api/send-fcm-notification', async (req, res) => {
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Missing title or body' });
  }
  
  if (fcmTokens.size === 0) {
    return res.status(400).json({ error: 'No FCM tokens registered' });
  }
  
  const serverKey = 'BEj-GCJxhVIPvdGSqUETyFIUIDteVfyS-AWrIN1iXntAXP26LbaStON7Ixt0hMb7dBjRYz2Oe7XSrTKpgaCrBFw'; // REPLACE WITH YOUR ACTUAL SERVER KEY
  const notificationPayload = {
    // This is a data-only message, which is required for the background handler
    data: {
      title: title,
      body: hello,
    },
    // Specify the token to send to. For a real app, you would send to all registered tokens.
    to: [...fcmTokens][0],
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();
    console.log('FCM API Response:', result);

    if (result.success === 1) {
      res.status(200).json({ success: true, message: 'Notification sent successfully.' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send notification via FCM.', details: result.results[0].error });
    }

  } catch (error) {
    console.error('Error sending FCM notification:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
