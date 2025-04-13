const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');
const crypto = require('crypto');

// Create Express app
const app = express();
const port = process.env.PORT || 3000; // Render environment uses process.env.PORT

// MongoDB URI for connection (replace with your URI)
const MONGO_URI = 'mongodb://your_mongo_uri_here';

// MongoDB Schema and Model for storing session
const SessionSchema = new mongoose.Schema({
  sessionId: String,
  apiKey: String
});
const Session = mongoose.model('Session', SessionSchema);

// Initialize MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected successfully.');
  initializeClient();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Initialize WhatsApp client
let client;
let clientReady = false;
let apiKey = '';

// Function to initialize the WhatsApp client
const initializeClient = async () => {
  const store = new MongoStore({ mongoose });

  // Fetch stored API key or generate new one
  let sessionData = await Session.findOne({ sessionId: 'whatsapp' });
  if (!sessionData) {
    apiKey = crypto.randomBytes(16).toString('hex');
    await new Session({ sessionId: 'whatsapp', apiKey }).save();
  } else {
    apiKey = sessionData.apiKey;
  }
  console.log('🔑 Current API Key:', apiKey);

  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000 // Sync every 5 minutes
    })
  });

  // Event listener for incoming calls
  client.on('call', async (call) => {
    console.log(`📞 Incoming call from ${call.from}. Rejecting...`);
    try {
      await call.reject();
      console.log(`✅ Call from ${call.from} rejected.`);
    } catch (error) {
      console.error(`❌ Failed to reject call:`, error);
    }
  });

  // Event listener when client is ready
  client.on('ready', () => {
    console.log('🎉 WhatsApp client is ready!');
    clientReady = true;
  });

  // Event listener for client disconnection
  client.on('disconnected', () => {
    console.log('❌ WhatsApp client disconnected. Reinitializing...');
    clientReady = false;
    setTimeout(() => {
      initializeClient(); // Reinitialize client
    }, 5000);
  });

  // Initialize the WhatsApp client
  client.initialize();
};

// Express route to verify server status
app.get('/', (req, res) => {
  res.send('✅ Server is running and ready to reject calls!');
});

// Start server and bind to the provided port
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
