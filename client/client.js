// Helper: Get MongoDB userId by email from allUsers (populated in index.html)
function getUserIdByEmail(email) {
    if (window.allUsers && Array.isArray(window.allUsers)) {
        const user = window.allUsers.find(u => u.email === email);
        return user ? user._id : null;
    }
    return null;
}

// Call this after a call is established (e.g., after signaling handshake is complete)
async function debitPeasForCall(localEmail, remoteEmail, duration = 0, details = '') {
    const userId = getUserIdByEmail(localEmail);
    const peerId = getUserIdByEmail(remoteEmail);
    console.log('[Peas Debug] debitPeasForCall:', { localEmail, remoteEmail, userId, peerId });
    if (!userId || !peerId) {
        console.warn('[Peas Debug] Missing userId or peerId, aborting peas debit.');
        return;
    }
    try {
        await fetch('https://d8aadbb38c76.ngrok-free.app/api/call', //3000
             {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                peerId,
                callTime: new Date(),
                duration,
                details
            })
        });
    } catch (e) { console.error('Failed to debit peas for call', e); }
}
// Firebase Authentication for browser:
// Make sure you have included firebase-app-compat.js and firebase-auth-compat.js in your HTML before this script.
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyCnUEkbwEYruJ0YvbQkjFC9yfMDJsLqOlo",
    authDomain: "peaple-c3f4b.firebaseapp.com",
    projectId: "peaple-c3f4b",
    storageBucket: "peaple-c3f4b.firebasestorage.app",
    messagingSenderId: "814546020627",
    appId: "1:814546020627:web:c43c90fe6af9a0359e52e6",
    measurementId: "G-KHQMHRZ08F"
  });
}
const auth = firebase.auth();

// UI button references
const muteButton = document.getElementById('muteButton');
const muteIcon = document.getElementById('muteIcon');
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const screenShareButton = document.getElementById('screenShareButton');
const settingsButton = document.getElementById('settingsButton');

let isMuted = false;
let localAudioTrack = null;

function setMuteUI(muted) {
    // Update main toolbar icon
    if (muteIcon) {
        muteIcon.className = muted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone';
    }
    // Update main mute button accessible state
    if (muteButton) {
        muteButton.setAttribute('aria-pressed', String(muted));
        muteButton.setAttribute('title', muted ? 'Unmute' : 'Mute');
    }
    // Update fullscreen toolbar icon if present
    const fsMicBtn = document.getElementById('fsMicBtn');
    if (fsMicBtn) {
        fsMicBtn.innerHTML = `<i class="fa-solid ${muted ? 'fa-microphone-slash' : 'fa-microphone'}"></i>`;
        fsMicBtn.setAttribute('aria-pressed', String(muted));
        fsMicBtn.setAttribute('title', muted ? 'Unmute' : 'Mute');
    }
}
// Expose getter for fullscreen script to sync icon on enter
window.__getMuteState = function() { return isMuted; };

function updateCallButtons(isConnected) {
    if (isConnected) {
        startButton.textContent = 'Next';
        endButton.style.display = 'inline-flex';
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
    setMuteUI(isMuted);
});

