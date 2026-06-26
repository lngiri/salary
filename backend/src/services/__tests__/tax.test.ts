import { calculateTds, calculateMonthlyTds, TaxSlab } from '../payroll';

/**
 * FY 2081/82 tax slabs (from prisma/seed.ts):
 * - First 500,000  @ 0%
 * - Next   200,000  @ 10%  (500k – 700k)
 * - Next   300,000  @ 20%  (700k – 1M)
 * - Next 1,000,000  @ 30%  (1M – 2M)
 * - Above  2,000,000 @ 36%
 */
const FY_2081_82_SLABS: TaxSlab[] = [
  { limit: 500000, rate: 0, type: 'tax' },
  { limit: 200000, rate: 10, type: 'tax' },
  { limit: 300000, rate: 20, type: 'tax' },
  { limit: 1000000, rate: 30, type: 'tax' },
  { limit: null, rate: 36, type: 'tax' },
];

describe('calculateTds — FY 2081/82 progressive slabs', () => {
  it('400000 => 0 (entirely within first tax-free slab)', () => {
    expect(calculateTds(400000, FY_2081_82_SLABS)).toBe(0);
  });

  it('700000 => 20000 (10% on the 200k portion above 500k)', () => {
    expect(calculateTds(700000, FY_2081_82_SLABS)).toBe(20000);
  });

  it('1000000 => 80000 (10% of 200k + 20% of 300k)', () => {
    expect(calculateTds(1000000, FY_2081_82_SLABS)).toBe(80000);
  });

  it('2000000 => 380000 (10% of 200k + 20% of 300k + 30% of 1M)', () => {
    expect(calculateTds(2000000, FY_2081_82_SLABS)).toBe(380000);
  });

  it('3000000 => 740000 (10% of 200k + 20% of 300k + 30% of 1M + 36% of 1M)', () => {
    expect(calculateTds(3000000, FY_2081_82_SLABS)).toBe(740000);
  });
});

describe('calculateMonthlyTds', () => {
  it('700000 annual => 1667 monthly (20000 / 12, rounded)', () => {
    expect(calculateMonthlyTds(700000, FY_2081_82_SLABS)).toBe(1667);
  });

  it('1000000 annual => 6667 monthly (80000 / 12, rounded)', () => {
    expect(calculateMonthlyTds(1000000, FY_2081_82_SLABS)).toBe(6667);
  });

  it('0 income => 0 monthly', () => {
    expect(calculateMonthlyTds(0, FY_2081_82_SLABS)).toBe(0);
  });
});