import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Attempt to initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let credential;

    // 1. Try environment variables (preferred for production/CI)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Firebase: Initializing with environment variables');
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      } as admin.ServiceAccount);
    } 
    // 2. Fallback to service account file (common for local dev)
    else {
      const saPath = process.env.NODE_ENV === 'production'
        ? '/etc/secrets/serverAccountKey.json'
        : path.resolve(process.cwd(), 'config', 'serverAccountKey.json');

      if (fs.existsSync(saPath)) {
        console.log(`Firebase: Initializing with service account file at ${saPath}`);
        credential = admin.credential.cert(saPath);
      } else {
        console.warn('Firebase: No credentials found (env or file). Some features may fail.');
      }
    }

    if (credential) {
      admin.initializeApp({ credential });
    }
  } catch (error) {
    console.error('Firebase: Failed to initialize Admin SDK:', error);
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();

export default admin;
