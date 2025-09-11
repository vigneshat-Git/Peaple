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
    // Do NOT auto-enqueue on connect. Wait for explicit 'ready' from client
    ws.on('message', message => {
        // Log all messages for debugging
        try {
            const asString = typeof message === 'string' ? message : (Buffer.isBuffer(message) ? message.toString('utf8') : String(message));
            let msgObj;
            try {
                msgObj = JSON.parse(asString);
            } catch (e) {
                console.warn('WS non-JSON message:', asString);
                msgObj = null;
            }
            console.log('WS message:', msgObj || asString);
            // If client explicitly signals readiness, enqueue for matchmaking
            if (msgObj && msgObj.type === 'ready') {
                console.log('READY received. queuedBefore?', waitingQueue.includes(ws), 'paired?', !!ws.pairedWith);
                if (!ws.pairedWith && !waitingQueue.includes(ws)) {
                    waitingQueue.push(ws);
                    console.log('Queue length:', waitingQueue.length);
                    matchUsers();
                }
                return; // Do not forward 'ready' to peers
            }
        } catch (err) { console.log('WS message (raw):', message); }
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
    console.log('matchUsers() called. Queue length:', waitingQueue.length);
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
            user = new User({ username, email, password, avatarUrl, peas: 50 });
            await user.save();
        }
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get peas balance for a user by email
app.get('/api/peas/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ peas: user.peas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add or subtract peas for a user by email
app.post('/api/peas/update', async (req, res) => {
    try {
        const { email, amount } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.peas = (user.peas || 0) + Number(amount);
        await user.save();
        res.json({ peas: user.peas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Store call data
app.post('/api/call', async (req, res) => {
    try {
        const { userId, peerId, callTime, duration, details } = req.body;
        console.log('[SERVER DEBUG] /api/call called:', { userId, peerId, callTime });
        
        // Deduct 5 peas from both users (user1 -5, user2 -5, total 10 peas per call)
        // This should only be called once per call by the offer role user
        const user1 = await User.findById(userId);
        const user2 = await User.findById(peerId);
        if (!user1 || !user2) {
            return res.status(400).json({ error: 'Both users must exist' });
        }
        
        console.log('[SERVER DEBUG] Before deduction:', { user1Peas: user1.peas, user2Peas: user2.peas });
        
        // Deduct 5 peas from both users
        user1.peas = Math.max(0, (user1.peas || 0) - 5);
        user2.peas = Math.max(0, (user2.peas || 0) - 5);
        
        console.log('[SERVER DEBUG] After deduction:', { user1Peas: user1.peas, user2Peas: user2.peas });
        await user1.save();
        await user2.save();
        // Save call data for both users
        const callData1 = new CallData({ userId, callTime, duration, details });
        const callData2 = new CallData({ userId: peerId, callTime, duration, details });
        await callData1.save();
        await callData2.save();
        res.status(201).json({ callData1, callData2, user1Peas: user1.peas, user2Peas: user2.peas });
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
// One-time endpoint to grant 50 peas to all users
app.post('/api/grant50peas', async (req, res) => {
    try {
        const result = await User.updateMany(
            {},
            { $set: { peas: 50 } }
        );
        res.json({ message: `Updated ${result.nModified || result.modifiedCount} users to 50 peas.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
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
            // Sample users removed
        ]);

        // Call Data
        const calls = await CallData.insertMany([
            // Sample call data removed
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
