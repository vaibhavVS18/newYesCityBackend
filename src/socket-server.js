/* Simple Socket.IO server for chat real-time handling
   Run this alongside your Next backend: node src/socket-server.js
   Requires: MONGO_URI, JWT_SECRET
*/
import http from 'http';
import { Server } from 'socket.io';
import dbConnect from './lib/db.js';
import ChatMessage from './models/ChatMessage.js';
import City from './models/City.js';
import User from './models/User.js';
import { verifyToken } from './lib/jwt.js';

const PORT = process.env.SOCKET_PORT || 4001;

async function start() {
  await dbConnect();
  const server = http.createServer();
  // Configure allowed origins via environment variable for production safety.
  const allowed = (process.env.SOCKET_ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
  const io = new Server(server, {
    cors: {
      origin: allowed,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
  // Log handshake origin for debugging in production
  console.log('socket handshake origin=', socket.handshake && socket.handshake.headers && socket.handshake.headers.origin);
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next();
      const decoded = verifyToken(token);
      if (!decoded) return next();
      const user = await User.findById(decoded.userId).lean();
      if (user) socket.user = { userId: user._id.toString(), username: user.username };
      return next();
    } catch {
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id, 'user=', socket.user && socket.user.userId);
  // simple stats
  socket.serverStats = socket.serverStats || { connections: 0, messages: 0 };
  socket.serverStats.connections += 1;

    socket.on('joinRoom', ({ city, groupName }) => {
      const room = `${city}::${groupName}`;
      socket.join(room);
    });

    socket.on('leaveRoom', ({ city, groupName }) => {
      const room = `${city}::${groupName}`;
      socket.leave(room);
    });

    socket.on('sendMessage', async (payload, ack) => {
      try {
        const { city, groupName, text, media } = payload || {};
        if (!city || !groupName) {
          if (typeof ack === 'function') ack({ success: false, message: 'Missing fields' });
          return;
        }
        const cityDoc = await City.findOne({ cityName: city });
        if (!cityDoc) {
          if (typeof ack === 'function') ack({ success: false, message: 'City not found' });
          return;
        }

        // require authenticated user when present on socket
        const userId = socket.user ? socket.user.userId : null;
        if (!userId) {
          if (typeof ack === 'function') ack({ success: false, message: 'Unauthenticated' });
          return;
        }

        const msg = new ChatMessage({ city: cityDoc._id, groupName, sender: userId, text, media: media || [] });
        await msg.save();
        const populated = await ChatMessage.findById(msg._id).populate('sender', 'username profileImage');
        const out = populated.toObject ? populated.toObject() : populated;
        const room = `${city}::${groupName}`;
        io.to(room).emit('message', out);
  // increment message count
  socket.serverStats.messages += 1;
        if (typeof ack === 'function') ack({ success: true, data: out });
      } catch (err) {
        console.error('socket sendMessage error', err);
        if (typeof ack === 'function') ack({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // cleanup if required
    });
  });

  server.listen(PORT, () => console.log(`Socket server listening on port ${PORT}`));
  // process-level monitoring/logging hooks
  process.on('uncaughtException', (err) => { console.error('uncaughtException', err); process.exit(1); });
  process.on('unhandledRejection', (reason) => { console.error('unhandledRejection', reason); process.exit(1); });
}

start().catch(err => { console.error('Failed to start socket server', err); process.exit(1); });