// End call button logic
endButton.addEventListener('click', () => {
    // Close peer connection and data channel
    if (peerConnection) {
        try { peerConnection.onicecandidate = null; } catch {}
        try { peerConnection.ontrack = null; } catch {}
        try { peerConnection.ondatachannel = null; } catch {}
        try { if (dataChannel && dataChannel.readyState !== 'closed') dataChannel.close(); } catch {}
        dataChannel = null;
        try { peerConnection.close(); } catch {}
        peerConnection = null;
    }

    // Stop and release local media (disable camera and mic)
    try {
        if (localStream) {
            localStream.getTracks().forEach(t => {
                try { t.stop(); } catch {}
            });
        }
    } catch {}
    localStream = null;
    // Reset mute state and local audio track
    isMuted = false;
    localAudioTrack = null;
    setMuteUI(false);

    // Clear video elements
    try { if (remoteVideo) remoteVideo.srcObject = null; } catch {}
    try { if (localVideo) localVideo.srcObject = null; } catch {}

    // Notify and close signaling socket so server unmatches us
    if (signalingServer) {
        try {
            if (signalingServer.readyState === WebSocket.OPEN) {
                signalingServer.send(JSON.stringify({ type: 'leave' }));
                // Also send a legacy 'disconnected' for servers expecting that event name
                signalingServer.send(JSON.stringify({ type: 'disconnected' }));
            }
        } catch {}
        try { signalingServer.onopen = signalingServer.onmessage = signalingServer.onclose = null; } catch {}
        try { signalingServer.close(); } catch {}
    }
    signalingServer = null;

    // Reset state flags
    isMatched = false;
    isOfferRole = false;
    offerPendingUntilMatched = false;
    peasDebitedForThisCall = false;
    readySent = false;
    userInitiated = false;

    // UI updates
    const remoteOverlay = document.getElementById('remoteOverlay');
    if (remoteOverlay) {
        remoteOverlay.textContent = 'Call ended!';
        remoteOverlay.style.display = 'flex';
    }
    if (typeof showConnectedUserName === 'function') {
        showConnectedUserName('');
    }
    // Clear chat and show empty state while waiting for next match
    const fsMsgNext = document.getElementById('fsMessagesContainer');
    if (fsMsgNext) fsMsgNext.innerHTML = '';
    const mainMsgNext = document.getElementById('messagesContainer');
    if (mainMsgNext) mainMsgNext.innerHTML = '';
    showChatEmptyState();
    updateCallButtons(false);
    setLocalVideoActive(false); // Hide video, show placeholder

    // Clear chat
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) messagesContainer.innerHTML = '';
    const fsMsg = document.getElementById('fsMessagesContainer');
    if (fsMsg) fsMsg.innerHTML = '';
    showChatEmptyState();
    // Stop and hide timer
    stopCallTimer(true);
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
let signalingServer = null; // lazy-initialized on Start
const __host = window.location && window.location.hostname ? window.location.hostname : '';
const __qs = new URLSearchParams(window.location.search || '');
const __forceLocal = __qs.get('localWs') === '1';
const SIGNALING_URL = (__forceLocal || !__host || __host === 'localhost' || __host === '127.0.0.1')
    ? 'ws://localhost:8000'
    : 'wss://06cbb40a90b2.ngrok-free.app';

let peerConnection;
let dataChannel;

// Step 1: Get user media (camera and microphone) only when Start Call is clicked
let localStream = null;
let isMatched = false;
let isOfferRole = false; // true if this client should be the one to debit peas
let peasDebitedForThisCall = false; // ensure we only debit once per connection
let userInitiated = false; // set true only when Start is clicked
let offerPendingUntilMatched = false; // if PC ready before matched
let readySent = false; // ensure we only send 'ready' once

// ----- Call duration timer -----
let __callTimerInterval = null;
let __callTimerStart = null;
function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function updateCallTimerUI() {
    const el = document.getElementById('callTimer');
    if (!el) return;
    if (!__callTimerStart) { el.textContent = '00:00'; return; }
    el.textContent = formatDuration(Date.now() - __callTimerStart);
}
function startCallTimer() {
    const el = document.getElementById('callTimer');
    if (!el) return;
    __callTimerStart = Date.now();
    el.style.display = 'inline-block';
    updateCallTimerUI();
    if (__callTimerInterval) clearInterval(__callTimerInterval);
    __callTimerInterval = setInterval(updateCallTimerUI, 1000);
}
function stopCallTimer(reset=true) {
    const el = document.getElementById('callTimer');
    if (__callTimerInterval) { clearInterval(__callTimerInterval); __callTimerInterval = null; }
    if (reset) __callTimerStart = null;
    if (el) {
        if (reset) el.textContent = '00:00';
        el.style.display = 'none';
    }
}

// ----- Chat empty state helpers -----
function ensureChatEmptyEls() {
    // Main chat empty state (overlay inside messages container)
    let mainEmpty = document.getElementById('chatEmptyMain');
    if (!mainEmpty) {
        const mainBox = document.getElementById('messagesContainer');
        if (mainBox) {
            if (!mainBox.style.position || mainBox.style.position === '') {
                mainBox.style.position = 'relative';
            }
            const m = document.createElement('div');
            m.id = 'chatEmptyMain';
            m.style.cssText = 'display:none; position:absolute; inset:0; align-items:center; justify-content:center; color:#7a8ca1; text-align:center; padding:14px; box-sizing:border-box;';
            m.innerHTML = '<div style="max-width:260px; margin:auto; background:linear-gradient(180deg, #ffffff, #f5f9ff); border:1px dashed #c8d7ee; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(0,0,0,0.04);">\
              <div style="font-size:1.05rem; font-weight:700; color:#2b5ea6;">Start a call and make Conversation</div>\
              <div style="font-size:0.92rem; margin-top:6px; color:#6b7c93;">Your chat will appear here once you connect.</div>\
            </div>';
            mainBox.appendChild(m);
        }
    }
    // FS chat empty state (overlay inside messages area)
    let fsEmpty = document.getElementById('chatEmptyFS');
    if (!fsEmpty) {
        const fsBox = document.getElementById('fsMessagesContainer');
        if (fsBox) {
            if (!fsBox.style.position || fsBox.style.position === '') {
                fsBox.style.position = 'relative';
            }
            const f = document.createElement('div');
            f.id = 'chatEmptyFS';
            f.style.cssText = 'display:none; position:absolute; inset:0; align-items:center; justify-content:center; padding:12px; box-sizing:border-box;';
            f.innerHTML = '<div style="max-width:300px; margin:auto; text-align:center; background:linear-gradient(180deg, #ffffff, #f5f9ff); border:1px dashed #c8d7ee; border-radius:16px; padding:18px; color:#6b7c93; box-shadow:0 2px 10px rgba(0,0,0,0.04);">\
              <div style="font-size:1.05rem; font-weight:700; color:#2b5ea6;">Start a call and make Conversation</div>\
              <div style="font-size:0.92rem; margin-top:6px;">Your chat will appear here once you connect.</div>\
            </div>';
            fsBox.appendChild(f);
        }
    }
}

function showChatEmptyState() {
    ensureChatEmptyEls();
    const mainEmpty = document.getElementById('chatEmptyMain');
    const fsEmpty = document.getElementById('chatEmptyFS');
    if (mainEmpty) { mainEmpty.style.display = 'flex'; }
    if (fsEmpty) { fsEmpty.style.display = 'flex'; }
}

function hideChatEmptyState() {
    const mainEmpty = document.getElementById('chatEmptyMain');
    const fsEmpty = document.getElementById('chatEmptyFS');
    if (mainEmpty) { mainEmpty.style.display = 'none'; }
    if (fsEmpty) { fsEmpty.style.display = 'none'; }
}

function isCurrentlyMatched() {
    return !!(isMatched || (peerConnection && peerConnection.connectionState === 'connected'));
}
window.isCurrentlyMatched = isCurrentlyMatched;

function goToNextMatch() {
    // We assume localStream is already available; do NOT stop it.
    console.log('[NEXT] switching to next user');
    userInitiated = true; // keep searching
    readySent = false;
    isMatched = false;
    isOfferRole = false;
    offerPendingUntilMatched = false;

    // Close existing peer connection and data channel
    try {
        if (peerConnection) {
            try { peerConnection.onicecandidate = null; } catch {}
            try { peerConnection.ontrack = null; } catch {}
            try { peerConnection.ondatachannel = null; } catch {}
            try { if (dataChannel && dataChannel.readyState !== 'closed') dataChannel.close(); } catch {}
            dataChannel = null;
            try { peerConnection.close(); } catch {}
        }
    } catch {}
    peerConnection = null;
    try { if (remoteVideo) remoteVideo.srcObject = null; } catch {}

    // Notify server we are leaving this match and close socket
    if (signalingServer) {
        try {
            if (signalingServer.readyState === WebSocket.OPEN) {
                signalingServer.send(JSON.stringify({ type: 'leave' }));
                signalingServer.send(JSON.stringify({ type: 'disconnected' }));
            }
        } catch {}
        try { signalingServer.onopen = signalingServer.onmessage = signalingServer.onclose = null; } catch {}
        try { signalingServer.close(); } catch {}
    }
    signalingServer = null;

    // UI: show waiting overlay and keep buttons as connected state (Next + End visible)
    const remoteOverlay = document.getElementById('remoteOverlay');
    if (remoteOverlay) {
        remoteOverlay.textContent = 'Waiting for People...';
        remoteOverlay.style.display = 'flex';
    }
    if (typeof showConnectedUserName === 'function') {
        showConnectedUserName('');
    }

    // Recreate a new peerConnection with the existing localStream
    if (localStream) {
        setupPeerConnection(localStream);
    }

    // Reconnect signaling and send ready to get paired with next waiting user
    ensureSocket();
    sendReadyOnce();
}
window.goToNextMatch = goToNextMatch;

// Show empty-state on initial load
window.addEventListener('DOMContentLoaded', () => { showChatEmptyState(); });

function sendReadyOnce() {
    if (!userInitiated || readySent || !signalingServer) return;
    if (signalingServer.readyState === WebSocket.OPEN) {
        try { signalingServer.send(JSON.stringify({ type: 'ready' })); readySent = true; console.log('[SIGNAL] sent ready'); } catch (e) { console.warn('[SIGNAL] failed to send ready', e); }
    }
}

function ensureSocket() {
    if (signalingServer && (signalingServer.readyState === WebSocket.OPEN || signalingServer.readyState === WebSocket.CONNECTING)) {
        return;
    }
    signalingServer = new WebSocket(SIGNALING_URL);
    signalingServer.onopen = () => {
        console.log('[WS] open', SIGNALING_URL);
        sendReadyOnce();
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
            console.log('[WS] message', parsedData.type);
            if (parsedData.type === 'matched') {
                if (!userInitiated) { console.log('[MATCH] ignored (no userInitiated)'); return; }
                isMatched = true;
                if (typeof parsedData.role === 'string') {
                    isOfferRole = parsedData.role === 'offer';
                }
                console.log('[MATCH] matched. role:', isOfferRole ? 'offer' : 'answer');
                updateCallButtons(true);
                // If we are offer and PC is ready, create offer now
                if (isOfferRole && peerConnection) {
                    console.log('[OFFER] creating offer immediately');
                    createOffer();
                } else if (isOfferRole) {
                    console.log('[OFFER] will create after PC ready');
                    offerPendingUntilMatched = true;
                }
                // Send my identity (immediately and after a delay)
                function sendMyName() {
                    if (auth.currentUser && signalingServer && signalingServer.readyState === WebSocket.OPEN) {
                        signalingServer.send(JSON.stringify({
                            type: 'myName',
                            name: auth.currentUser.displayName || auth.currentUser.email,
                            email: auth.currentUser.email
                        }));
                        console.log('[IDENTITY] sent myName');
                    }
                }
                sendMyName();
                setTimeout(sendMyName, 500);
            }
            if (parsedData.type === 'myName') {
                if (typeof showConnectedUserName === 'function') {
                    showConnectedUserName(parsedData.name);
                }
                if (parsedData.email) {
                    window.connectedUserEmail = parsedData.email;
                } else {
                    window.connectedUserEmail = parsedData.name;
                }
                // Save display name for FS chat header
                window.connectedUserName = parsedData.name || parsedData.email || '';
                try {
                    const localEmail = auth.currentUser ? auth.currentUser.email : null;
                    // Only the offer role user should debit peas, and only once per call
                    console.log('[Peas Debug] Role check:', { isOfferRole, peasDebitedForThisCall, localEmail, remoteEmail: window.connectedUserEmail });
                    if (isOfferRole && !peasDebitedForThisCall && localEmail && window.connectedUserEmail) {
                        peasDebitedForThisCall = true;
                        console.log('[Peas Debug] Deducting peas for call establishment - ONLY ONCE');
                        debitPeasForCall(localEmail, window.connectedUserEmail);
                    } else {
                        console.log('[Peas Debug] Skipping pea deduction:', { 
                            reason: !isOfferRole ? 'not offer role' : 
                                   peasDebitedForThisCall ? 'already debited' : 
                                   !localEmail ? 'no local email' : 'no remote email'
                        });
                    }
                } catch (e) {
                    console.warn('[Peas Debug] Immediate debit failed/deferred:', e);
                }
            }
            if (parsedData.type === 'offer') {
                if (auth.currentUser && signalingServer && signalingServer.readyState === WebSocket.OPEN) {
                    signalingServer.send(JSON.stringify({
                        type: 'myName',
                        name: auth.currentUser.displayName || auth.currentUser.email,
                        email: auth.currentUser.email
                    }));
                }
                console.log('[ANSWER] received offer');
                handleOffer(parsedData.offer);
            } else if (parsedData.type === 'answer') {
                if (auth.currentUser && signalingServer && signalingServer.readyState === WebSocket.OPEN) {
                    signalingServer.send(JSON.stringify({
                        type: 'myName',
                        name: auth.currentUser.displayName || auth.currentUser.email,
                        email: auth.currentUser.email
                    }));
                }
                console.log('[OFFER] received answer');
                handleAnswer(parsedData.answer);
            } else if (parsedData.type === 'candidate') {
                handleCandidate(parsedData.candidate);
            } else if (parsedData.type === 'disconnected' || parsedData.type === 'leave') {
                // Perform full teardown as if End Call was pressed, so camera/mic stop as well
                try {
                    if (peerConnection) {
                        try { peerConnection.onicecandidate = null; } catch {}
                        try { peerConnection.ontrack = null; } catch {}
                        try { peerConnection.ondatachannel = null; } catch {}
                        try { if (dataChannel && dataChannel.readyState !== 'closed') dataChannel.close(); } catch {}
                        dataChannel = null;
                        try { peerConnection.close(); } catch {}
                        peerConnection = null;
                    }
                } catch {}
                try {
                    if (localStream) {
                        localStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
                    }
                } catch {}
                localStream = null;
                isMuted = false;
                localAudioTrack = null;
                if (muteIcon) muteIcon.className = 'fa-solid fa-microphone';
                try { if (remoteVideo) remoteVideo.srcObject = null; } catch {}
                try { if (localVideo) localVideo.srcObject = null; } catch {}
                if (signalingServer) {
                    try { if (signalingServer.readyState === WebSocket.OPEN) signalingServer.send(JSON.stringify({ type: 'leave' })); } catch {}
                    try { signalingServer.onopen = signalingServer.onmessage = signalingServer.onclose = null; } catch {}
                    try { signalingServer.close(); } catch {}
                }
                signalingServer = null;
                isMatched = false;
                isOfferRole = false;
                offerPendingUntilMatched = false;
                peasDebitedForThisCall = false;
                readySent = false;
                userInitiated = false;

                const remoteOverlay = document.getElementById('remoteOverlay');
                if (remoteOverlay) {
                    remoteOverlay.textContent = 'Call ended!';
                    remoteOverlay.style.display = 'flex';
                }
                if (typeof showConnectedUserName === 'function') {
                    showConnectedUserName('');
                }
                window.connectedUserName = '';
                updateCallButtons(false);
                setLocalVideoActive(false);
                showChatEmptyState();
                // Stop and hide timer on disconnect
                stopCallTimer(true);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };
    signalingServer.onclose = () => {
        // Treat socket close as call ended and fully teardown
        try {
            if (peerConnection) {
                try { peerConnection.onicecandidate = null; } catch {}
                try { peerConnection.ontrack = null; } catch {}
                try { peerConnection.ondatachannel = null; } catch {}
                try { if (dataChannel && dataChannel.readyState !== 'closed') dataChannel.close(); } catch {}
                dataChannel = null;
                try { peerConnection.close(); } catch {}
                peerConnection = null;
            }
        } catch {}
        try {
            if (localStream) {
                localStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
            }
        } catch {}
        localStream = null;
        isMuted = false;
        localAudioTrack = null;
        setMuteUI(false);
        try { if (remoteVideo) remoteVideo.srcObject = null; } catch {}
        try { if (localVideo) localVideo.srcObject = null; } catch {}
        signalingServer = null;
        isMatched = false;
        isOfferRole = false;
        offerPendingUntilMatched = false;
        peasDebitedForThisCall = false;
        readySent = false;
        userInitiated = false;
        const remoteOverlay = document.getElementById('remoteOverlay');
        if (remoteOverlay) {
            remoteOverlay.textContent = 'Call ended!';
            remoteOverlay.style.display = 'flex';
        }
        if (typeof showConnectedUserName === 'function') {
            showConnectedUserName('');
        }
        updateCallButtons(false);
        setLocalVideoActive(false);
        showChatEmptyState();
        // Stop and hide timer on socket close
        stopCallTimer(true);
    };
}

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
        hideChatEmptyState();
        // Start timer when remote media is received (connected)
        startCallTimer();
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate && signalingServer && signalingServer.readyState === WebSocket.OPEN) {
            signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };
    // Teardown if WebRTC detects the peer has disconnected/failed/closed
    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('[PC] connectionState:', state);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            try {
                if (peerConnection) {
                    try { peerConnection.onicecandidate = null; } catch {}
                    try { peerConnection.ontrack = null; } catch {}
                    try { peerConnection.ondatachannel = null; } catch {}
                    try { if (dataChannel && dataChannel.readyState !== 'closed') dataChannel.close(); } catch {}
                    dataChannel = null;
                    try { peerConnection.close(); } catch {}
                }
            } catch {}
            try {
                if (localStream) {
                    localStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
                }
            } catch {}
            localStream = null;
            isMuted = false;
            localAudioTrack = null;
            setMuteUI(false);
            try { if (remoteVideo) remoteVideo.srcObject = null; } catch {}
            try { if (localVideo) localVideo.srcObject = null; } catch {}
            isMatched = false;
            isOfferRole = false;
            offerPendingUntilMatched = false;
            peasDebitedForThisCall = false;
            readySent = false;
            userInitiated = false;
            const remoteOverlay = document.getElementById('remoteOverlay');
            if (remoteOverlay) {
                remoteOverlay.textContent = 'Call ended!';
                remoteOverlay.style.display = 'flex';
            }
            if (typeof showConnectedUserName === 'function') {
                showConnectedUserName('');
            }
            updateCallButtons(false);
            setLocalVideoActive(false);
        }
    };
    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log('[PC] iceConnectionState:', state);
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            // Let onconnectionstatechange handle teardown; no-op here or minimal UI
            const remoteOverlay = document.getElementById('remoteOverlay');
            if (remoteOverlay) {
                remoteOverlay.textContent = 'Call ended!';
                remoteOverlay.style.display = 'flex';
            }
            updateCallButtons(false);
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
    function sendChatMessage(text) {
        if (dataChannel && dataChannel.readyState === 'open') {
            const message = text;
            dataChannel.send(message);
            appendMessage(message, 'sent');
        } else {
            console.error('Data channel is not open.');
        }
    }
    sendButton.onclick = () => {
        const message = messageInput.value;
        if (message && message.trim()) {
            sendChatMessage(message.trim());
            messageInput.value = '';
        }
    };
    const fsSendButton = document.getElementById('fsSendButton');
    const fsMessageInput = document.getElementById('fsMessageInput');
    if (fsSendButton && fsMessageInput) {
        fsSendButton.onclick = () => {
            const m = fsMessageInput.value;
            if (m && m.trim()) {
                sendChatMessage(m.trim());
                fsMessageInput.value = '';
            }
        };
        fsMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const m = fsMessageInput.value;
                if (m && m.trim()) {
                    sendChatMessage(m.trim());
                    fsMessageInput.value = '';
                }
            }
        });
    }
}


