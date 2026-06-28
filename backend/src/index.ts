import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import salaryStructureRoutes from './routes/salaryStructures';
import payrollRoutes from './routes/payroll';
import salaryHeadRoutes from './routes/salaryHeads';
import configRoutes from './routes/config';
import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Enforce required env vars at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

// Security middleware
app.use(helmet());

// CORS: restrict in production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN || 'https://salary-1-d3kg.onrender.com')
  : '*';
app.use(cors({
  origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(','),
  credentials: true,
}));

app.use(express.json());

// Routes
app.use(authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', salaryStructureRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api', salaryHeadRoutes);
app.use('/api/config', configRoutes);

// Public health check route for Docker/container orchestration
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;