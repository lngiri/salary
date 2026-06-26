/**
 * Payroll calculation service — TDS, SSF, overtime, festival bonus, final settlement.
 */

export interface FiscalYear {
  ssfEmployeeRate: number;
  ssfEmployerRate: number;
  ssfMedicalPct: number;
  ssfPensionPct: number;
  ssfAccidentPct: number;
  ssfDependentPct: number;
  ssfProvidentFundPct: number;
  overtimeRateMultiplier: number;
  maxOvertimeHoursPerDay: number;
  maxOvertimeHoursPerWeek: number;
}

export interface TaxSlab {
  limit: number | null;
  rate: number;
  type: string;
}

/**
 * Calculate annual TDS tax using progressive tax slabs.
 * Slabs are applied in order: each slab rate applies to the portion of income
 * within that slab's limit (or remaining income for the final null-limit slab).
 * Rates are percentages (e.g. 10 = 10%), so they are divided by 100.
 */
export function calculateTds(taxableIncome: number, taxSlabs: TaxSlab[]): number {
  let remaining = taxableIncome;
  let tax = 0;

  for (const slab of taxSlabs) {
    if (remaining <= 0) break;

    if (slab.limit === null) {
      // Final slab — applies to all remaining income
      tax += remaining * (slab.rate / 100);
      break;
    }

    const taxableInSlab = Math.min(remaining, slab.limit);
    tax += taxableInSlab * (slab.rate / 100);
    remaining -= taxableInSlab;
  }

  return Math.round(tax);
}

/**
 * Calculate monthly TDS by dividing annual tax by 12.
 */
export function calculateMonthlyTds(taxableIncome: number, taxSlabs: TaxSlab[]): number {
  return Math.round(calculateTds(taxableIncome, taxSlabs) / 12);
}

/**
 * Calculate SSF contributions split into employee and employer portions.
 * Each portion is broken down by sub-head: medical, accident, dependent, pension, provident fund.
 */
export function calculateSsfContributions(
  basicSalary: number,
  fiscalYear: FiscalYear
): {
  employeeTotal: number;
  employerTotal: number;
  employeeBreakdown: { medical: number; accident: number; dependent: number; pension: number; providentFund: number };
  employerBreakdown: { medical: number; accident: number; dependent: number; pension: number; providentFund: number };
} {
  const employeeTotal = Math.round(basicSalary * fiscalYear.ssfEmployeeRate * 100) / 100;
  const employerTotal = Math.round(basicSalary * fiscalYear.ssfEmployerRate * 100) / 100;

  // Sub-head percentages split the total SSF contribution and should sum to 100.
  const calcBreakdown = (total: number) => ({
    medical: Math.round(total * fiscalYear.ssfMedicalPct) / 100,
    accident: Math.round(total * fiscalYear.ssfAccidentPct) / 100,
    dependent: Math.round(total * fiscalYear.ssfDependentPct) / 100,
    pension: Math.round(total * fiscalYear.ssfPensionPct) / 100,
    providentFund: Math.round(total * fiscalYear.ssfProvidentFundPct) / 100,
  });

  const employeeBreakdown = calcBreakdown(employeeTotal);
  const employerBreakdown = calcBreakdown(employerTotal);

  return { employeeTotal, employerTotal, employeeBreakdown, employerBreakdown };
}

/**
 * Build SSF transaction rows for employee and employer contributions.
 */
export function buildSsfTransactions(
  employeeId: number,
  payrollPeriodId: number,
  basicSalary: number,
  fiscalYear: FiscalYear,
  salaryHeadsByName: Record<string, { id: number; name: string }>
): Array<{
  employeeId: number;
  payrollPeriodId: number;
  salaryHeadId: number;
  amount: number;
  isEmployerContribution: boolean;
}> {
  const { employeeTotal, employerTotal } = calculateSsfContributions(basicSalary, fiscalYear);

  const transactions = [];

  if (salaryHeadsByName['SSF Employee']) {
    transactions.push({
      employeeId,
      payrollPeriodId,
      salaryHeadId: salaryHeadsByName['SSF Employee'].id,
      amount: employeeTotal,
      isEmployerContribution: false,
    });
  }

  if (salaryHeadsByName['SSF Employer']) {
    transactions.push({
      employeeId,
      payrollPeriodId,
      salaryHeadId: salaryHeadsByName['SSF Employer'].id,
      amount: employerTotal,
      isEmployerContribution: true,
    });
  }

  return transactions;
}

/**
 * Calculate overtime pay.
 * hourlyRate = (basicSalary + dearnessAllowance) / 240
 * amount = hourlyRate * fiscalYear.overtimeRateMultiplier * overtimeHours
 * Note: weekly validation checks input hours directly (assumes input is weekly total).
 * In a real app, weekly hours would be accumulated from daily entries.
 */
export function calculateOvertime(
  basicSalary: number,
  dearnessAllowance: number,
  overtimeHours: number,
  fiscalYear: FiscalYear
): { amount: number; warnings: string[] } {
  const warnings: string[] = [];
  const hourlyRate = (basicSalary + dearnessAllowance) / 240;
  const amount = Math.round(hourlyRate * fiscalYear.overtimeRateMultiplier * overtimeHours * 100) / 100;

  if (overtimeHours > fiscalYear.maxOvertimeHoursPerDay) {
    warnings.push(`Overtime exceeds daily limit of ${fiscalYear.maxOvertimeHoursPerDay} hours`);
  }

  if (overtimeHours > fiscalYear.maxOvertimeHoursPerWeek) {
    warnings.push(`Overtime exceeds weekly limit of ${fiscalYear.maxOvertimeHoursPerWeek} hours`);
  }

  return { amount, warnings };
}

/**
 * Check if festival bonus (Dashain) is applicable for the given period.
 * Dashain falls around September-October (Asoj/Kartik in Nepali calendar).
 * Returns true if the period overlaps September 15 - November 15.
 */
export function isFestivalBonusApplicable(
  periodStart: Date,
  periodEnd: Date,
  fiscalYear: FiscalYear
): boolean {
  // Dashain period: September 15 to November 15
  const dashainStart = new Date(periodStart.getFullYear(), 8, 15); // September 15
  const dashainEnd = new Date(periodStart.getFullYear(), 10, 15);  // November 15

  // fiscalYear parameter kept for future configurability
  void fiscalYear;

  // Check if any day in [periodStart, periodEnd] falls within dashain range
  return periodStart <= dashainEnd && periodEnd >= dashainStart;
}