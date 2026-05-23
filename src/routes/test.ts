import express from 'express';
import mongoose from 'mongoose';
import { sendEmail } from '../services/email.service';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/test/ping
 * @desc    Basic server connectivity test
 */
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date() });
});

/**
 * @route   GET /api/test/db
 * @desc    Check MongoDB connection status
 */
router.get('/db', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  res.json({ 
    status: states[state as keyof typeof states],
    connection: state === 1 ? 'OK' : 'Error',
    dbName: mongoose.connection.name
  });
});

/**
 * @route   GET /api/test/env
 * @desc    Check if critical environment variables are loaded
 */
router.get('/env', (req, res) => {
  const vars = [
    'NODE_ENV',
    'PORT',
    'MONGO_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'EMAIL_USER',
    'CLIENT_URL'
  ];
  
  const status = vars.reduce((acc, v) => ({
    ...acc,
    [v]: process.env[v] ? 'LOADED' : 'MISSING'
  }), {});
  
  res.json({
    environment: status,
    totalVariablesChecked: vars.length
  });
});

/**
 * @route   POST /api/test/email
 * @desc    Send a test email
 */
router.post('/email', async (req, res) => {
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ error: 'Recipient address (to) is required' });
  }
  
  try {
    const success = await sendEmail({
      to,
      template: 'accountApproved',
      templateData: ['Test User']
    });
    
    if (success) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @route   GET /api/test/auth
 * @desc    Verify if auth headers and token verification work
 */
router.get('/auth', verifyToken, (req, res) => {
  res.json({
    message: 'Token verified successfully',
    firebaseUser: req.firebaseUser,
    mongodbUser: req.user ? {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved
    } : 'Not found in MongoDB'
  });
});

export default router;