// Only allow call/camera if user is logged in (auth check is handled in index.html script)
// This function should be called ONLY if user is authenticated
function startCallIfAuthenticated() {
    userInitiated = true;
    readySent = false;
    peasDebitedForThisCall = false; // Reset pea deduction flag for new call
    console.log('[CALL] start requested');
    const remoteOverlay = document.getElementById('remoteOverlay');
    if (remoteOverlay) {
        remoteOverlay.textContent = 'Waiting for People...';
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
    const fsMsg = document.getElementById('fsMessagesContainer');
    if (fsMsg) fsMsg.innerHTML = '';
    showChatEmptyState();
    updateCallButtons(false);
    // Acquire local media FIRST, then connect to signaling and announce readiness
    if (!localStream) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                setLocalVideoActive(true); // Show video, hide placeholder
                setupPeerConnection(stream);
                // Only now connect to signaling and send ready
                ensureSocket();
                sendReadyOnce();
                if (offerPendingUntilMatched && isOfferRole) {
                    console.log('[OFFER] creating offer after PC ready');
                    createOffer();
                    offerPendingUntilMatched = false;
                }
            })
            .catch(error => {
                console.error('Error accessing media devices:', error);
                alert('Camera and microphone access is required to start a call.');
            });
    } else {
        setLocalVideoActive(true); // Show video, hide placeholder
        setupPeerConnection(localStream);
        // Local media already available; proceed to signaling now
        ensureSocket();
        sendReadyOnce();
        if (offerPendingUntilMatched && isOfferRole) {
            console.log('[OFFER] creating offer after PC ready');
            createOffer();
            offerPendingUntilMatched = false;
        }
    }
}

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
            console.log('[OFFER] sent offer');
        });
}

