
import dotenv from 'dotenv';
dotenv.config();

import dns from 'node:dns/promises';
dns.setServers(['1.1.1.1', '1.0.0.1']);

import mongoose from 'mongoose';
import admin from '../config/firebase';
import { connectDB } from '../config/db';
import User from '../models/User';
import Student from '../models/Student';
import Class from '../models/Class';
import Attendance from '../models/Attendance';
import Grade from '../models/Grade';
import Homework from '../models/Homework';
import { Message, MessageThread } from '../models/Message';
import Announcement from '../models/Announcement';
import Event from '../models/Event';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';

import {
  mockParents, mockTeachers, mockAdmins, mockStudents,
  mockClasses, mockAttendance, mockGrades, mockHomework,
  mockMessageThreads, mockMessages, mockAnnouncements,
  mockEvents, mockNotifications, mockAuditLogs
} from './data';

const mapIdToObjectIdStr = (id: string): string => {
  if (!id) return id;
  if (/^[0-9a-fA-F]{24}$/.test(id)) return id;

  if (id.startsWith('parent-')) {
    const num = id.split('-')[1];
    return `11111111111111111111110${num}`;
  }
  if (id.startsWith('teacher-')) {
    const num = id.split('-')[1];
    return `22222222222222222222220${num}`;
  }
  if (id.startsWith('admin-')) {
    const num = id.split('-')[1];
    return `33333333333333333333330${num}`;
  }
  if (id.startsWith('student-')) {
    const num = id.split('-')[1];
    return `44444444444444444444440${num}`;
  }
  if (id.startsWith('class-')) {
    const num = id.split('-')[1];
    return `55555555555555555555550${num}`;
  }
  if (id.startsWith('thread-')) {
    const num = id.split('-')[1];
    return `66666666666666666666660${num}`;
  }
  if (id.startsWith('msg-')) {
    const num = id.split('-')[1];
    return `77777777777777777777770${num}`;
  }
  if (id.startsWith('hw-')) {
    const num = id.split('-')[1];
    return `88888888888888888888880${num}`;
  }
  if (id.startsWith('grade-')) {
    const num = id.split('-')[1];
    return `99999999999999999999990${num}`;
  }
  if (id.startsWith('att-')) {
    const num = id.split('-')[1];
    return `aaaaaaaaaaaaaaaaaaaaaa0${num}`;
  }
  if (id.startsWith('ann-')) {
    const num = id.split('-')[1];
    return `bbbbbbbbbbbbbbbbbbbbbb0${num}`;
  }
  if (id.startsWith('event-')) {
    const num = id.split('-')[1];
    return `cccccccccccccccccccccc0${num}`;
  }
  if (id.startsWith('notif-')) {
    const num = id.split('-')[1];
    return `dddddddddddddddddddddd0${num}`;
  }
  if (id.startsWith('update-')) {
    const num = id.split('-')[1];
    return `eeeeeeeeeeeeeeeeeeeeee0${num}`;
  }
  if (id.startsWith('audit-') || id.startsWith('log-')) {
    const num = id.split('-')[1];
    return `ffffffffffffffffffffff0${num}`;
  }
  return id;
};

const mapIds = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapIds);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key === 'id') {
        result._id = mapIdToObjectIdStr(val);
        result.id = mapIdToObjectIdStr(val);
      } else if (key === 'studentId' || key === 'classId' || key === 'teacherId' || key === 'parentId' || key === 'threadId' || key === 'senderId') {
        result[key] = typeof val === 'string' ? mapIdToObjectIdStr(val) : val;
      } else if (key === 'studentIds' || key === 'classIds' || key === 'teacherIds' || key === 'parentIds') {
        result[key] = Array.isArray(val) ? val.map(mapIdToObjectIdStr) : val;
      } else if (key === 'participants') {
        result[key] = Array.isArray(val) ? val.map((p: any) => ({ ...p, id: mapIdToObjectIdStr(p.id) })) : val;
      } else if (key === 'lastMessage' && val) {
        result[key] = { ...val, senderId: mapIdToObjectIdStr(val.senderId) };
      } else if (typeof val === 'object') {
        result[key] = mapIds(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
  return obj;
};

const importData = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected...');

    // Clear all existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Attendance.deleteMany({});
    await Grade.deleteMany({});
    await Homework.deleteMany({});
    await Message.deleteMany({});
    await MessageThread.deleteMany({});
    await Announcement.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Data Cleared...');

    // Insert Users
    const users = mapIds([...mockParents, ...mockTeachers, ...mockAdmins]);
    await User.insertMany(users);
    console.log(`Imported ${users.length} Users`);

    // Ensure all seeded active users are registered in Firebase Auth
    console.log('Registering active seeded users in Firebase Auth...');
    const activeUsers = users.filter((u: any) => u.isApproved === true);
    for (const u of activeUsers) {
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUserByEmail(u.email);
          console.log(`Firebase user already exists for ${u.email} with UID: ${fbUser.uid}`);
          
          // Recreate if the UID does not match u.firebaseUid to maintain seeding consistency
          if (fbUser.uid !== u.firebaseUid) {
            console.log(`UID mismatch for ${u.email} (${fbUser.uid} vs ${u.firebaseUid}). Deleting and recreating...`);
            await admin.auth().deleteUser(fbUser.uid);
            throw { code: 'auth/user-not-found' };
          }
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            console.log(`Creating Firebase login for seeded active user: ${u.email}`);
            fbUser = await admin.auth().createUser({
              uid: u.firebaseUid,
              email: u.email,
              password: 'Testing@123',
              displayName: u.name
            });
            console.log(`Created Firebase user for ${u.email} with UID: ${fbUser.uid}`);
          } else {
            throw err;
          }
        }

        // Set approved custom claims
        await admin.auth().setCustomUserClaims(fbUser.uid, { approved: true });
        console.log(`Claims set for ${u.email}: approved=true`);
      } catch (fbErr) {
        console.error(`Failed to register ${u.email} in Firebase:`, fbErr);
      }
    }

    // Insert Students
    const students = mapIds(mockStudents);
    await Student.insertMany(students);
    console.log(`Imported ${mockStudents.length} Students`);

    // Insert Classes
    const classes = mapIds(mockClasses);
    await Class.insertMany(classes);
    console.log(`Imported ${mockClasses.length} Classes`);

    // Insert Announcements
    const announcements = mapIds(mockAnnouncements);
    await Announcement.insertMany(announcements);
    console.log(`Imported ${mockAnnouncements.length} Announcements`);

    // Insert Events
    const events = mapIds(mockEvents);
    await Event.insertMany(events);
    console.log(`Imported ${mockEvents.length} Events`);

    console.log('Data Import Success!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

importData();
