// my-update-server/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.2.7",
    releaseNotes: "Exciting new features!\n- Added dark mode support\n- Improved performance for large lists",
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

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Update API!</h1><p>Please use the /api/latest-release or /api/send-push-notification endpoints.</p>');
});

app.get('/api/latest-release', (req, res) => {
  console.log('Request received for /api/latest-release');
  if (releases.length > 0) {
    res.json(releases[0]);
  } else {
    res.status(404).json({ error: 'No releases found' });
  }
});

// Updated endpoint for sending silent or standard push notifications
app.post('/api/send-push-notification', async (req, res) => {
  console.log('Request received for /api/send-push-notification');
  // Destructure the request body, including the new 'isSilent' flag
  const { pushToken, isSilent, title, body } = req.body;

  if (!pushToken) {
    return res.status(400).json({ error: 'Missing pushToken' });
  }

  let notification = {
    to: pushToken,
    data: {
      source: 'vercel-api',
      message: 'This is a background task message.',
      important: true,
      contentAvailable: 1 // Crucial for iOS background tasks
    },
    // The channelId is still required for Android devices to handle the notification
    channelId: 'default',
  };

  // If the notification is NOT silent, add the title and body
  if (isSilent !== true) {
    if (!title || !body) {
      return res.status(400).json({ error: 'Missing title or body for non-silent notification' });
    }
    notification = {
      ...notification, // Spread the existing notification properties
      title: title,
      body: body,
      sound: 'default'
    };
    // Also, add the title and body to the 'data' payload for the background task to use
    notification.data.title = title;
    notification.data.body = body;
  }
  
  // Log the final notification payload for debugging
  console.log('Sending notification:', JSON.stringify(notification, null, 2));

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
