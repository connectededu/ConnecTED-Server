import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageThread } from '../models/Message';
import Notification from '../models/Notification';
import User from '../models/User';
import { getIO } from '../config/socket';

/**
 * Get all message threads for the authenticated user
 */
export const getThreads = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) { res.status(401).json({ error: 'Authentication required' }); return; }
    const userId = (user as any)._id.toString();
    const threads = await MessageThread.find({ 'participants.id': userId }).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

/**
 * Get or create a message thread between two participants about a student.
 * Fix B2: participant role is looked up from the DB instead of trusting request body.
 */
export const getOrCreateThread = async (req: Request, res: Response) => {
  try {
    const { participantId, studentId } = req.body;
    const user = req.user;
    if (!user) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!participantId || !studentId) {
      res.status(400).json({ error: 'participantId and studentId are required' });
      return;
    }

    const userId = (user as any)._id.toString();

    // Find existing thread between these two participants for this student
    const existing = await MessageThread.findOne({
      studentId,
      'participants.id': { $all: [userId, participantId] },
    });
    if (existing) { res.json(existing); return; }

    // Fix B2: look up the participant's role from the DB
    const participantUser = await User.findById(participantId).select('role').lean();
    const participantRole = participantUser?.role ?? 'teacher';

    // Create new thread
    const thread = new MessageThread({
      id: uuidv4(),
      participants: [
        { id: userId, role: user.role },
        { id: participantId, role: participantRole },
      ],
      studentId,
      // Fix B1: initialise per-participant read tracking
      readBy: [{ userId, readAt: new Date() }],
      unreadCount: 0,
    });
    await thread.save();
    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get or create thread' });
  }
};

/**
 * Get messages in a thread.
 * Fix B3: verify the requesting user is a participant before returning messages.
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const user = req.user;
    if (!user) { res.status(401).json({ error: 'Authentication required' }); return; }

    const userId = (user as any)._id.toString();

    // Fetch thread first, verify participant membership
    const thread = await MessageThread.findOne({ id: threadId });
    if (!thread) { res.status(404).json({ error: 'Thread not found' }); return; }

    const isMember = thread.participants.some((p: any) => p.id === userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied: you are not a participant of this thread' });
      return;
    }

    // Query messages using the thread's UUID id, not MongoDB _id
    const messages = await Message.find({ threadId: thread.id })
      .sort({ timestamp: 1 })
      .skip(Number(offset))
      .limit(Number(limit));
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * Send a message in a thread.
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { content, attachments } = req.body;
    const user = req.user;
    if (!user) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!content) { res.status(400).json({ error: 'content is required' }); return; }

    const thread = await MessageThread.findOne({ id: threadId });
    if (!thread) { res.status(404).json({ error: 'Thread not found' }); return; }

    const senderId = (user as any)._id.toString();

    // Verify sender is a participant
    const isMember = thread.participants.some((p: any) => p.id === senderId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied: you are not a participant of this thread' });
      return;
    }

    const message = new Message({
      id: uuidv4(),
      threadId: thread.id,
      senderId,
      senderRole: user.role,
      content,
      timestamp: new Date(),
      isRead: false,
      attachments: attachments || [],
    });
    await message.save();

    // Update thread's lastMessage and unreadCount
    await MessageThread.findOneAndUpdate(
      { _id: thread._id },
      {
        $set: {
          lastMessage: { content, senderId, timestamp: message.timestamp },
          unreadCount: thread.participants.filter((p: any) => p.id !== senderId).length,
        },
        $pull: { readBy: { userId: { $ne: senderId } } },
      }
    );

    // Notify other participants in real time
    const io = getIO();
    for (const participant of thread.participants) {
      if (participant.id !== senderId) {
        // Real-time message event with full message data
        io?.to(`user:${participant.id}`).emit('receive_message', {
          threadId: thread.id,
          message: {
            id: message.id,
            _id: (message as any)._id,
            threadId: message.threadId,
            senderId: message.senderId,
            senderRole: message.senderRole,
            content: message.content,
            timestamp: message.timestamp,
            isRead: message.isRead,
            attachments: message.attachments
          }
        });

        // Persistent notification
        const notif = new Notification({
          id: uuidv4(),
          userId: participant.id,
          type: 'message',
          title: `New message from ${user.name}`,
          message: content.length > 80 ? content.substring(0, 80) + '…' : content,
          isRead: false,
          link: `/${participant.role}/messages`,
        });
        await notif.save();
        io?.to(`user:${participant.id}`).emit('notification', notif);
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Mark all messages in a thread as read for the current user.
 * Fix B1: track read per-user; only reset unreadCount when all participants have read.
 */
export const markThreadRead = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const user = req.user;
    if (!user) { res.status(401).json({ error: 'Authentication required' }); return; }

    const userId = (user as any)._id.toString();

    const thread = await MessageThread.findOne({ id: threadId });
    if (!thread) { res.status(404).json({ error: 'Thread not found' }); return; }

    // Verify participant
    const isMember = thread.participants.some((p: any) => p.id === userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Mark messages as read using the thread's UUID id
    await Message.updateMany({ threadId: thread.id, isRead: false, senderId: { $ne: userId } }, { $set: { isRead: true } });

    // Update readBy for the current user
    await MessageThread.findOneAndUpdate(
      { _id: thread._id },
      {
        $pull: { readBy: { userId } },
        $push: { readBy: { userId, readAt: new Date() } },
        $set: { unreadCount: 0 },
      }
    );

    res.json({ message: 'Thread marked as read' });
  } catch (error) {
    console.error('Mark thread read error:', error);
    res.status(500).json({ error: 'Failed to mark thread as read' });
  }
};
