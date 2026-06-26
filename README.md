# Nepal Salary Sheet Application

A production-ready web application for managing employee salaries, payroll processing, and statutory deductions compliant with Nepal's labor and tax regulations.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React, TypeScript, Vite, TailwindCSS |
| Backend     | Node.js, Express, TypeScript        |
| Database    | PostgreSQL with Prisma ORM          |
| Auth        | JWT (JSON Web Tokens)               |
| Deployment  | Docker, Docker Compose              |

## Features

- **Employee Management** - Add, edit, view, and delete employee records
- **Salary Structures** - Configure allowances, deductions, and pay grades
- **Payroll Run** - Process monthly salaries with automated calculations
- **TDS Calculation** - Tax Deducted at Source per Income Tax Act 2058
- **SSF Contribution** - Social Security Fund per Social Security Act 2075
- **Reports** - Generate salary slips, summary reports, and export data

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## Quick Start

```bash
# Start all services
docker compose up --build

# Access the application
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
```

## Environment Variables

| Variable           | Description                          | Default Value                    |
|--------------------|--------------------------------------|----------------------------------|
| `NODE_ENV`         | Environment mode                     | `development`                    |
| `PORT`             | Backend server port                  | `5000`                           |
| `DATABASE_URL`     | PostgreSQL connection string         | `postgresql://postgres:postgres123@postgres:5432/salary_db` |
| `JWT_SECRET`       | Secret key for JWT signing           | `nepal-salary-app-secret-key`    |
| `POSTGRES_USER`    | PostgreSQL username                  | `postgres`                       |
| `POSTGRES_PASSWORD`| PostgreSQL password                  | `postgres123`                    |
| `POSTGRES_DB`      | PostgreSQL database name             | `salary_db`                      |

## Seeded Data

The database is automatically seeded with:

- **Admin Account**: `admin` / `admin123`
- **Employees**: 20 sample employees with varied salary structures
- **Fiscal Year**: FY 2081/82 (BS)

## Development Setup (Optional)

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - User login, returns JWT token

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Payroll
- `GET /api/payroll/run` - Run payroll for a period
- `GET /api/payroll/employees/:employeeId` - Get payroll for employee
- `GET /api/payroll/slip/:id` - Generate salary slip
- `GET /api/payroll/summary` - Get payroll summary report

### Salary Structures
- `GET /api/salary-structures` - List salary structures
- `POST /api/salary-structures` - Create salary structure

### Reports
- `GET /api/reports/monthly` - Monthly payroll report
- `GET /api/reports/annual` - Annual payroll summary

## Nepal Compliance Notes

### Income Tax Act 2058
- TDS rates applied as per salary brackets
- Annual tax settlement support
- Rebates and exemptions handling

### Social Security Act 2075
- Employee contribution: 10% of basic salary (capped at NPR 750/month)
- Employer contribution: 20% of basic salary (capped at NPR 1500/month)
- Managed through Social Security Fund

### Labour Act 2074
- Festival bonus: 8.33% of basic salary per festival
- Gratuity calculation support
- Leave encashment calculations

---

**Fiscal Year**: 2081/82 (Bikram Sambat) | **Currency**: NPR