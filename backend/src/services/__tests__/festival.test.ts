import { isFestivalBonusApplicable } from '../payroll';

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

describe('isFestivalBonusApplicable', () => {
  it('returns true for September 1-30 (overlaps dashain)', () => {
    const periodStart = new Date(2024, 8, 1);  // Sep 1
    const periodEnd = new Date(2024, 8, 30);   // Sep 30
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(true);
  });

  it('returns false for December 1-31 (no overlap with dashain)', () => {
    const periodStart = new Date(2024, 11, 1);  // Dec 1
    const periodEnd = new Date(2024, 11, 31);   // Dec 31
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(false);
  });

  it('returns true for October full month', () => {
    const periodStart = new Date(2024, 9, 1);   // Oct 1
    const periodEnd = new Date(2024, 9, 31);    // Oct 31
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(true);
  });

  it('returns true for period spanning Nov 1-15 (edge case)', () => {
    const periodStart = new Date(2024, 10, 1);  // Nov 1
    const periodEnd = new Date(2024, 10, 15);   // Nov 15
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(true);
  });

  it('returns false for period before dashain (January)', () => {
    const periodStart = new Date(2024, 0, 1);   // Jan 1
    const periodEnd = new Date(2024, 0, 31);    // Jan 31
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(false);
  });

  it('returns false for period after dashain (January next year)', () => {
    const periodStart = new Date(2025, 0, 1);   // Jan 2025
    const periodEnd = new Date(2025, 0, 31);    // Jan 31 2025
    expect(isFestivalBonusApplicable(periodStart, periodEnd, mockFiscalYear)).toBe(false);
  });
});