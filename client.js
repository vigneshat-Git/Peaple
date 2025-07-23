// UI button references
const muteButton = document.getElementById('muteButton');
const muteIcon = document.getElementById('muteIcon');
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const screenShareButton = document.getElementById('screenShareButton');
const settingsButton = document.getElementById('settingsButton');

let isMuted = false;
let localAudioTrack = null;

function updateCallButtons(isConnected) {
    if (isConnected) {
        startButton.textContent = 'Next';
        endButton.style.display = '';
        startButton.disabled = false;
    } else {
        startButton.textContent = 'Start Call';
        endButton.style.display = 'none';
        startButton.disabled = false;
    }
}

// Mute button logic
muteButton.addEventListener('click', () => {
    if (!localAudioTrack) return;
    isMuted = !isMuted;
    localAudioTrack.enabled = !isMuted;
    muteIcon.className = isMuted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone';
});

// End call button logic
endButton.addEventListener('click', () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
        updateCallButtons(false);
        // Optionally clear chat and reset UI
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) messagesContainer.innerHTML = '';
    }
});

// Screen share button logic (placeholder)
screenShareButton.addEventListener('click', () => {
    alert('Screen sharing feature coming soon!');
});

// Settings button logic (placeholder)
settingsButton.addEventListener('click', () => {
    alert('Settings feature coming soon!');
});
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const signalingServer = new WebSocket('wss://9d9bd7a9c7c8.ngrok-free.app');

let peerConnection;
let dataChannel;

// Step 1: Get user media (camera and microphone) only when Start Call is clicked
let localStream = null;
let isMatched = false;

function setupPeerConnection(stream) {
    localVideo.srcObject = stream;
    // Get local audio track for mute/unmute
    localAudioTrack = stream.getAudioTracks()[0];
    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
        const remoteOverlay = document.getElementById('remoteOverlay');
        if (remoteOverlay) {
            remoteOverlay.style.display = 'none';
        }
        updateCallButtons(true);
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };
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
    signalingServer.onmessage = async (message) => {
        let data;
        if (message.data instanceof Blob) {
            data = await message.data.text();
        } else {
            data = message.data;
        }
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'matched') {
                isMatched = true;
                updateCallButtons(true);
            }
            if (parsedData.type === 'offer') {
                handleOffer(parsedData.offer);
            } else if (parsedData.type === 'answer') {
                handleAnswer(parsedData.answer);
            } else if (parsedData.type === 'candidate') {
                handleCandidate(parsedData.candidate);
            } else if (parsedData.type === 'disconnected') {
                isMatched = false;
                remoteVideo.srcObject = null;
                updateCallButtons(false);
                const remoteOverlay = document.getElementById('remoteOverlay');
                if (remoteOverlay) {
                    remoteOverlay.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };
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
}

document.getElementById('startButton').addEventListener('click', () => {
    const remoteOverlay = document.getElementById('remoteOverlay');
    if (remoteOverlay) {
        remoteOverlay.style.display = 'flex';
        remoteOverlay.style.alignItems = 'center';
        remoteOverlay.style.justifyContent = 'center';
        remoteOverlay.style.position = 'absolute';
        remoteOverlay.style.top = '0';
        remoteOverlay.style.left = '0';
        remoteOverlay.style.width = '100%';
        remoteOverlay.style.height = '100%';
        remoteOverlay.style.color = 'gray';
        remoteOverlay.style.fontSize = '1.2em';
        remoteOverlay.style.zIndex = '2';
        remoteOverlay.style.pointerEvents = 'none';
    }
    // Clear chat history for new call
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    updateCallButtons(false);
    if (!localStream) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                setupPeerConnection(stream);
                createOffer();
            })
            .catch(error => {
                console.error('Error accessing media devices:', error);
                alert('Camera and microphone access is required to start a call.');
            });
    } else {
        setupPeerConnection(localStream);
        createOffer();
    }
});

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

// Append chat message to container
function appendMessage(text, type) {
    const container = document.getElementById('messagesContainer');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    container.appendChild(div);
    // Ensure chat box stays scrollable and does not expand
    container.style.overflowY = 'auto';
    container.style.maxHeight = '220px';
    container.scrollTop = container.scrollHeight;
}

// Enter to send (desktop only)
messageInput.addEventListener('keydown', function(e) {
    // Only on desktop: width > 600px and not mobile user agent
    const isDesktop = window.innerWidth > 600 && !/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});
