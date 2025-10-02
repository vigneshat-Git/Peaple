function getUserIdByEmail(email) {
    if (window.allUsers && Array.isArray(window.allUsers)) {
        const user = window.allUsers.find(u => u.email === email);
        return user ? user._id : null;
    }
}

// Helper: Get username by email from allUsers; fallback to displayName/email
function getUsernameByEmail(email) {
    if (!email) return null;
    try {
        if (window.allUsers && Array.isArray(window.allUsers)) {
            const user = window.allUsers.find(u => u.email === email);
            if (user && user.username) return user.username;
        }
        // Fallback to Firebase displayName if it's the local user
        if (auth && auth.currentUser && auth.currentUser.email === email) {
            return auth.currentUser.displayName || email;
        }
    } catch {}
    // Final fallback: local-part of email
    try { return String(email).split('@')[0] || null; } catch { return null; }
}

// ----- Recent Connections helpers -----
// Default avatar (neutral SVG, no randomization)
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">\
<rect width="80" height="80" rx="40" fill="%23e5e7eb"/>\
<circle cx="40" cy="32" r="14" fill="%239ca3af"/>\
<path d="M16 66c6-12 18-18 24-18s18 6 24 18" fill="%239ca3af"/>\
</svg>';

function getAvatarForUser(userObj) {
    if (!userObj) return DEFAULT_AVATAR;
    const url = (userObj.avatarUrl || '').trim();
    return url ? url : DEFAULT_AVATAR;
}

function getAvatarByEmailOrUsername(identifier) {
    if (!identifier) return DEFAULT_AVATAR;
    try {
        if (window.allUsers && Array.isArray(window.allUsers)) {
            const byEmail = window.allUsers.find(u => u.email === identifier);
            if (byEmail) return getAvatarForUser(byEmail);
            const byName = window.allUsers.find(u => u.username === identifier);
            if (byName) return getAvatarForUser(byName);
        }
    } catch {}
    return DEFAULT_AVATAR;
}
// expose for inline scripts in index.html
window.__getAvatarByEmailOrUsername = getAvatarByEmailOrUsername;
function timeAgoCustom(dateInput) {
    const now = Date.now();
    const ts = (dateInput instanceof Date) ? dateInput.getTime() : new Date(dateInput).getTime();
    if (isNaN(ts)) return '';
    const diffMs = Math.max(0, now - ts);
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const week = Math.floor(day / 7);
    const month = Math.floor(day / 30);
    const year = Math.floor(day / 365);
    if (sec < 60) return `${sec || 1} sec ago`;
    if (min < 60) return `${min} mins ago`;
    if (hr < 24) return `${hr} hrs ago`;
    if (day < 7) return `${day} days ago`;
    if (day < 30) return `${Math.max(1, week)} weeks ago`;
    if (day < 365) return `${Math.max(1, month)} months ago`;
    return `${Math.max(1, year)} years ago`;
}

function pickProfession(userObj) {
    if (!userObj) return 'Professional';
    if (userObj.profession && String(userObj.profession).trim()) return userObj.profession;
    if (userObj.bio && String(userObj.bio).trim()) return userObj.bio;
    return 'Professional';
}

async function fetchAllUsers() {
    try {
        const res = await fetch('https://b0ceedc0c97c.ngrok-free.app/api/users'); //3000
        if (!res.ok) throw new Error('users HTTP '+res.status);
        const users = await res.json();
        window.allUsers = Array.isArray(users) ? users : [];
        return window.allUsers;
    } catch (e) {
        console.warn('[RECENTS] failed to fetch users', e);
        window.allUsers = window.allUsers || [];
        return window.allUsers;
    }
}

async function fetchAllCalls() {
    try {
        const res = await fetch('https://b0ceedc0c97c.ngrok-free.app/api/calls'); //3000
        if (!res.ok) throw new Error('calls HTTP '+res.status);
        const calls = await res.json();
        return Array.isArray(calls) ? calls : [];
    } catch (e) {
        console.warn('[RECENTS] failed to fetch calls', e);
        return [];
    }
}

