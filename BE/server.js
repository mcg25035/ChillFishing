require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { db, initializeDatabase } = require('./db');
const adminRoutes = require('./routes/admin');
const { router: participantRoutes, setIoInstance: setParticipantIoInstance } = require('./routes/participant');
const { unlockRaffle, getRaffleState, setIoInstance: setRaffleServiceIoInstance } = require('./services/raffleService'); // Import getRaffleState and setIoInstance

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development, restrict in production
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3001;
const SECRET_IDENTIFY_TEXT = process.env.SECRET_IDENTIFY_TEXT;

// Ensure SECRET_IDENTIFY_TEXT is set
if (!SECRET_IDENTIFY_TEXT) {
    console.error('FATAL ERROR: SECRET_IDENTIFY_TEXT is not defined in .env file.');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Pass io instance to participant routes
setParticipantIoInstance(io);
// Pass io instance to raffle service
setRaffleServiceIoInstance(io);

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/participant', participantRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    // Emit initial raffle state to newly connected client
    socket.emit('raffleLocked', getRaffleState()); // Send current lock state

    socket.on('nextRaffle', (data) => {
        // Authenticate the nextRaffle event from projection view
        if (data && data.secret_identify_text === SECRET_IDENTIFY_TEXT) {
            unlockRaffle(); // Unlock the raffle
            io.emit('raffleUnlocked', false); // Notify clients that raffle is unlocked
            console.log('Raffle unlocked by projection view.');
        } else {
            console.warn('Unauthorized attempt to unlock raffle via Socket.IO');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
