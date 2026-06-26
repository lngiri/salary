import { calculateSsfContributions, buildSsfTransactions, FiscalYear } from '../payroll';

/**
 * FY with SSF rates matching test requirements:
 * - ssfEmployeeRate = 0.10 (10%)
 * - ssfEmployerRate = 0.10 (10%)
 * - Sub-head percentages split the total contribution and sum to 100%
 */
const FY_TEST: FiscalYear = {
  ssfEmployeeRate: 0.10,
  ssfEmployerRate: 0.10,
  ssfMedicalPct: 5,
  ssfAccidentPct: 1.6,
  ssfDependentPct: 6.18,
  ssfPensionPct: 87.22,
  ssfProvidentFundPct: 0,
  overtimeRateMultiplier: 1.5,
  maxOvertimeHoursPerDay: 4,
  maxOvertimeHoursPerWeek: 24,
};

describe('calculateSsfContributions', () => {
  const basicSalary = 50000;

  it('employeeTotal = 5000 (basicSalary * ssfEmployeeRate)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employeeTotal).toBe(5000);
  });

  it('medical = 250.00 (5000 * 5 / 100)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employeeBreakdown.medical).toBe(250);
    expect(result.employerBreakdown.medical).toBe(250);
  });

  it('accident = 80.00 (5000 * 1.6 / 100)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employeeBreakdown.accident).toBe(80);
    expect(result.employerBreakdown.accident).toBe(80);
  });

  it('dependent = 309.00 (5000 * 6.18 / 100)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employeeBreakdown.dependent).toBe(309);
    expect(result.employerBreakdown.dependent).toBe(309);
  });

  it('pension = 4361.00 (5000 * 87.22 / 100)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employeeBreakdown.pension).toBe(4361);
    expect(result.employerBreakdown.pension).toBe(4361);
  });

  it('sum of breakdown = 5000 (employeeTotal)', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    const sum = Object.values(result.employeeBreakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(5000);
  });

  it('employerTotal equals employeeTotal when rates are equal', () => {
    const result = calculateSsfContributions(basicSalary, FY_TEST);
    expect(result.employerTotal).toBe(result.employeeTotal);
  });
});

describe('buildSsfTransactions', () => {
  it('returns 2 rows with correct isEmployerContribution flags', () => {
    const salaryHeadsByName: Record<string, { id: number; name: string }> = {
      'SSF Employee': { id: 10, name: 'SSF Employee' },
      'SSF Employer': { id: 11, name: 'SSF Employer' },
    };

    const transactions = buildSsfTransactions(
      1,        // employeeId
      5,        // payrollPeriodId
      50000,    // basicSalary
      FY_TEST,
      salaryHeadsByName
    );

    expect(transactions).toHaveLength(2);

    const employeeTx = transactions.find(t => t.isEmployerContribution === false);
    expect(employeeTx).toBeDefined();
    expect(employeeTx?.salaryHeadId).toBe(10);
    expect(employeeTx?.amount).toBe(5000);
    expect(employeeTx?.employeeId).toBe(1);
    expect(employeeTx?.payrollPeriodId).toBe(5);

    const employerTx = transactions.find(t => t.isEmployerContribution === true);
    expect(employerTx).toBeDefined();
    expect(employerTx?.salaryHeadId).toBe(11);
    expect(employerTx?.amount).toBe(5000);
    expect(employerTx?.employeeId).toBe(1);
    expect(employerTx?.payrollPeriodId).toBe(5);
  });

  it('returns empty array when SSF salary heads not found', () => {
    const transactions = buildSsfTransactions(
      1,
      5,
      50000,
      FY_TEST,
      {}
    );
    expect(transactions).toHaveLength(0);
  });
});