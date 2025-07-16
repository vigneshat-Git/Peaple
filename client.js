const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const signalingServer = new WebSocket('wss://5d3c47adf6f9.ngrok-free.app');

let peerConnection;
let dataChannel;

// Step 1: Get user media (camera and microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;

        // Step 2: Create RTCPeerConnection
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Add local stream to peer connection
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // Step 3: Handle remote stream
        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };

        // Step 4: Handle ICE candidates
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
            }
        };

        // Step 5: Create data channel for text communication
        dataChannel = peerConnection.createDataChannel('chat');
        dataChannel.onopen = () => {
            console.log('Data channel is open and ready to send messages');
        };
        dataChannel.onmessage = event => {
            console.log('Message received:', event.data);
            appendMessage(event.data, 'received');
        };
        dataChannel.onclose = () => {
            console.log('Data channel closed');
        };
        dataChannel.onerror = error => {
            console.error('Data channel error:', error);
        };

        // Step 6: Handle signaling messages
        signalingServer.onmessage = async (message) => {
            let data;
            if (message.data instanceof Blob) {
                data = await message.data.text();
            } else {
                data = message.data;
            }

            try {
                const parsedData = JSON.parse(data);
                if (parsedData.type === 'offer') {
                    handleOffer(parsedData.offer);
                } else if (parsedData.type === 'answer') {
                    handleAnswer(parsedData.answer);
                } else if (parsedData.type === 'candidate') {
                    handleCandidate(parsedData.candidate);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        };

        // Step 7: Handle incoming data channel on the remote peer
        peerConnection.ondatachannel = event => {
            const remoteDataChannel = event.channel;
            remoteDataChannel.onmessage = event => {
                console.log('Message received:', event.data);
                appendMessage(event.data, 'received');
            };
            remoteDataChannel.onopen = () => {
                console.log('Remote data channel is open');
            };
        };

        // Step 8: Send text messages
        sendButton.onclick = () => {
            if (dataChannel.readyState === 'open') {
                const message = messageInput.value;
                dataChannel.send(message);
                appendMessage(message, 'sent');
                messageInput.value = '';
            } else {
                console.error('Data channel is not open. Current state:', dataChannel.readyState);
            }
        };
    })
    .catch(error => console.error('Error accessing media devices:', error));

// Handle incoming offer
function handleOffer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            signalingServer.send(JSON.stringify({ type: 'answer', answer: peerConnection.localDescription }));
        });
}

// Handle incoming answer
function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle incoming ICE candidate
function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Create an offer and send it
function createOffer() {
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            signalingServer.send(JSON.stringify({
                type: 'offer',
                offer: peerConnection.localDescription
            }));
        });
}

// Start button click triggers offer creation
document.getElementById('startButton').addEventListener('click', () => {
    createOffer();
});

// Append chat message to container
function appendMessage(text, type) {
    const container = document.getElementById('messagesContainer');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
