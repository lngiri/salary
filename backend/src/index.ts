import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import salaryStructureRoutes from './routes/salaryStructures';
import payrollRoutes from './routes/payroll';
import salaryHeadRoutes from './routes/salaryHeads';
import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', salaryStructureRoutes);
app.use('/api/payroll', payrollRoutes);
app.use(salaryHeadRoutes);

// Public health check route for Docker/container orchestration
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;