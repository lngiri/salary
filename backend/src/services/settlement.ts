import { Employee } from '@prisma/client';
import { intervalToDuration, differenceInDays } from 'date-fns';

export interface SettlementOptions {
  unpaidSalary?: number;
  unusedAnnualLeaveDays?: number;
  leaveEncashmentDailyRateDivisor?: number; // default 26
  gratuityDailyRateDivisor?: number; // default 26
  gratuityDaysPerYear?: number; // default 15
  manualDeductions?: number; // default 0
  maxLeaveAccumulation?: number; // default 30
}

export interface FinalSettlement {
  employee: Employee;
  lastWorkingDate: Date;
  unusedAnnualLeaveDays: number;
  leaveEncashmentDailyRate: number;
  // leave encashment: basic salary / divisor * unused leave days
  leaveEncashment: number;
  completedYears: number;
  gratuityDailyRate: number;
  gratuity: number;
  unpaidSalary: number;
  manualDeductions: number;
  grossSettlement: number;
  netSettlement: number;
}

function getBasicSalaryFromEmployee(employee: any): number {
  if (!employee.salaryStructures || !Array.isArray(employee.salaryStructures)) {
    return 0;
  }
  const activeStructure = employee.salaryStructures.find(
    (s: any) => s.salaryHead?.name === 'Basic' && s.effectiveUntil === null
  );
  return activeStructure?.monthlyAmount ?? 0;
}

function calculateCompletedYears(dateOfJoining: Date, lastWorkingDate: Date): number {
  const totalDays = differenceInDays(lastWorkingDate, dateOfJoining);
  return Math.floor(totalDays / 365.25);
}

export function calculateFinalSettlement(
  employee: any,
  lastWorkingDate: Date,
  options?: SettlementOptions
): FinalSettlement {
  const basicSalary = getBasicSalaryFromEmployee(employee);

  const leaveEncashmentDivisor = options?.leaveEncashmentDailyRateDivisor ?? 26;
  const dailyRate = basicSalary / leaveEncashmentDivisor;

  const maxLeaveAccumulation = options?.maxLeaveAccumulation ?? 30;
  const unusedAnnualLeaveDays = Math.min(
    options?.unusedAnnualLeaveDays ?? 0,
    maxLeaveAccumulation
  );
  const leaveEncashment = dailyRate * unusedAnnualLeaveDays;

  const completedYears = calculateCompletedYears(
    new Date(employee.dateOfJoining),
    lastWorkingDate
  );

  const gratuityDivisor = options?.gratuityDailyRateDivisor ?? 26;
  const gratuityDaysPerYear = options?.gratuityDaysPerYear ?? 15;
  const gratuityDailyRate = basicSalary / gratuityDivisor;
  const gratuity = completedYears >= 1
    ? gratuityDailyRate * gratuityDaysPerYear * completedYears
    : 0;

  const unpaidSalary = options?.unpaidSalary ?? 0;
  const manualDeductions = options?.manualDeductions ?? 0;

  const grossSettlement = unpaidSalary + leaveEncashment + gratuity;
  const netSettlement = grossSettlement - manualDeductions;

  return {
    employee,
    lastWorkingDate,
    unusedAnnualLeaveDays,
    leaveEncashmentDailyRate: Math.round(dailyRate * 100) / 100,
    leaveEncashment: Math.round(leaveEncashment * 100) / 100,
    completedYears,
    gratuityDailyRate: Math.round(gratuityDailyRate * 100) / 100,
    gratuity: Math.round(gratuity * 100) / 100,
    unpaidSalary,
    manualDeductions,
    grossSettlement: Math.round(grossSettlement * 100) / 100,
    netSettlement: Math.round(netSettlement * 100) / 100,
  };
}