// ----- Weekly Report -----
function renderWeeklyReport(currentUsername, calls, users) {
    try {
        const card = document.querySelector('.weekly-report-card');
        if (!card || !currentUsername) return;
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6); // include today + past 6 days
        start.setHours(0,0,0,0);

        // Filter calls involving current user in last 7 days
        const weekCalls = (calls || []).filter(c => {
            if (!c || !c.user1 || !c.user2 || !c.dateTime) return false;
            if (c.user1 !== currentUsername && c.user2 !== currentUsername) return false;
            const dt = new Date(c.dateTime);
            return dt >= start && dt <= now;
        });

        // Aggregate
        const dayBuckets = []; // 0..6 days; 0=start day
        for (let i=0;i<7;i++) dayBuckets.push({ count:0, duration:0 });
        let totalDuration = 0; // seconds
        let longest = 0; // seconds
        const partners = new Set();
        let lastCallDt = null;

        weekCalls.forEach(c => {
            const dt = new Date(c.dateTime);
            const idx = Math.floor((dt.setHours(0,0,0,0) - start.getTime()) / (24*3600*1000));
            const dur = Number(c.duration || 0);
            if (idx>=0 && idx<7) {
                dayBuckets[idx].count += 1;
                dayBuckets[idx].duration += dur;
            }
            totalDuration += dur;
            if (dur > longest) longest = dur;
            const other = (c.user1 === currentUsername) ? c.user2 : c.user1;
            if (other) partners.add(other);
            const cdt = new Date(c.dateTime);
            if (!lastCallDt || cdt > lastCallDt) lastCallDt = cdt;
        });

        const fmtDur = (sec) => {
            const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
            if (h>0) return `${h}h ${String(m).padStart(2,'0')}m`;
            return `${m}m`;
        };
        const dayLabels = Array.from({length:7}, (_,i) => {
            const d = new Date(start.getTime() + i*24*3600*1000);
            return d.toLocaleDateString(undefined,{ weekday:'short' });
        });
        const maxCount = Math.max(1, ...dayBuckets.map(b=>b.count));

        // Build mini chart bars
        const bars = dayBuckets.map((b, i) => {
            const h = Math.max(4, Math.round((b.count / maxCount) * 42));
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                      <div title="${dayLabels[i]}: ${b.count} calls" style="width:20px;height:${h}px;background:#90caf9;border-radius:6px 6px 2px 2px;box-shadow:0 1px 3px rgba(0,0,0,0.1);"></div>
                      <div style="font-size:0.72rem;color:#667">${dayLabels[i].slice(0,2)}</div>
                    </div>`;
        }).join('');

        const lastCall = lastCallDt ? lastCallDt.toLocaleString() : '—';
        const uniquePartners = partners.size;
        const totalCalls = weekCalls.length;

        card.innerHTML = `
          <h2>This Week's Report</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;align-items:stretch;">
            <div style="background:linear-gradient(180deg,#ffffff,#f8fbff);border:1px solid #e5efff;border-radius:12px;padding:12px;">
              <div style="font-size:0.85rem;color:#567">Connections</div>
              <div style="font-weight:800;font-size:1.4rem;color:#0d47a1;">${totalCalls}</div>
            </div>
            <div style="background:linear-gradient(180deg,#ffffff,#f8fffa);border:1px solid #d7f5e3;border-radius:12px;padding:12px;">
              <div style="font-size:0.85rem;color:#567">Total Duration</div>
              <div style="font-weight:800;font-size:1.4rem;color:#1b5e20;">${fmtDur(totalDuration)}</div>
            </div>
            <div style="background:linear-gradient(180deg,#ffffff,#fff8fb);border:1px solid #ffd7e2;border-radius:12px;padding:12px;">
              <div style="font-size:0.85rem;color:#567">Unique People</div>
              <div style="font-weight:800;font-size:1.4rem;color:#880e4f;">${uniquePartners}</div>
            </div>
            <div style="background:linear-gradient(180deg,#ffffff,#fffdf6);border:1px solid #ffe6b3;border-radius:12px;padding:12px;">
              <div style="font-size:0.85rem;color:#567">Longest Call</div>
              <div style="font-weight:800;font-size:1.4rem;color:#b26a00;">${fmtDur(longest)}</div>
            </div>
          </div>
          <div style="margin-top:12px;background:#fff;border:1px solid #eee;border-radius:12px;padding:12px;">
            <div style="display:flex;align-items:flex-end;gap:10px;justify-content:space-between;">
              ${bars}
            </div>
            <div style="margin-top:8px;font-size:0.85rem;color:#666;display:flex;justify-content:space-between;">
              <span>Last 7 days</span>
              <span>Last call: ${lastCall}</span>
            </div>
          </div>
        `;
    } catch (e) {
        console.warn('[WEEKLY] render error', e);
    }
}

function renderRecentConnections(currentUsername, calls, users, showAll=false) {
    const listEl = document.querySelector('.recent-connections .connection-list');
    if (!listEl || !currentUsername) return;
    // Take ALL calls involving current user
    const items = [];
    for (const c of calls) {
        const u1 = c.user1; const u2 = c.user2;
        if (!u1 || !u2 || !c.dateTime) continue;
        if (u1 !== currentUsername && u2 !== currentUsername) continue;
        const other = (u1 === currentUsername) ? u2 : u1;
        items.push({ other, call: c });
    }
    items.sort((a,b) => new Date(b.call.dateTime) - new Date(a.call.dateTime));
    const toRender = showAll ? items : items.slice(0, 2);

    // Build DOM
    listEl.innerHTML = '';
    for (const { other, call } of toRender) {
        const userObj = users.find(u => u.username === other) || null;
        const profession = pickProfession(userObj);
        const when = timeAgoCustom(call.dateTime);
        const avatarSrc = getAvatarForUser(userObj);
        const emailLower = (userObj && userObj.email) ? String(userObj.email).toLowerCase() : '';
        const isOnline = !!(window.__onlineEmails && window.__onlineEmails.has(emailLower));
        const item = document.createElement('div');
        item.className = 'connection-item';
        item.innerHTML = `
            <div class="avatar-wrap" style="position:relative;display:inline-block;width:40px;height:40px;">
              <img src="${avatarSrc}" alt="${other}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
              ${isOnline ? '<span class="online-dot" style="position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fff;"></span>' : ''}
            </div>
            <div class="conn-info">
              <span>${other}</span>
              <span class="user-prof">${profession}</span>
            </div>
            <div class="conn-meta">
              <span>${when}</span>
              <button class="reconnect-btn" data-user="${other}">Reconnect</button>
            </div>
        `;
        listEl.appendChild(item);
    }
}

async function initRecentConnections() {
    try {
        const me = auth && auth.currentUser ? auth.currentUser : null;
        if (!me) return; // wait for auth
        const users = await fetchAllUsers();
        // Resolve my username same way we log calls
        const myUsername = getUsernameByEmail(me.email) || (me.displayName || me.email);
        const calls = await fetchAllCalls();
        // cache for toggling view-all without refetch
        window.__recentUsers = users;
        window.__recentCalls = calls;
        window.__recentMe = myUsername;
        window.__showAllConnections = false; // default collapsed on home list
        renderRecentConnections(myUsername, calls, users, false);
        // Also render weekly report
        try { renderWeeklyReport(myUsername, calls, users); } catch (e) { console.warn('[WEEKLY] render failed', e); }
    } catch (e) {
        console.warn('[RECENTS] init failed', e);
    }
}

function renderAllConnectionsPanel(currentUsername, calls, users) {
    const overlay = document.getElementById('allConnectionsOverlay');
    const listEl = document.getElementById('allConnectionsList');
    const panel = document.getElementById('allConnectionsPanel');
    if (!overlay || !listEl) return;
    // Filter all calls for current user and sort desc
    const items = [];
    for (const c of (calls || [])) {
        if (!c || !c.user1 || !c.user2 || !c.dateTime) continue;
        if (c.user1 !== currentUsername && c.user2 !== currentUsername) continue;
        const other = (c.user1 === currentUsername) ? c.user2 : c.user1;
        items.push({ other, call: c });
    }
    items.sort((a,b) => new Date(b.call.dateTime) - new Date(a.call.dateTime));

    // Build list (respect dark mode)
    listEl.innerHTML = '';
    const isDark = (document.documentElement && document.documentElement.getAttribute('data-theme') === 'dark');
    const colMuted = isDark ? '#94a3b8' : '#6b7280'; // slate-400 vs gray-500
    const colMain = isDark ? '#e2e8f0' : '#374151'; // slate-200 vs gray-700
    for (const { other, call } of items) {
        const userObj = users.find(u => u.username === other) || null;
        const profession = pickProfession(userObj);
        const when = timeAgoCustom(call.dateTime);
        const duration = (typeof call.duration === 'number') ? `${call.duration}s` : '';
        const avatarSrc = getAvatarForUser(userObj);
        const emailLower = (userObj && userObj.email) ? String(userObj.email).toLowerCase() : '';
        const isOnline = !!(window.__onlineEmails && window.__onlineEmails.has(emailLower));
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px 8px; border-bottom:1px solid #f0f2f5;';
        row.innerHTML = `
            <div class="avatar-wrap" style="position:relative;display:inline-block;width:44px;height:44px;">
              <img src="${avatarSrc}" alt="${other}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" />
              ${isOnline ? '<span class="online-dot" style="position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid #fff;"></span>' : ''}
            </div>
            <div style="display:flex;flex-direction:column;">
              <span style="font-weight:600;color:${colMain};">${other}</span>
              <span style="font-size:0.9rem;color:${colMuted};">${profession}</span>
            </div>
            <div style="margin-left:auto; text-align:right; display:flex; flex-direction:column; gap:2px;">
              <span style="font-size:0.92rem;color:${colMain};">${when}</span>
              <span style="font-size:0.82rem;color:${colMuted};">${duration}</span>
            </div>
        `;
        listEl.appendChild(row);
    }
    // Show panel with slide-in animation
    overlay.style.display = 'flex';
    try {
        // ensure initial offscreen state before triggering
        if (panel) {
            panel.style.transform = 'translateX(100%)';
            // next frame -> slide in
            requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });
        }
    } catch {}
}
// ----- Call summary logging -----
function getCallDurationSeconds() {
    if (!__callTimerStart) return 0;
    return Math.max(0, Math.floor((Date.now() - __callTimerStart) / 1000));
}
function getCallStartedAt() {
    return __callTimerStart ? new Date(__callTimerStart).toISOString() : null;
}
async function logCallSummaryIfNeeded(reason = '') {
    // Allow either side to log once; server will dedupe via upsert
    if (callLoggedThisCall) return;
    try {
        const localEmail = auth.currentUser ? auth.currentUser.email : null;
        const remoteEmail = window.connectedUserEmail || null;
        let startedAt = getCallStartedAt();
        let duration = getCallDurationSeconds();
        if (!localEmail || !remoteEmail) return;
        // If timer never started (e.g., disconnected before media), fallback
        if (!startedAt) { startedAt = new Date().toISOString(); duration = 0; }
        // Resolve usernames for both parties per new schema
        const user1Name = getUsernameByEmail(localEmail) || (auth.currentUser ? (auth.currentUser.displayName || localEmail) : localEmail);
        const usr2Name = getUsernameByEmail(remoteEmail) || (window.connectedUserName || remoteEmail);
        // Use same base as other API calls
        callLoggedThisCall = true; // set before sending to avoid double triggers
        const res = await fetch('https://b0ceedc0c97c.ngrok-free.app/api/call/log', //3000
             {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user1: user1Name,
                user2: usr2Name,
                dateTime: startedAt,
                duration
            })
        });
        if (!res.ok) { throw new Error('HTTP '+res.status); }
        console.log('[CALL LOG] summary saved', { user1: user1Name, user2: usr2Name, dateTime: startedAt, duration, reason, isOfferRole });
    } catch (e) {
        console.warn('[CALL LOG] failed to save summary', e);
        // allow retry if something else triggers later
        callLoggedThisCall = false;
    }
}

// Call this after a call is established (e.g., after signaling handshake is complete)
async function debitPeasForCall(localEmail, remoteEmail) {
    if (!localEmail || !remoteEmail) {
        console.warn('[Peas Debug] Missing emails, aborting peas debit.');
        return;
    }
    try {
        await Promise.all([
            fetch('https://b0ceedc0c97c.ngrok-free.app/api/peas/update', //3000
                 {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: localEmail, amount: -5 })
            }),
            fetch('https://b0ceedc0c97c.ngrok-free.app/api/peas/update', //3000
                 {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: remoteEmail, amount: -5 })
            })
        ]);
        console.log('[Peas Debug] Debited 5 peas from both users');
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
        // Keep End visible if local media is active so user can terminate camera/mic
        const hasLiveLocal = (typeof localStream !== 'undefined' && localStream &&
          typeof localStream.getTracks === 'function' && localStream.getTracks().some(t => t.readyState === 'live'));
        endButton.style.display = hasLiveLocal ? 'inline-flex' : 'none';
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
    // Stop any active screen share first
    try {
        if (screenStream) {
            screenStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
        }
    } catch {}
    screenStream = null;
    isScreenSharing = false;
    savedVideoSender = null;
    savedCameraTrack = null;

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
    // Ensure videos are visible again for next call state
    try { if (localVideo) localVideo.style.display = ''; } catch {}
    try { if (remoteVideo) remoteVideo.style.display = ''; } catch {}

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
    // Log call summary, then stop and hide timer
    logCallSummaryIfNeeded('endButton');
    stopCallTimer(true);
});

// ----- Screen Share -----
async function startScreenShare() {
    if (!peerConnection) {
        // Require a peer connection setup (after localStream is available)
        if (!localStream) return;
        setupPeerConnection(localStream);
    }
    try {
        // Request display media
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'motion' }, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) throw new Error('No screen video track');

        // Save references to restore later
        savedCameraTrack = (localStream && localStream.getVideoTracks()[0]) || null;
        const sender = peerConnection && typeof peerConnection.getSenders === 'function'
            ? peerConnection.getSenders().find(s => s.track && s.track.kind === 'video')
            : null;
        savedVideoSender = sender || null;

        if (savedVideoSender) {
            await savedVideoSender.replaceTrack(screenTrack);
        } else if (peerConnection) {
            peerConnection.addTrack(screenTrack, screenStream);
        }

        // When user stops sharing via browser UI, restore camera
        screenTrack.onended = () => { try { stopScreenShare(); } catch {} };

        // UI: toggle button and hide videos while sharing
        isScreenSharing = true;
        if (screenShareButton) {
            screenShareButton.innerHTML = '<i class="fa-solid fa-stop"></i>';
            screenShareButton.setAttribute('title', 'Stop sharing');
            screenShareButton.setAttribute('aria-pressed', 'true');
        }
        try { if (localVideo) localVideo.style.display = 'none'; } catch {}
        try { if (remoteVideo) remoteVideo.style.display = 'none'; } catch {}
    } catch (e) {
        console.warn('[ScreenShare] failed to start', e);
        // Reset state if failed
        try { if (screenStream) { screenStream.getTracks().forEach(t => { try { t.stop(); } catch {} }); } } catch {}
        screenStream = null; isScreenSharing = false;
    }
}

async function stopScreenShare() {
    if (!isScreenSharing) return;
    // Stop display media tracks
    try {
        if (screenStream) {
            screenStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
        }
    } catch {}

    // Restore camera track
    try {
        const cameraTrack = savedCameraTrack || (localStream && localStream.getVideoTracks()[0]) || null;
        if (savedVideoSender && cameraTrack) {
            await savedVideoSender.replaceTrack(cameraTrack);
        } else if (peerConnection && cameraTrack) {
            // As a fallback, add camera track if sender not found
            peerConnection.addTrack(cameraTrack, localStream);
        }
    } catch (e) { console.warn('[ScreenShare] restore camera failed', e); }

    // UI: toggle back and show videos
    isScreenSharing = false;
    screenStream = null;
    savedVideoSender = null;
    // keep savedCameraTrack for potential reuse; optional: null it
    if (screenShareButton) {
        screenShareButton.innerHTML = '<i class="fa-solid fa-display"></i>';
        screenShareButton.setAttribute('title', 'Share screen');
        screenShareButton.setAttribute('aria-pressed', 'false');
    }
    try { if (localVideo) localVideo.style.display = ''; } catch {}
    try { if (remoteVideo) remoteVideo.style.display = ''; } catch {}
}

// Screen share button logic: toggle start/stop
screenShareButton.addEventListener('click', async () => {
    if (!isScreenSharing) {
        await startScreenShare();
    } else {
        await stopScreenShare();
    }
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
    : 'wss://dccdc335e3b3.ngrok-free.app';

let peerConnection;
let dataChannel;

// Step 1: Get user media (camera and microphone) only when Start Call is clicked
let localStream = null;
let screenStream = null; // display media stream when screen sharing
let isScreenSharing = false;
let savedVideoSender = null; // RTCRtpSender for video
let savedCameraTrack = null; // original camera video track
let isMatched = false;
let isOfferRole = false; // true if this client should be the one to debit peas
let peasDebitedForThisCall = false; // ensure we only debit once per connection
let userInitiated = false; // set true only when Start is clicked
let offerPendingUntilMatched = false; // if PC ready before matched
let readySent = false; // ensure we only send 'ready' once
let callLoggedThisCall = false; // ensure we only log summary once per call

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
window.addEventListener('DOMContentLoaded', () => {
    showChatEmptyState();
    // Render recents after auth is ready
    try {
        auth.onAuthStateChanged(() => {
            initRecentConnections();
        });
    } catch {}
    // Wire 'View all connections' link
    try {
        const viewAll = document.querySelector('.recent-connections .view-all-connections');
        if (viewAll) {
            viewAll.addEventListener('click', (e) => {
                e.preventDefault();
                // Open slide-in and render full list
                if (window.__recentMe && window.__recentCalls && window.__recentUsers) {
                    renderAllConnectionsPanel(window.__recentMe, window.__recentCalls, window.__recentUsers);
                } else {
                    // Ensure data exists first, then open
                    initRecentConnections();
                    setTimeout(() => {
                        if (window.__recentMe && window.__recentCalls && window.__recentUsers) {
                            renderAllConnectionsPanel(window.__recentMe, window.__recentCalls, window.__recentUsers);
                        }
                    }, 300);
                }
            });
        }
    } catch {}
    // Wire close handlers for panel
    try {
        const overlay = document.getElementById('allConnectionsOverlay');
        const panel = document.getElementById('allConnectionsPanel');
        const closeBtn = document.getElementById('allConnCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (!overlay || !panel) return;
                try {
                    panel.style.transform = 'translateX(100%)';
                    setTimeout(() => { overlay.style.display = 'none'; }, 300);
                } catch { overlay.style.display = 'none'; }
            });
        }
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (!panel) { overlay.style.display = 'none'; return; }
                    try {
                        panel.style.transform = 'translateX(100%)';
                        setTimeout(() => { overlay.style.display = 'none'; }, 300);
                    } catch { overlay.style.display = 'none'; }
                }
            });
        }
    } catch {}
});

// Expose a small helper so index.html can re-render recents when online list updates
window.__refreshRecentsOnline = function() {
  try {
    if (window.__recentMe && window.__recentCalls && window.__recentUsers) {
      renderRecentConnections(window.__recentMe, window.__recentCalls, window.__recentUsers, window.__showAllConnections || false);
      // If panel is open, re-render it too
      const overlay = document.getElementById('allConnectionsOverlay');
      if (overlay && overlay.style.display !== 'none') {
        renderAllConnectionsPanel(window.__recentMe, window.__recentCalls, window.__recentUsers);
      }
    }
  } catch {}
};

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
                // Log call summary, then stop and hide timer on disconnect
                logCallSummaryIfNeeded('ws:disconnected');
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
        // Log call summary, then stop and hide timer on socket close
        logCallSummaryIfNeeded('ws:onclose');
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
        callLoggedThisCall = false;
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
                // Show End button immediately when camera is active (even if not connected yet)
                try { if (endButton) endButton.style.display = 'inline-flex'; } catch {}
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
        // We already have local media, ensure End button is visible to allow terminating camera
        try { if (endButton) endButton.style.display = 'inline-flex'; } catch {}
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
