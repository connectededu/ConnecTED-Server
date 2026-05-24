import admin, { getAuth } from '../config/firebase'
import User from '../models/User'

const usersToCreate = [
	{
		email: 'admin@connected.com',
		password: 'Testing@123',
		name: 'Principal Anderson',
		role: 'admin' as const,
		isApproved: true,
		adminData: { department: 'Administration' },
		uid: 'admin-1-uid',
		_id: '333333333333333333333301'
	},
	{
		email: 'teacher@connected.com',
		password: 'Testing@123',
		name: 'John Smith',
		role: 'teacher' as const,
		isApproved: true,
		teacherData: {
			staffId: 'TCH-001',
			subjects: ['Mathematics', 'Science'],
			yearsOfExperience: 8,
			classIds: ['555555555555555555555501', '555555555555555555555502']
		},
		uid: 'teacher-1-uid',
		_id: '222222222222222222222201'
	},
	{
		email: 'parent@connected.com',
		password: 'Testing@123',
		name: 'Sarah Johnson',
		role: 'parent' as const,
		isApproved: true,
		parentData: {
			relationship: 'Mother' as const,
			studentIds: ['444444444444444444444401', '444444444444444444444402'],
			emergencyContact: {
				name: 'Michael Johnson',
				phone: '+1 555-0102',
				relationship: 'Father'
			}
		},
		uid: 'parent-1-uid',
		_id: '111111111111111111111101'
	}
]

export const seedDefaultLogins = async () => {
	try {
		for (const u of usersToCreate) {
			console.log(`\nProcessing user: ${u.email} (${u.role})...`)
			
			// 1. Handle Firebase Auth User
			let fbUser;
			try {
				fbUser = await getAuth().getUserByEmail(u.email)
				console.log(`User already exists in Firebase. Deleting to recreate fresh...`)
				await getAuth().deleteUser(fbUser.uid)
				console.log(`Deleted user from Firebase.`)
			} catch (err: any) {
				if (err.code !== 'auth/user-not-found') {
					throw err
				}
			}

			console.log(`Creating user in Firebase...`)
			fbUser = await getAuth().createUser({
				uid: u.uid,
				email: u.email,
				password: u.password,
				displayName: u.name
			})
			console.log(`Created user in Firebase with UID: ${fbUser.uid}`)

			// 2. Handle MongoDB User Document
			console.log(`Deleting existing MongoDB document for ${u.email} or UID ${fbUser.uid}...`)
			await User.deleteOne({ $or: [{ email: u.email }, { firebaseUid: fbUser.uid }, { _id: u._id }] })

			console.log(`Creating user record in MongoDB...`)
			const dbUser = new User({
				_id: u._id,
				firebaseUid: fbUser.uid,
				email: u.email,
				name: u.name,
				role: u.role,
				isApproved: u.isApproved,
				...(u.role === 'admin' ? { adminData: u.adminData } : {}),
				...(u.role === 'teacher' ? { teacherData: u.teacherData } : {}),
				...(u.role === 'parent' ? { parentData: u.parentData } : {})
			})
			await dbUser.save()
			console.log(`Saved MongoDB document for ${u.email}.`)
		}

		console.log('\n--- ALL DEFAULT LOGINS SETUP COMPLETE ---')
		for (const u of usersToCreate) {
			console.log(`Role: ${u.role.toUpperCase()}`)
			console.log(`  Email: ${u.email}`)
			console.log(`  Password: ${u.password}`)
		}
	} catch (err) {
		console.error('CRITICAL ERROR DURING SETUP:', err)
		throw err;
	}
}

async function run() {
	// Only used when script is run directly from the CLI — import mongoose here
	const dns = await import('node:dns/promises')
	const mongoose = await import('mongoose')
	const dotenv = await import('dotenv')
	dotenv.default.config()

	// Fix for MongoDB Atlas SRV DNS resolution issues on some environments
	dns.default.setServers(['1.1.1.1', '1.0.0.1'])

	try {
		console.log('Connecting to MongoDB...')
		await mongoose.default.connect(process.env.MONGO_URI!)
		console.log('Connected to MongoDB.')
		console.log('Firebase Admin SDK already initialized via config/firebase.')
		await seedDefaultLogins();
	} catch (err) {
		console.error('FATAL ERROR:', err)
	} finally {
		await mongoose.default.disconnect()
		console.log('Disconnected from MongoDB.')
		process.exit()
	}
}

// Only run automatically if called directly from CLI
if (require.main === module) {
	run()
}
