import { calculateOvertime } from '../payroll';

const mockFiscalYear = {
  ssfEmployeeRate: 0.1,
  ssfEmployerRate: 0.1,
  ssfMedicalPct: 10,
  ssfPensionPct: 50,
  ssfAccidentPct: 12,
  ssfDependentPct: 3,
  ssfProvidentFundPct: 20,
  overtimeRateMultiplier: 1.5,
  maxOvertimeHoursPerDay: 4,
  maxOvertimeHoursPerWeek: 20,
};

describe('calculateOvertime', () => {
  it('calculates overtime correctly: basic=30000, DA=5000, hours=3, multiplier=1.5', () => {
    const result = calculateOvertime(30000, 5000, 3, mockFiscalYear);
    // hourlyRate = (30000 + 5000) / 240 = 145.8333
    // amount = 145.8333 * 1.5 * 3 = 656.25
    expect(result.amount).toBe(656.25);
    expect(result.warnings).toHaveLength(0);
  });

  it('verifies calculation formula: basic=30000, DA=5000, hours=10, multiplier=1.5', () => {
    const result = calculateOvertime(30000, 5000, 10, mockFiscalYear);
    // hourlyRate = (30000 + 5000) / 240 = 145.8333
    // amount = 145.8333 * 1.5 * 10 = 2187.5
    expect(result.amount).toBe(2187.5);
    // 10 hours exceeds daily limit of 4
    expect(result.warnings).toContain('Overtime exceeds daily limit of 4 hours');
  });

  it('warns when overtime exceeds daily limit', () => {
    const result = calculateOvertime(30000, 5000, 10, mockFiscalYear);
    expect(result.warnings).toContain('Overtime exceeds daily limit of 4 hours');
  });

  it('warns when overtime exceeds weekly limit', () => {
    const result = calculateOvertime(30000, 5000, 25, mockFiscalYear);
    expect(result.warnings).toContain('Overtime exceeds daily limit of 4 hours');
    expect(result.warnings).toContain('Overtime exceeds weekly limit of 20 hours');
  });

  it('returns no warnings when within limits', () => {
    const result = calculateOvertime(30000, 5000, 3, mockFiscalYear);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles zero overtime hours', () => {
    const result = calculateOvertime(30000, 5000, 0, mockFiscalYear);
    expect(result.amount).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });
});