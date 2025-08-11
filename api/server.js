const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use a Set to store unique push tokens to avoid duplicates
let pushTokens = new Set();

// Hardcoded release data for demonstration purposes.
// This should be the same as your app's releases.
const releases = [
  {
    version: "3.2.6",
    releaseNotes: "Critical bug fixes and new features like add new background notification added by zenda-x",
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
  if (token) {
    // Add the token to the Set to ensure it's unique
    if (!pushTokens.has(token)) {
      pushTokens.add(token);
      console.log('Received and saved push token:', token);
    } else {
      console.log('Push token already exists, skipping:', token);
    }
    res.status(200).json({ success: true, message: 'Push token saved.' });
  } else {
    res.status(400).json({ success: false, message: 'No push token provided.' });
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
    if (!token) {
      console.warn('Skipping invalid push token:', token);
      return; // Continue to the next token
    }

    if (type === 'silent-update') {
      // This is a data-only payload that won't show a visible notification.
      // It triggers a background task in the app.
      notification = {
        to: token,
        // No title, body, or sound fields for a silent notification
        data: {
          type: 'silent-update',
          downloadUrl: downloadUrl || releases[0].downloadUrl,
          fileName: fileName || releases[0].fileName,
        },
        // contentAvailable is crucial for iOS background tasks
        contentAvailable: true,
      };
    } else if (type === 'background-message') {
      // This is a data-only payload to trigger a background task with a message.
      notification = {
        to: token,
        data: {
          type: 'background-message',
          message: body || 'You have a new background message.',
        },
        contentAvailable: true,
      };
    } else if (type === 'background-notification') {
        // This is a new type for background notifications.
        // This is a silent push notification; it will not show a visible notification on its own.
        // It's meant to trigger the TaskManager task in your mobile app, which then shows a local notification.
        notification = {
          to: token,
          data: {
            type: 'background-notification',
            title: title || 'New Background Notification',
            body: body || 'You have received a new notification.',
          },
          contentAvailable: true,
        };
    } else if (type === 'visible-background-notification') {
      // This is a new type for a standard, visible push notification.
      // This will show up on the user's phone even when the app is closed.
      notification = {
        to: token,
        title: title || 'Hello Users',
        body: body || 'You have received a new message.',
        sound: 'default',
        data: {
          type: 'visible-background-notification',
        },
      };
    } else if (type === 'update') {
      // This is a visible, foreground notification for an update.
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
    } else { // 'message' or any other type (default)
      // This is a visible notification for a generic message.
      notification = {
        to: token,
        title: title || 'New Message',
        body: body || 'You have a new notification.',
        sound: 'default',
        data: {
          type: 'message',
          source: 'vercel-api',
          message: 'This is a regular message.',
        },
      };
    }
    messages.push(notification);
  });

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

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
