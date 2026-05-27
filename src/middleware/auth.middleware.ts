import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User, { IUser } from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      firebaseUser?: {
        uid: string;
        email?: string;
      };
    }
  }
}

/**
 * Verify Firebase ID token from Authorization header
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token = '';
  let isSessionCookie = false;

  if (req.cookies && req.cookies.session) {
    token = req.cookies.session;
    isSessionCookie = true;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No token or session provided' });
    return;
  }

  try {
    let decodedToken;
    let authHeaderToken = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authHeaderToken = authHeader.split('Bearer ')[1];
    }

    if (isSessionCookie) {
      try {
        decodedToken = await auth.verifySessionCookie(token, true);
      } catch (cookieError) {
        // If cookie fails, fallback to Bearer token if available
        if (authHeaderToken) {
          decodedToken = await auth.verifyIdToken(authHeaderToken);
        } else {
          throw cookieError;
        }
      }
    } else {
      decodedToken = await auth.verifyIdToken(token);
    }

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    // Fetch user from MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token or session' });
  }
};

/**
 * Require specific roles for access
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Access denied',
        message: `Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Require user account to be approved
 */
export const requireApproval = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isApproved) {
    res.status(403).json({ 
      error: 'Account pending approval',
      message: 'Your account is awaiting admin approval'
    });
    return;
  }

  next();
};

