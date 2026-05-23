import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { auth } from './firebase';
import User from '../models/User';

let io: SocketServer | null = null;

// Socket user mapping
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:8080' || "http://192.168.0.122:4173/",
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decodedToken = await auth.verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.isApproved) {
        return next(new Error('Account pending approval'));
      }

      // Attach user to socket
      socket.data.user = user;
      socket.data.userId = user._id.toString();
      socket.data.role = user.role;

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    console.log(`User connected: ${userId} (${role})`);

    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // Join role-based room
    socket.join(`role:${role}`);

    // Admin-specific room
    if (role === 'admin') {
      socket.join('admins');
    }

    // Update user online status
    await User.findByIdAndUpdate(userId, { 
      isOnline: true, 
      lastActiveAt: new Date() 
    });

    // Broadcast online status
    io!.emit('user:online', { userId });

    // Handle joining class rooms
    socket.on('join:class', (classId: string) => {
      socket.join(`class:${classId}`);
      console.log(`User ${userId} joined class room: ${classId}`);
    });

    // Handle leaving class rooms
    socket.on('leave:class', (classId: string) => {
      socket.leave(`class:${classId}`);
      console.log(`User ${userId} left class room: ${classId}`);
    });

    // Handle direct message room
    socket.on('join:thread', (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('leave:thread', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('typing:start', {
        userId,
        threadId: data.threadId,
      });
    });

    socket.on('typing:stop', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('typing:stop', {
        userId,
        threadId: data.threadId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);

      // Remove socket from user's set
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If no more sockets for this user, mark offline
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          
          await User.findByIdAndUpdate(userId, { 
            isOnline: false, 
            lastActiveAt: new Date() 
          });

          io!.emit('user:offline', { userId });
        }
      }
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = (): SocketServer | null => io;


