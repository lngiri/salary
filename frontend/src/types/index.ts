export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'PROBATION' | 'INTERN' | 'TEMPORARY';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type DocumentType = 'CITIZENSHIP' | 'PASSPORT' | 'PHOTO' | 'CONTRACT' | 'OFFER_LETTER' | 'RESUME' | 'OTHER';

export interface Employee {
  id: number;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  pan: string;
  ssfId?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  designation: string;
  department?: string;
  employmentType?: EmploymentType;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  nationality?: string;
  citizenshipNo?: string;
  photoUrl?: string;
  bankName?: string;
  bankAccountNo?: string;
  status: EmployeeStatus;
  reasonForLeaving?: string;
  createdAt: string;
  updatedAt: string;
  salaryStructures?: EmployeeSalaryStructure[];
  emergencyContacts?: EmergencyContact[];
  educationRecords?: Education[];
  workHistories?: WorkHistory[];
  documents?: EmployeeDocument[];
  leaveRecords?: LeaveRecord[];
}

export interface EmployeeListItem {
  id: number;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  pan: string;
  designation: string;
  department?: string;
  employmentType?: EmploymentType;
  status: EmployeeStatus;
}

export interface EmergencyContact {
  id: number;
  employeeId: number;
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface Education {
  id: number;
  employeeId: number;
  degree: string;
  institution: string;
  board?: string;
  yearPassed?: number;
  grade?: string;
}

export interface WorkHistory {
  id: number;
  employeeId: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}

export interface EmployeeDocument {
  id: number;
  employeeId: number;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
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
  monthlyAmount: number;
  effectiveFrom: string;
  effectiveUntil?: string | null;
}

export interface FiscalYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  taxSlabs?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollPeriod {
  id: number;
  fiscalYearId: number;
  fiscalYear?: FiscalYear;
  periodStart: string;
  periodEnd: string;
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollTransaction {
  id: number;
  payrollPeriodId: number;
  employeeId: number;
  salaryHeadId: number;
  salaryHead?: SalaryHead;
  amount: number;
  isEmployerContribution: boolean;
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

export interface LeaveRecord {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysTaken: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}
