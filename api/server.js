const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use a Set to store unique push tokens to avoid duplicates
let pushTokens = new Set();

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.2.6",
    releaseNotes: "Critical bug fixes and new features like add new background notification added by goJ0",
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.7.apk",
    publishedAt: "2025-08-11T00:00:00Z"
  },
  {
    version: "3.2.5",
    releaseNotes: "Critical bug fixes and new features like add new background notification added by Gojo sat",
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.7.apk",
    publishedAt: "2025-08-10T12:00:00Z"
  },
  {
    version: "3.2.5",
    releaseNotes: "Exciting new features!\\n- Added dark mode support\\n- Improved performance for large lists",
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.6.apk",
    publishedAt: "2025-08-06T12:00:00Z"
  }
];

// Add a root endpoint to prevent 404 errors on the base URL
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Update API!</h1><p>Please use the /api/latest-release or /api/send-push-notification endpoints.</p>');
});

// Endpoint to receive and save the push token from the mobile app
app.post('/api/save-token', (req, res) => {
  const { token } = req.body;
  if (token && typeof token === 'string' && token.startsWith('ExpoPushToken')) {
    // Add the token to the Set to ensure it's unique
    if (!pushTokens.has(token)) {
      pushTokens.add(token);
      console.log('Received and saved push token:', token);
    } else {
      console.log('Push token already exists, skipping:', token);
    }
    res.status(200).json({ success: true, message: 'Push token saved.' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or no push token provided.' });
  }
});

// Endpoint to check for the latest app release
app.get('/api/latest-release', (req, res) => {
  console.log('Request received for /api/latest-release');
  if (releases.length > 0) {
    // We send the latest release object, which is at index 0
    res.status(200).json(releases[0]);
  } else {
    res.status(404).json({ message: 'No releases found.' });
  }
});

// Endpoint to send a push notification to ALL registered tokens
app.post('/api/send-push-notification', async (req, res) => {
  const { type, title, body, downloadUrl, fileName } = req.body;

  if (pushTokens.size === 0) {
    return res.status(400).json({ error: 'No push tokens found. Please open the app on a device to register.' });
  }

  const messages = [];
  pushTokens.forEach(token => {
    let notification;

    // Check if the push token is valid before creating a message
    if (!token || !token.startsWith('ExpoPushToken')) {
      console.warn('Skipping invalid push token:', token);
      return; // Continue to the next token
    }

    // This is a visible push notification that will show up on the phone's notification bar
    if (type === 'visible-background-notification') {
      notification = {
        to: token,
        title: title || 'Hello Users',
        body: body || 'You have received a new message hello.',
        sound: 'default', // Add a sound to make it a visible notification
        data: {
          type: 'visible-background-notification',
        },
      };
      // Log the payload to the console for this specific type
      console.log('Sending a visible background notification:', notification);
    } else if (type === 'background-notification') {
      // This is a silent push to trigger a background task in your mobile app
      notification = {
        to: token,
        data: {
          type: 'background-notification',
          title: title || 'New Background Notification',
          body: body || 'You have received a new background updathe.',
        },
        contentAvailable: true, // Crucial for iOS background tasks
      };
      // Log the payload to the console for this specific type
      console.log('Sending a silent background notification:', notification);
    } else if (type === 'update') {
      // A visible notification for an app update
      notification = {
        to: token,
        title: title || 'New App Update Available!',
        body: body || 'Tap to download and install the latest version.',
        sound: 'default',
        data: {
          type: 'update',
          downloadUrl: downloadUrl || releases[0].downloadUrl,
          fileName: fileName || releases[0].fileName,
        },
      };
      console.log('Sending an update notification:', notification);
    } else { // 'message' or any other type (default)
      notification = {
        to: token,
        title: title || 'New Message',
        body: body || 'You have a new notification.',
        sound: 'default',
        data: {
          type: 'message',
          source: 'vercel-api',
        },
      };
      console.log('Sending a default message notification:', notification);
    }
    messages.push(notification);
  });

  if (messages.length === 0) {
    return res.status(400).json({ error: 'No valid push tokens to send messages to.' });
  }

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const expoReceipt = await expoResponse.json();
    console.log('Expo Push API Response:', expoReceipt);

    if (expoReceipt.data && expoReceipt.data.length > 0) {
      for (const receipt of expoReceipt.data) {
        if (receipt.status === 'error') {
          console.error('Error sending push notification:', receipt.details);
          // Return the first error to the client for debugging
          return res.status(500).json({ error: 'Failed to send push notification via Expo', details: receipt.details });
        }
      }
    }

    res.status(200).json({ success: true, receipt: expoReceipt });

  } catch (error) {
    console.error('Error in /api/send-push-notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
