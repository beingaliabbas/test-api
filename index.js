const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

// ✅ MongoDB URI
const MONGO_URI = 'mongodb://aliabbaszounr4:Aliabbas321@cluster0-shard-00-00.ze5uw.mongodb.net:27017,cluster0-shard-00-01.ze5uw.mongodb.net:27017,cluster0-shard-00-02.ze5uw.mongodb.net:27017/whatsapp_sessions?replicaSet=atlas-bdpqnp-shard-0&ssl=true&authSource=admin';

// ✅ Connect to MongoDB and Initialize WhatsApp
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ MongoDB connected');
    initializeWhatsApp();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

let client;

const initializeWhatsApp = async () => {
    const store = new MongoStore({ mongoose });

    client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
        }),
    });

    client.on('ready', () => {
        console.log('🎉 WhatsApp client is ready!');
    });

    client.on('authenticated', () => {
        console.log('🔐 WhatsApp client authenticated');
    });

    client.on('qr', (qr) => {
        console.log('📷 Scan this QR code to authenticate:\n', qr);
    });

    client.on('call', async (call) => {
        console.log(`📞 Incoming call from ${call.from}. Rejecting...`);
        try {
            await call.reject();
            console.log(`✅ Call from ${call.from} rejected.`);
        } catch (err) {
            console.error(`❌ Failed to reject call:`, err);
        }
    });

    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp client disconnected:', reason);
        client = null;
        setTimeout(() => {
            console.log('♻️ Reinitializing client...');
            initializeWhatsApp();
        }, 5000);
    });

    client.initialize();
};
