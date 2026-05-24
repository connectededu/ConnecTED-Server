import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import apiRoutes from './routes'
import { seedDefaultLogins } from './scripts/create-default-logins'

const app = express()

const allowedOrigins = [
	process.env.CLIENT_URL,
	'http://localhost:5173',
	'http://localhost:8080',
	'http://localhost:4173',
	'http://localhost:3000',
	"http://192.168.0.122:4173/"
].filter(Boolean) as string[]


// Middleware
app.disable('etag')
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
})
app.use(helmet())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.json())
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true
	})
)

// Routes
app.use('/api', apiRoutes)

// Temporary endpoint to seed default users in free mode without shell
app.get('/api/seed-default-logins', async (req, res) => {
	try {
		await seedDefaultLogins();
		res.status(200).json({ message: 'Default logins seeded successfully!' });
	} catch (error: any) {
		console.error('Error seeding data via API:', error);
		res.status(500).json({ error: 'Failed to seed data', details: error?.message || String(error) });
	}
});

export default app
