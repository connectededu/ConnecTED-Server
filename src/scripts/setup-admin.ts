
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import dns from 'node:dns/promises';

// Fix for querySrv ECONNREFUSED
dns.setServers(['1.1.1.1', '1.0.0.1']);

dotenv.config();

// Initialize Firebase Admin
const initializeFirebase = () => {
    if (admin.apps.length) return;

    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            } as admin.ServiceAccount)
        });
        console.log('Firebase initialized');
    } else {
        console.error('Missing Firebase credentials in .env');
        process.exit(1);
    }
};

const setupAdmin = async () => {
    const adminEmail = 'admin@lynxnet.com';
    const adminPassword = 'Testing@123';
    const adminName = 'Lynxnet Administrator';

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('Connected to MongoDB');

        // 2. Initialize Firebase
        initializeFirebase();

        // 3. Check if user already exists in Firebase
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(adminEmail);
            console.log('Admin already exists in Firebase');
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating admin in Firebase...');
                firebaseUser = await admin.auth().createUser({
                    email: adminEmail,
                    password: adminPassword,
                    displayName: adminName,
                });
                console.log('Admin created in Firebase');
            } else {
                throw error;
            }
        }

        // 4. Check if user already exists in MongoDB
        let mongoUser = await User.findOne({ email: adminEmail });
        if (!mongoUser) {
            console.log('Creating admin in MongoDB...');
            mongoUser = new User({
                firebaseUid: firebaseUser.uid,
                email: adminEmail,
                name: adminName,
                role: 'admin',
                isApproved: true,
                adminData: {
                    department: 'Central Administration'
                }
            });
            await mongoUser.save();
            console.log('Admin created in MongoDB');
        } else {
            // Ensure fields are correct
            mongoUser.role = 'admin';
            mongoUser.isApproved = true;
            mongoUser.firebaseUid = firebaseUser.uid;
            await mongoUser.save();
            console.log('Admin updated in MongoDB');
        }

        console.log('-----------------------------------');
        console.log('Admin Setup Complete!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

setupAdmin();
