// my-update-server/server.js

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Add a root endpoint to prevent 404 errors on the base URL
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Update API!</h1><p>Please use the /api/latest-release, /api/send-push-notification, or /api/send-text-notification endpoints.</p>');
});

// Hardcoded release data for demonstration purposes.
const releases = [
  {
    version: "3.3.9",
    releaseNotes: "sorry for ping\n Watch Together added\n + E2PP chat feature added\n -tap auto forward added\n -😁😁💖Thanks🤞🤞",
    // The downloadUrl is now set to your webpage link to open the page on update click.
    downloadUrl: "https://dhr-store.vercel.app/app2.html",
    fileName: "your-app-v3.2.5.apk",
    publishedAt: "2025-08-06T12:00:00Z"
  },
  {
    version: "3.3.8",
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
    res.status(404).json({ error: 'No releases found' });
  }
});


// Endpoint to send a visible push notification (your original code)
app.post('/api/send-push-notification', async (req, res) => {
  const { pushToken, title } = req.body;

  if (!pushToken || !title) {
    return res.status(400).json({ error: 'Missing pushToken or title' });
  }

  const notification = {
    to: pushToken,
    title: title,
    body: "Hello app user, how was the day going..hkk",
    sound: 'default',
    channelId: 'default',
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
    console.error('Error in /api/send-push-notification endpoint:', error);
    res.status(500).json({ error: 'An unexpected error occurred while sending the notification.' });
  }
});

// NEW ENDPOINT to send a background text-only notification
// This will be handled by the client-side TaskManager without showing a visible alert immediately.
app.post('/api/send-text-notification', async (req, res) => {
  const { pushToken, title, message } = req.body;

  if (!pushToken || !title || !message) {
    return res.status(400).json({ error: 'Missing pushToken, title, or message' });
  }

  // The key here is that the payload only contains a `data` field, and no `notification` field.
  const payload = {
    to: pushToken,
    data: {
      type: 'message', // This type is used by the client-side background task to identify the payload
      title: title,
      message: message,
    },
    // We explicitly don't include a `notification` field to make it a data-only message
  };

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const expoReceipt = await expoResponse.json();
    console.log('Expo Push API Response:', expoReceipt);

    if (expoReceipt.data && expoReceipt.data[0] && expoReceipt.data[0].status === 'error') {
      console.error('Error sending text notification:', expoReceipt.data[0].details);
      return res.status(500).json({ error: 'Failed to send text notification via Expo', details: expoReceipt.data[0].details });
    }

    res.status(200).json({ success: true, receipt: expoReceipt });

  } catch (error) {
    console.error('Error in /api/send-text-notification endpoint:', error);
    res.status(500).json({ error: 'An unexpected error occurred while sending the text notification.' });
  }
});

// NEW ENDPOINT for sending a general, visible notification without an update
app.post('/api/send-general-notification', async (req, res) => {
  const { pushToken, title, message } = req.body;

  if (!pushToken || !title || !message) {
    return res.status(400).json({ error: 'Missing pushToken, title, or message' });
  }

  // This payload is a standard visible push notification
  const payload = {
    to: pushToken,
    title: title,
    body: message,
    sound: 'default',
    channelId: 'default',
    data: {
      type: 'general', // A general type for your client-side handler
      title: title,
      message: message,
    },
  };

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const expoReceipt = await expoResponse.json();
    console.log('Expo Push API Response:', expoReceipt);

    if (expoReceipt.data && expoReceipt.data[0] && expoReceipt.data[0].status === 'error') {
      console.error('Error sending general notification:', expoReceipt.data[0].details);
      return res.status(500).json({ error: 'Failed to send general notification via Expo', details: expoReceipt.data[0].details });
    }

    res.status(200).json({ success: true, receipt: expoReceipt });

  } catch (error) {
    console.error('Error in /api/send-general-notification endpoint:', error);
    res.status(500).json({ error: 'An unexpected error occurred while sending the general notification.' });
  }
});

// NEW ENDPOINT to send a one-time provider notification
app.post('/api/notify-new-provider', async (req, res) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({ error: 'Missing pushToken' });
  }

  const payload = {
    to: pushToken,
    title: "New Provider Added!",
    body: "We've added a new provider: HDmovies2. Enjoy new content!",
    sound: 'default',
    channelId: 'default',
    data: {
      type: 'provider_update',
      title: "New Provider Added!",
      message: "We've added a new provider: HDmovies2. Enjoy new content!",
      provider: "HDmovies2"
    },
  };

  try {
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const expoReceipt = await expoResponse.json();
    console.log('Expo Push API Response:', expoReceipt);

    if (expoReceipt.data && expoReceipt.data[0] && expoReceipt.data[0].status === 'error') {
      console.error('Error sending provider notification:', expoReceipt.data[0].details);
      return res.status(500).json({ error: 'Failed to send provider notification via Expo', details: expoReceipt.data[0].details });
    }

    res.status(200).json({ success: true, receipt: expoReceipt });

  } catch (error) {
    console.error('Error in /api/notify-new-provider endpoint:', error);
    res.status(500).json({ error: 'An unexpected error occurred while sending the provider notification.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
