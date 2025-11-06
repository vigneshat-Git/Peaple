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

// In-memory presence tracking (lightweight)
const presence = new Map(); // id -> lastSeenMs
const PRESENCE_WINDOW_MS = 30 * 1000; // count users seen in the last 30s for more responsiveness
function prunePresence(now = Date.now()) {
    for (const [id, ts] of presence.entries()) {
        if (now - ts > PRESENCE_WINDOW_MS * 3) { // hard prune after 3 windows
            presence.delete(id);
        }
    }
}

// Client heartbeat: POST { id }
app.post('/api/presence/beat', async (req, res) => {
    try {
        const id = (req.body && String(req.body.id || '').trim()) || req.ip;
        const aliases = Array.isArray(req.body && req.body.aliases) ? req.body.aliases : [];
        const now = Date.now();
        presence.set(id, now);
        // Remove any aliases (old IDs for the same person) to avoid double counting
        for (const a of aliases) {
            if (a && presence.has(a)) presence.delete(a);
        }
        prunePresence(now);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Live users count (seen within PRESENCE_WINDOW_MS)
app.get('/api/presence/count', async (req, res) => {
    try {
        const now = Date.now();
        // Build unique sets: dedupe authenticated users by email
        const userEmails = new Set();
        const anonIds = new Set();
        for (const [id, ts] of presence.entries()) {
            if (now - ts > PRESENCE_WINDOW_MS) continue;
            if (String(id).startsWith('user:')) {
                const email = String(id).slice(5).toLowerCase();
                if (email) userEmails.add(email);
            } else {
                anonIds.add(String(id));
            }
        }
        res.json({ count: userEmails.size + anonIds.size });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Optional: explicit leave to drop immediately
app.post('/api/presence/leave', async (req, res) => {
    try {
        const id = (req.body && String(req.body.id || '').trim()) || '';
        if (id) presence.delete(id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Online authenticated users (emails)
app.get('/api/presence/online', async (req, res) => {
    try {
        const now = Date.now();
        const userEmails = new Set();
        for (const [id, ts] of presence.entries()) {
            if (now - ts > PRESENCE_WINDOW_MS) continue;
            if (String(id).startsWith('user:')) {
                const email = String(id).slice(5).toLowerCase();
                if (email) userEmails.add(email);
            }
        }
        res.json({ users: Array.from(userEmails) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Store call data (new schema): single document with emails and duration
app.post('/api/call/log', async (req, res) => {
    try {
        const { user1, user2, dateTime, duration } = req.body;
        if (!user1 || !user2 || !dateTime || typeof duration !== 'number') {
            return res.status(400).json({ error: 'user1, user2, dateTime, and duration are required' });
        }
        // Normalize participant order so both sides map to the same key
        const a = String(user1).trim();
        const b = String(user2).trim();
        const [u1, u2] = a.localeCompare(b) <= 0 ? [a, b] : [b, a];
        const dt = new Date(dateTime);
        // Quantize to 5-second buckets to coalesce slight differences between peers
        const bucketMs = Math.floor(dt.getTime() / 5000) * 5000;
        const keyDt = new Date(bucketMs);

        // Upsert to guarantee exactly one record
        const result = await CallData.updateOne(
            { user1: u1, user2: u2, dateTime: keyDt },
            { $set: { duration } },
            { upsert: true }
        );
        const saved = await CallData.findOne({ user1: u1, user2: u2, dateTime: keyDt });
        try {
            console.log('[CALL LOG][SAVED]', {
                collection: saved && saved.collection && saved.collection.name,
                id: saved && saved._id && String(saved._id),
                user1: saved && saved.user1,
                user2: saved && saved.user2,
                dateTime: saved && saved.dateTime,
                duration: saved && saved.duration,
                upserted: !!(result && result.upsertedId),
                bucketed: keyDt
            });
        } catch {}
        res.status(result && result.upsertedId ? 201 : 200).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upsert profile data by email
app.post('/api/profile', async (req, res) => {
    try {
        const {
            email,
            userId,
            avatarUrl,
            bio,
            profession,
            workplace,
            skills,
            gender,
            dateOfBirth,
            city,
            languages,
            experience,
            linkedin,
            github
        } = req.body || {};

        if (!email) return res.status(400).json({ error: 'email is required' });

        // normalize arrays if provided as comma-separated strings
        const normSkills = Array.isArray(skills)
            ? skills
            : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined);
        const normLangs = Array.isArray(languages)
            ? languages
            : (typeof languages === 'string' ? languages.split(',').map(s => s.trim()).filter(Boolean) : undefined);

        // link to userId if not provided
        let linkedUserId = userId;
        if (!linkedUserId) {
            const u = await User.findOne({ email });
            if (u) linkedUserId = u._id;
        }

        const update = {
            email,
            avatarUrl,
            bio,
            profession,
            workplace,
            gender,
            dateOfBirth,
            city,
            experience,
            linkedin,
            github,
        };
        if (typeof linkedUserId !== 'undefined') update.userId = linkedUserId;
        if (typeof normSkills !== 'undefined') update.skills = normSkills;
        if (typeof normLangs !== 'undefined') update.languages = normLangs;

        const saved = await Profile.findOneAndUpdate(
            { email },
            { $set: update },
            { upsert: true, new: true }
        );

        // Also mirror basic info into User for quick access where UI reads from User
        try {
            await User.updateOne(
                { email },
                {
                    $set: {
                        bio: bio || undefined,
                        profession: profession || undefined,
                        avatarUrl: avatarUrl || undefined,
                    }
                }
            );
        } catch {}

        res.status(200).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get profile by email
app.get('/api/profile', async (req, res) => {
    try {
        const email = String(req.query.email || '').trim();
        if (!email) return res.status(400).json({ error: 'email is required' });
        const profile = await Profile.findOne({ email });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
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
