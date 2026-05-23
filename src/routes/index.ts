import express from 'express';

import authRoutes from './auth';
import userRoutes from './users';
import studentRoutes from './students';
import classRoutes from './classes';
import announcementsRoutes from './announcements';
import eventsRoutes from './events';
import attendanceRoutes from './attendance';
import gradesRoutes from './grades';
import homeworkRoutes from './homework';
import messagesRoutes from './messages';
import notificationsRoutes from './notifications';
import auditRoutes from './audit';
import analyticsRoutes from './analytics';
import testRoutes from './test';
import programsRoutes from './programs';
import subjectGroupsRoutes from './subjectGroups';

const router = express.Router();

import mongoose from 'mongoose';

// Health check
router.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'API is healthy' : 'API degraded';
  
  res.status(isDbConnected ? 200 : 503).json({ 
    status,
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date(),
    version: '1.0.0',
  });
});


import { auditMiddleware } from '../middleware/audit.middleware';

// Mount routes
router.use(auditMiddleware);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/programs', programsRoutes);
router.use('/subject-groups', subjectGroupsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/events', eventsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/grades', gradesRoutes);
router.use('/homework', homeworkRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit', auditRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/test', testRoutes);

export default router;

