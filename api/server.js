// my-update-server/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Add a root endpoint to prevent 404 errors on the base URL
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Update API!</h1><p>Please use the /api/latest-release or /api/send-push-notification endpoints.</p>');
});

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.2.6",
    releaseNotes: "Exciting new features!\\n- Added dark mode support\\n- Improved performance for large lists",
    // The downloadUrl is now set to your webpage link to open the page on update click.
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.5.apk",
    publishedAt: "2025-08-06T12:00:00Z"
  },
  {
    version: "1.0.1",
    releaseNotes: "Bug fixes and performance improvements.\\n- Fixed login issue\\n- Improved UI responsiveness",
    downloadUrl: "https://your-vercel-app-domain.vercel.app/downloads/your-app-v1.0.1.apk",
    fileName: "your-app-v1.0.1.apk",
    publishedAt: "2025-08-01T10:00:00Z"
  }
];

// Endpoint to get the latest release information
app.get('/api/latest-release', (req, res) => {
  console.log('Request received for /api/latest-release');
  if (releases.length > 0) {
    res.json(releases[0]); // Return the latest release (first item in the array)
  } else {
    res.status(404).json({ error: 'No releases found' });
  }
});

// New endpoint for sending push notifications
app.post('/api/send-push-notification', async (req, res) => {
  console.log('Request received for /api/send-push-notification');
  const { pushToken, title, message } = req.body;

  // Since the message is hardcoded, we only need to check for the pushToken and title.
  if (!pushToken || !title || !message) {
    return res.status(400).json({ error: 'Missing pushToken, title, or message' });
  }

  // Construct the push notification payload for Expo.
  // The 'body' is intentionally empty to trigger the background task without a visible notification.
  // The 'data' payload will be passed to your background task handler.
  const notification = {
    to: pushToken,
    title: title,
    body: message, // You can use the message here for a visible notification if desired.
    sound: 'default',
    // Add the channelId to ensure the notification is displayed on Android
    // This channelId must match the one defined in your app's code (e.g., in About.tsx)
    channelId: 'default',
    data: { someData: 'goes here', anotherField: 'hello' },
    contentAvailable: 1, // This is crucial for triggering background tasks
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
