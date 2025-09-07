const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { User, CallData, Profile } = require('./db');

// WebSocket setup (unchanged)
const wss = new WebSocket.Server({ port: 8000 });
const waitingQueue = [];
wss.on('listening', () => {
    console.log('WebSocket server is running on ws://localhost:8000');
});
wss.on('connection', ws => {
    console.log('New client connected');
    waitingQueue.push(ws);
    matchUsers();
    ws.on('message', message => {
        // Log all messages for debugging
        try {
            const msgObj = typeof message === 'string' ? JSON.parse(message) : message;
            console.log('WS message:', msgObj);
        } catch { console.log('WS message:', message); }
        // Always forward any message to the paired peer
        if (ws.pairedWith && ws.pairedWith.readyState === WebSocket.OPEN) {
            ws.pairedWith.send(message);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
        const index = waitingQueue.indexOf(ws);
        if (index !== -1) waitingQueue.splice(index, 1);
        if (ws.pairedWith && ws.pairedWith.readyState === WebSocket.OPEN) {
            ws.pairedWith.send(JSON.stringify({ type: "disconnected" }));
            ws.pairedWith.pairedWith = null;
        }
    });
});
function matchUsers() {
    while (waitingQueue.length >= 2) {
        const ws1 = waitingQueue.shift();
        const ws2 = waitingQueue.shift();
        ws1.pairedWith = ws2;
        ws2.pairedWith = ws1;
        ws1.send(JSON.stringify({ type: "matched", role: "offer" }));
        ws2.send(JSON.stringify({ type: "matched", role: "answer" }));
        console.log(`Matched users: ${ws1._socket.remoteAddress} ⇄ ${ws2._socket.remoteAddress}`);
    }
}
wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
});

// Express REST API for MongoDB
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, avatarUrl } = req.body;
        // Upsert: if user exists, update avatarUrl if provided, else create
        let user = await User.findOne({ email });
        if (user) {
            if (avatarUrl) user.avatarUrl = avatarUrl;
            await user.save();
        } else {
            user = new User({ username, email, password, avatarUrl });
            await user.save();
        }
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Store call data
app.post('/api/call', async (req, res) => {
    try {
        const { userId, callTime, duration, details } = req.body;
        const callData = new CallData({ userId, callTime, duration, details });
        await callData.save();
        res.status(201).json(callData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Store profile data
app.post('/api/profile', async (req, res) => {
    try {
        const { userId, bio, avatarUrl, otherInfo } = req.body;
        const profile = new Profile({ userId, bio, avatarUrl, otherInfo });
        await profile.save();
        res.status(201).json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all call data
app.get('/api/calls', async (req, res) => {
    try {
        const calls = await CallData.find();
        res.json(calls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await Profile.find();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TEMP: Insert test data endpoint (must come after app and middleware are initialized)
app.post('/api/seed-test-data', async (req, res) => {
    try {
        // Users
        const users = await User.insertMany([
            { username: 'Alice', email: 'alice@example.com', password: 'pass1' },
            { username: 'Bob', email: 'bob@example.com', password: 'pass2' },
            { username: 'Charlie', email: 'charlie@example.com', password: 'pass3' }
        ]);

        // Call Data
        const calls = await CallData.insertMany([
            { userId: users[0]._id, callTime: new Date(), duration: 120, details: 'Call with Bob' },
            { userId: users[1]._id, callTime: new Date(), duration: 90, details: 'Call with Alice' }
        ]);

        // Profiles
        const profiles = await Profile.insertMany([
            { userId: users[0]._id, bio: 'Developer', avatarUrl: '', otherInfo: 'Loves coding' },
            { userId: users[1]._id, bio: 'Designer', avatarUrl: '', otherInfo: 'UI/UX expert' }
        ]);

        res.json({ users, calls, profiles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Express server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`REST API server running on http://localhost:${PORT}`);
});
