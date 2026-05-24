import admin from 'firebase-admin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Student from '../models/Student';
import '../config/firebase'; // Ensures firebase is initialized
import dns from 'node:dns/promises';

// Fix for querySrv ECONNREFUSED
dns.setServers(['1.1.1.1', '1.0.0.1']);

dotenv.config();

const CLEANUP_THRESHOLD_DAYS = 30;

const cleanupUsers = async () => {
    try {
        console.log('--- STARTING USER CLEANUP ---');
        
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('Connected to MongoDB.');

        // 2. Calculate the cutoff date (30 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_THRESHOLD_DAYS);
        console.log(`Searching for unapproved users created before: ${cutoffDate.toISOString()}`);

        // 3. Find users who are unapproved and older than the threshold
        const expiredUsers = await User.find({
            isApproved: false,
            createdAt: { $lt: cutoffDate }
        });

        console.log(`Found ${expiredUsers.length} expired registrations.`);

        for (const user of expiredUsers) {
            console.log(`Cleaning up user: ${user.email} (${user.role})...`);

            // A. Delete from Firebase
            try {
                await admin.auth().deleteUser(user.firebaseUid);
                console.log(`  - Deleted from Firebase Auth.`);
            } catch (fbError: any) {
                if (fbError.code === 'auth/user-not-found') {
                    console.log(`  - User not found in Firebase, skipping auth deletion.`);
                } else {
                    console.error(`  - Error deleting from Firebase:`, fbError.message);
                }
            }

            // B. If parent, check and delete linked student
            if (user.role === 'parent') {
                // Find students where this user is the ONLY parent
                const students = await Student.find({ parentIds: user._id });
                for (const student of students) {
                    if (student.parentIds.length <= 1) {
                        await Student.deleteOne({ _id: student._id });
                        console.log(`  - Deleted student profile: ${student.name} (no other parents linked).`);
                    } else {
                        // Just remove this parent from the list
                        student.parentIds = student.parentIds.filter(id => id.toString() !== user._id.toString());
                        await student.save();
                        console.log(`  - Removed parent reference from student: ${student.name}.`);
                    }
                }
            }

            // C. Delete from MongoDB
            await User.deleteOne({ _id: user._id });
            console.log(`  - Deleted from MongoDB User collection.`);
        }

        console.log('--- CLEANUP COMPLETE ---');
    } catch (error) {
        console.error('CRITICAL ERROR DURING CLEANUP:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

cleanupUsers();
