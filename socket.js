// socket.js
const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000', // Permitir peticiones desde esta URL
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIo };
