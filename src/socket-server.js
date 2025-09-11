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
  out.senderId = out.sender && (out.sender._id || out.sender.id) ? String(out.sender._id || out.sender.id) : (out.sender || null);
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

    socket.on('deleteMessage', async (payload, ack) => {
      try {
        const { messageId } = payload || {};
        if (!messageId) {
          if (typeof ack === 'function') ack({ success: false, message: 'Missing messageId' });
          return;
        }
        const msg = await ChatMessage.findById(messageId).lean();
        if (!msg) {
          if (typeof ack === 'function') ack({ success: false, message: 'Message not found' });
          return;
        }
        const userId = socket.user ? socket.user.userId : null;
        // compute sender id robustly: msg.sender may be ObjectId or populated
        const senderId = msg.sender && msg.sender._id ? String(msg.sender._id) : String(msg.sender);
        console.log('socket deleteMessage attempt', { messageId, requester: userId, senderId });
        if (!userId || String(senderId) !== String(userId)) {
          console.warn('socket deleteMessage forbidden', { messageId, requester: userId, senderId });
          if (typeof ack === 'function') ack({ success: false, message: 'Forbidden' });
          return;
        }
        const deleted = await ChatMessage.findByIdAndDelete(messageId);
        console.log('socket deleteMessage deleted', { messageId, deleted: !!deleted });
        // broadcast deletion to room
        // need cityName
        const cityDoc = await City.findById(msg.city).lean();
        const room = `${cityDoc?.cityName || 'unknown'}::${msg.groupName}`;
        const out = { id: messageId, cityName: cityDoc?.cityName, groupName: msg.groupName };
        io.to(room).emit('deleteMessage', out);
        if (typeof ack === 'function') ack({ success: true, data: out });
      } catch (err) {
        console.error('socket deleteMessage error', err);
        if (typeof ack === 'function') ack({ success: false, message: err.message });
      }
    });

    // lightweight announce used by clients after they successfully delete via HTTP
    socket.on('announceDelete', (payload) => {
      try {
        const { id, cityName, groupName } = payload || {};
        if (!id) return;
        const room = `${cityName || 'unknown'}::${groupName || 'Open Chat'}`;
        const out = { id, cityName, groupName };
        io.to(room).emit('deleteMessage', out);
      } catch (err) {
        console.error('announceDelete handling error', err);
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