// Start button click triggers offer creation

// Append chat message to container
function appendMessage(text, type) {
    // Main chat box
    const container = document.getElementById('messagesContainer');
    if (container) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        // Force visible styles regardless of theme for main chat
        div.style.maxWidth = '70%';
        div.style.padding = '8px 14px';
        div.style.borderRadius = '18px';
        div.style.fontSize = '1em';
        div.style.wordBreak = 'break-word';
        div.style.display = 'inline-block';
        if (type === 'sent') {
            div.style.background = '#09ff00';
            div.style.color = '#000';
            div.style.alignSelf = 'flex-end';
            div.style.borderBottomRightRadius = '4px';
            div.style.borderBottomLeftRadius = '18px';
        } else {
            div.style.background = '#fff';
            div.style.color = '#222';
            div.style.alignSelf = 'flex-start';
            div.style.border = '1px solid #e0e0e0';
            div.style.borderBottomLeftRadius = '4px';
            div.style.borderBottomRightRadius = '18px';
        }
        container.appendChild(div);
        container.style.overflowY = 'auto';
        container.style.maxHeight = '220px';
        container.scrollTop = container.scrollHeight;
    }
    // Fullscreen chat panel
    const fsContainer = document.getElementById('fsMessagesContainer');
    if (fsContainer) {
        const div2 = document.createElement('div');
        div2.className = `message ${type}`;
        div2.style.maxWidth = '80%';
        div2.style.margin = type === 'sent' ? '2px 0 2px auto' : '2px auto 2px 0';
        div2.style.padding = '8px 14px';
        div2.style.borderRadius = '18px';
        div2.style.fontSize = '1em';
        div2.style.wordBreak = 'break-word';
        div2.style.display = 'inline-block';
        if (type === 'sent') {
            div2.style.background = '#09ff00';
            div2.style.color = '#000';
            div2.style.borderBottomRightRadius = '4px';
        } else {
            div2.style.background = '#fff';
            div2.style.color = '#222';
            div2.style.border = '1px solid #e0e0e0';
            div2.style.borderBottomLeftRadius = '4px';
        }
        div2.textContent = text;
        fsContainer.appendChild(div2);
        fsContainer.scrollTop = fsContainer.scrollHeight;
    }
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

