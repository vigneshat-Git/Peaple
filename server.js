const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8000 });

const waitingQueue = [];

wss.on('listening', () => {
    console.log('✅ WebSocket server is running on ws://localhost:8000');
});

wss.on('connection', ws => {
    console.log('👤 New client connected');

    // Add user to the matchmaking queue
    waitingQueue.push(ws);
    matchUsers();

    // Handle incoming signaling messages
    ws.on('message', message => {
        // Forward signaling data only to the matched peer
        if (ws.pairedWith && ws.pairedWith.readyState === WebSocket.OPEN) {
            ws.pairedWith.send(message);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log('❌ Client disconnected');

        // Remove from queue if still waiting
        const index = waitingQueue.indexOf(ws);
        if (index !== -1) waitingQueue.splice(index, 1);

        // Notify and disconnect the paired user if exists
        if (ws.pairedWith && ws.pairedWith.readyState === WebSocket.OPEN) {
            ws.pairedWith.send(JSON.stringify({ type: "disconnected" }));
            ws.pairedWith.pairedWith = null;
        }
    });
});

// Match two users and assign offer/answer roles
function matchUsers() {
    while (waitingQueue.length >= 2) {
        const ws1 = waitingQueue.shift();
        const ws2 = waitingQueue.shift();

        ws1.pairedWith = ws2;
        ws2.pairedWith = ws1;

        // Assign roles: ws1 is offerer, ws2 is answerer
        ws1.send(JSON.stringify({ type: "matched", role: "offer" }));
        ws2.send(JSON.stringify({ type: "matched", role: "answer" }));

        console.log(`✅ Matched users: ${ws1._socket.remoteAddress} ⇄ ${ws2._socket.remoteAddress}`);
    }
}

// Optional: handle errors
wss.on('error', (error) => {
    console.error('💥 WebSocket Server Error:', error);
});
                    