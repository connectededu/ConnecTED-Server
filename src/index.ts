import dotenv from 'dotenv'
dotenv.config() // Load environment variables first

/* dns solves this error */
// querySrv ECONNREFUSED _mongodb._tcp.kruze.uo3mj7b.mongodb.net
import dns from 'node:dns/promises'
dns.setServers(['1.1.1.1', '1.0.0.1'])


import http from 'http'
import { connectDB } from './config/db'
import app from './app'
import { initializeSocket } from './config/socket'

// Initialized via config/firebase.ts if needed by other imports, 
// but we can ensure it's loaded here if we want to be explicit.
import './config/firebase'

import Logger from './services/logger'

// If behind a proxy (e.g. Render), trust the first proxy for secure cookies and client IPs
app.set('trust proxy', 1)

const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
initializeSocket(server)

// Database Connection
connectDB()

// Start Server
server.listen(PORT, () => {
	Logger.info(`Server running on port ${PORT}`)
	Logger.info(`Socket.IO enabled`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
	Logger.info('SIGTERM received. Shutting down gracefully...')
	server.close(() => {
		Logger.info('Server closed')
		process.exit(0)
	})
})

