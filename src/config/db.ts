import mongoose from 'mongoose'
import Logger from '../services/logger'

const MONGO_URI = process.env.MONGO_URI

declare global {
	var mongooseConnection: {
		conn: typeof mongoose | null
		promise: Promise<typeof mongoose> | null
	}
}

// Prevent multiple connections in development
let cached = global.mongooseConnection

if (!cached) {
	cached = global.mongooseConnection = { conn: null, promise: null }
}

export const connectDB = async function connectDB() {
	if (cached.conn) {
		return cached.conn
	}

	if (!cached.promise) {
		if (!MONGO_URI) {
			throw new Error('MONGO_URI must be defined')
		}
		cached.promise = mongoose.connect(MONGO_URI, {
			bufferCommands: false,
			maxPoolSize: 50
		})
	}


	try {
		cached.conn = await cached.promise
		Logger.info('✅ Connected to MongoDB')
		return cached.conn
	} catch (error) {
		Logger.error('❌ MongoDB connection error: ' + error)
		Logger.warn('⚠️ Server is running without a successful MongoDB connection.')
	}
}

