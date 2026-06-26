export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  joinDate: string;
  department: string;
  designation: string;
  employmentType: 'permanent' | 'contract' | 'temporary';
  status: 'active' | 'inactive';
  bankName?: string;
  bankAccountNo?: string;
  pan?: string;
  ssfId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryHead {
  id: number;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  category?: 'basic' | 'allowance' | 'bonus' | 'tax' | 'insurance' | 'provident_fund' | 'other';
  taxable?: boolean;
  ssfApplicable?: boolean;
  isSystem?: boolean;
  legalReference?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeSalaryStructure {
  id: number;
  employeeId: number;
  salaryHeadId: number;
  salaryHead?: SalaryHead;
  amount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FiscalYear {
  id: number;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollPeriod {
  id: number;
  fiscalYearId: number;
  fiscalYear?: FiscalYear;
  month: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollTransaction {
  id: number;
  payrollPeriodId: number;
  employeeId: number;
  employee?: Employee;
  grossSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: 'calculated' | 'approved' | 'paid';
  createdAt?: string;
  updatedAt?: string;
}

export interface PayslipData {
  employee: Employee;
  payrollPeriod: PayrollPeriod;
  earnings: { name: string; amount: number; legalReference?: string | null }[];
  deductions: { name: string; amount: number; legalReference?: string | null }[];
  grossSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

export interface PayrollDetail {
  id: number;
  payrollTransactionId: number;
  employeeSalaryStructureId: number;
  salaryHead?: SalaryHead;
  amount: number;
  payType: 'earning' | 'deduction';
}