// When local video stream starts, hide the placeholder and show video
function setLocalVideoActive(isActive) {
  const localVideo = document.getElementById('localVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  if (isActive) {
    localVideo.classList.add('active');
    if (placeholder) placeholder.style.display = 'none';
  } else {
    localVideo.classList.remove('active');
    if (placeholder) placeholder.style.display = '';
  }
}

// Hide/show local video placeholder based on video events
(function setupLocalVideoPlaceholderEvents() {
  const localVideo = document.getElementById('localVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  if (!localVideo || !placeholder) return;
  function showPlaceholder() {
    localVideo.classList.remove('active');
    placeholder.style.display = '';
  }
  function hidePlaceholder() {
    localVideo.classList.add('active');
    placeholder.style.display = 'none';
  }
  localVideo.addEventListener('loadeddata', hidePlaceholder);
  localVideo.addEventListener('emptied', showPlaceholder);
  // Initial state
  if (localVideo.readyState >= 2) {
    hidePlaceholder();
  } else {
    showPlaceholder();
  }
})();

(function setupLocalVideoPlaceholderPolling() {
  const localVideo = document.getElementById('localVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  if (!localVideo || !placeholder) return;
  let lastState = null;
  setInterval(() => {
    const hasStream = !!localVideo.srcObject;
    if (hasStream !== lastState) {
      lastState = hasStream;
      if (hasStream) {
        localVideo.classList.add('active');
        placeholder.style.display = 'none';
      } else {
        localVideo.classList.remove('active');
        placeholder.style.display = '';
      }
    }
  }, 200);
})();

// ----- Local PiP drag-to-corner positioning -----
(function setupLocalPipCornering() {
  const pip = document.getElementById('localVideo');
  const placeholder = document.getElementById('localVideoPlaceholder');
  const container = document.getElementById('videoContainer');
  if (!pip || !container) return;

  const CORNERS = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];

  function applyCorner(corner) {
    const targets = [pip, placeholder].filter(Boolean);
    targets.forEach(el => {
      el.style.position = 'absolute';
      el.style.top = '';
      el.style.left = '';
      el.style.right = '';
      el.style.bottom = '';
      switch (corner) {
        case 'top-left':
          el.style.top = '18px';
          el.style.left = '18px';
          break;
        case 'top-right':
          el.style.top = '18px';
          el.style.right = '18px';
          break;
        case 'bottom-left':
          el.style.bottom = '18px';
          el.style.left = '18px';
          break;
        case 'bottom-right':
        default:
          el.style.bottom = '18px';
          el.style.right = '18px';
          break;
      }
    });
  }

  function getCorner() {
    return localStorage.getItem('pipCorner') || 'bottom-right';
  }
  function setCorner(corner) {
    localStorage.setItem('pipCorner', corner);
    applyCorner(corner);
  }
  // Expose for other scripts (e.g., fullscreen hints)
  window.__getPipCorner = getCorner;
  window.__setPipCorner = setCorner;

  // Initialize to saved corner
  applyCorner(getCorner());

  // Drag logic (mouse and touch)
  let dragging = false;
  let startX = 0, startY = 0;
  let pipStartLeft = 0, pipStartTop = 0;

  function getEventPoint(ev) {
    if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
  }

  function onStart(ev) {
    ev.preventDefault();
    const pt = getEventPoint(ev);
    const pipRect = pip.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    dragging = true;
    startX = pt.x;
    startY = pt.y;
    // Convert current position to top/left relative to container for free drag
    pipStartLeft = pipRect.left - contRect.left;
    pipStartTop = pipRect.top - contRect.top;
    pip.style.right = '';
    pip.style.bottom = '';
    pip.style.left = pipStartLeft + 'px';
    pip.style.top = pipStartTop + 'px';
    if (placeholder) {
      placeholder.style.right = '';
      placeholder.style.bottom = '';
      placeholder.style.left = pipStartLeft + 'px';
      placeholder.style.top = pipStartTop + 'px';
    }
    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
  }

  function onMove(ev) {
    if (!dragging) return;
    ev.preventDefault();
    const pt = getEventPoint(ev);
    const dx = pt.x - startX;
    const dy = pt.y - startY;
    const contRect = container.getBoundingClientRect();
    const pipRect = pip.getBoundingClientRect();
    const newLeft = Math.min(Math.max(0, pipStartLeft + dx), contRect.width - pipRect.width);
    const newTop = Math.min(Math.max(0, pipStartTop + dy), contRect.height - pipRect.height);
    pip.style.left = newLeft + 'px';
    pip.style.top = newTop + 'px';
    if (placeholder) {
      placeholder.style.left = newLeft + 'px';
      placeholder.style.top = newTop + 'px';
    }
  }

  function onEnd(ev) {
    if (!dragging) return;
    ev.preventDefault();
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);

    // Snap to nearest corner
    const contRect = container.getBoundingClientRect();
    const pipRect = pip.getBoundingClientRect();
    const left = pipRect.left - contRect.left;
    const top = pipRect.top - contRect.top;
    const right = contRect.width - (left + pipRect.width);
    const bottom = contRect.height - (top + pipRect.height);

    const distances = [
      { corner: 'top-left', d: Math.hypot(left, top) },
      { corner: 'top-right', d: Math.hypot(right, top) },
      { corner: 'bottom-left', d: Math.hypot(left, bottom) },
      { corner: 'bottom-right', d: Math.hypot(right, bottom) }
    ];
    distances.sort((a,b) => a.d - b.d);
    const nearest = distances[0].corner;
    setCorner(nearest);

    // Visual feedback
    try {
      pip.style.boxShadow = '0 0 0 3px rgba(33,150,243,0.5)';
      setTimeout(() => { pip.style.boxShadow = ''; }, 250);
    } catch {}
  }

  // Bind start events
  pip.addEventListener('mousedown', onStart);
  pip.addEventListener('touchstart', onStart, { passive: false });
})();
