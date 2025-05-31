const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8000 });

wss.on('listening', () => {
    console.log('WebSocket server is running on ws://localhost:8000');
});

wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
        console.log('Received:', message);
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Catch WebSocket server errors
wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
});
