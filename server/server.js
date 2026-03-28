const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const players = {};
let playerCount = 0;

function attachSocketIO(server) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log(`[Server]: A user connected: ${socket.id}`);

        if (playerCount >= 2) {
            console.log(`[Server]: Rejected ${socket.id} — lobby full.`);
            socket.disconnect(true);
            return;
        }

        const assignedId = players['Player 1'] ? 'Player 2' : 'Player 1';
        players[assignedId] = socket.id;
        playerCount++;
        console.log(`[Server]: Assigned ${assignedId} to ${socket.id}`);

        socket.emit('PLAYER_JOINED', { id: assignedId, socketId: socket.id });

        socket.on('STATE_UPDATE', (data) => {
            socket.broadcast.emit('BROADCAST_STATE', data);
        });

        socket.on('SPELL_CAST', (data) => {
            socket.broadcast.emit('BROADCAST_SPELL', data);
        });

        socket.on('connect_error', (err) => {
            console.log(`[Server]: connect_error for ${assignedId}:`, err.message);
        });

        socket.on('error', (err) => {
            console.log(`[Server]: error for ${assignedId}:`, err.message);
        });

        socket.on('disconnect', (reason) => {
            console.log(`[Server]: ${assignedId} disconnected. Reason: ${reason}`);
            if (players[assignedId] === socket.id) {
                delete players[assignedId];
                playerCount--;
            }
        });
    });

    io.engine.on('connection_error', (err) => {
        console.log('[Server]: Engine connection_error:', err.message);
    });
}

// ── Try to start HTTPS (so LAN clients get a secure context for getUserMedia) ──
const CERT_KEY = path.join(__dirname, 'cert', 'key.pem');
const CERT_CERT = path.join(__dirname, 'cert', 'cert.pem');

if (fs.existsSync(CERT_KEY) && fs.existsSync(CERT_CERT)) {
    // HTTPS mode — both players can use the microphone over LAN
    const httpsServer = https.createServer({
        key: fs.readFileSync(CERT_KEY),
        cert: fs.readFileSync(CERT_CERT),
    }, app);

    attachSocketIO(httpsServer);

    httpsServer.listen(3000, () => {
        console.log('[Server]: Wizard Arena (HTTPS) → https://localhost:3000');
        console.log('[Server]: Your friend connects to https://<YOUR-LAN-IP>:3000');
        console.log('[Server]: They will see a cert warning — click "Advanced → Proceed".');
    });
} else {
    // HTTP fallback — microphone ONLY works on the host machine (localhost)
    const httpServer = http.createServer(app);
    attachSocketIO(httpServer);

    httpServer.listen(3000, () => {
        console.log('[Server]: Wizard Arena (HTTP) → http://localhost:3000');
        console.log('');
        console.log('[Server]: ⚠️  WARNING: Microphone will NOT work for LAN players.');
        console.log('[Server]: To fix this, generate a self-signed cert:');
        console.log('');
        console.log('   mkdir -p server/cert');
        console.log('   cd server/cert');
        console.log('   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"');
        console.log('');
        console.log('[Server]: Then restart. Your friend must accept the cert warning in their browser.');
    });
}