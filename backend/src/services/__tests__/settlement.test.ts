import { calculateFinalSettlement } from '../settlement';

describe('calculateFinalSettlement', () => {
  const mockEmployee = {
    id: 'emp-1',
    email: 'test@example.com',
    password: 'hashed',
    employeeCode: 'E001',
    firstName: 'Test',
    middleName: null,
    lastName: 'User',
    dateOfJoining: new Date('2019-07-01'), // 5 years before 2024-07-01
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE' as const,
    maritalStatus: 'SINGLE' as const,
    contactNumber: '9800000000',
    emergencyContact: null,
    panNumber: null,
    citizenshipNumber: null,
    address: null,
    department: 'Engineering',
    designation: 'Engineer',
    employmentType: 'FULL_TIME' as const,
    reportingManager: null,
    isActive: true,
    profileImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    salaryStructures: [
      {
        id: 'ss-1',
        employeeId: 'emp-1',
        salaryHeadId: 'sh-basic',
        salaryHead: { id: 'sh-basic', name: 'Basic', type: 'EARNING', isTaxable: true },
        monthlyAmount: 52000,
        effectiveFrom: new Date('2020-01-01'),
        effectiveUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  it('calculates leave encashment and gratuity correctly for 5 completed years', () => {
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(mockEmployee, lastWorkingDate, {
      unusedAnnualLeaveDays: 12,
    });

    // dailyRate = 52000 / 26 = 2000
    // leaveEncashment = 2000 * 12 = 24000
    // completedYears = floor((2024-07-01 - 2019-07-01) / 365.25) = floor(1826/365.25) = 5
    // gratuityDailyRate = 52000 / 26 = 2000
    // gratuity = 2000 * 15 * 5 = 150000
    // grossSettlement = 0 + 24000 + 150000 = 174000
    expect(result.leaveEncashment).toBe(24000);
    expect(result.completedYears).toBe(5);
    expect(result.gratuity).toBe(150000);
    expect(result.grossSettlement).toBe(174000);
    expect(result.netSettlement).toBe(174000);
  });

  it('returns gratuity of 0 when completed years is 0', () => {
    const employeeJustJoined = {
      ...mockEmployee,
      dateOfJoining: new Date('2024-06-01'),
      salaryStructures: mockEmployee.salaryStructures,
    };
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(employeeJustJoined, lastWorkingDate, {
      unusedAnnualLeaveDays: 5,
    });

    // completedYears = floor((2024-07-01 - 2024-06-01) / 365.25) = floor(30/365.25) = 0
    // gratuity should be 0
    expect(result.completedYears).toBe(0);
    expect(result.gratuity).toBe(0);
    // leaveEncashment = (52000/26) * 5 = 2000 * 5 = 10000
    expect(result.leaveEncashment).toBe(10000);
  });

  it('respects maxLeaveAccumulation cap', () => {
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(mockEmployee, lastWorkingDate, {
      unusedAnnualLeaveDays: 40, // exceeds max of 30
      maxLeaveAccumulation: 30,
    });

    // Should be capped at 30 days
    // leaveEncashment = (52000/26) * 30 = 2000 * 30 = 60000
    expect(result.unusedAnnualLeaveDays).toBe(30);
    expect(result.leaveEncashment).toBe(60000);
  });

  it('applies manual deductions correctly', () => {
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(mockEmployee, lastWorkingDate, {
      unusedAnnualLeaveDays: 12,
      manualDeductions: 5000,
    });

    expect(result.grossSettlement).toBe(174000);
    expect(result.netSettlement).toBe(169000);
  });

  it('handles unpaid salary in gross settlement', () => {
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(mockEmployee, lastWorkingDate, {
      unusedAnnualLeaveDays: 0,
      unpaidSalary: 15000,
    });

    expect(result.unpaidSalary).toBe(15000);
    expect(result.grossSettlement).toBe(165000); // unpaid + gratuity
    expect(result.netSettlement).toBe(165000);
  });

  it('uses custom divisors when provided', () => {
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(mockEmployee, lastWorkingDate, {
      unusedAnnualLeaveDays: 12,
      leaveEncashmentDailyRateDivisor: 30,
      gratuityDailyRateDivisor: 30,
      gratuityDaysPerYear: 20,
    });

    // leaveEncashmentDailyRate = 52000 / 30 = 1733.33
    // leaveEncashment = 1733.33 * 12 = 20800
    // gratuityDailyRate = 52000 / 30 = 1733.33
    // gratuity = 1733.33 * 20 * 5 = 173333.33
    expect(result.leaveEncashmentDailyRate).toBeCloseTo(1733.33, 2);
    expect(result.gratuityDailyRate).toBeCloseTo(1733.33, 2);
  });

  it('returns zero settlement when no salary structures', () => {
    const employeeNoSalary = {
      ...mockEmployee,
      salaryStructures: [],
    };
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(employeeNoSalary, lastWorkingDate, {
      unusedAnnualLeaveDays: 10,
    });

    expect(result.leaveEncashment).toBe(0);
    expect(result.gratuity).toBe(0);
    expect(result.netSettlement).toBe(0);
  });

  it('rounds monetary values to 2 decimal places', () => {
    const employeeWithOddSalary = {
      ...mockEmployee,
      salaryStructures: [
        {
          id: 'ss-1',
          employeeId: 'emp-1',
          salaryHeadId: 'sh-basic',
          salaryHead: { id: 'sh-basic', name: 'Basic', type: 'EARNING' as const, isTaxable: true },
          monthlyAmount: 52001, // odd amount
          effectiveFrom: new Date('2020-01-01'),
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    const lastWorkingDate = new Date('2024-07-01');
    const result = calculateFinalSettlement(employeeWithOddSalary, lastWorkingDate, {
      unusedAnnualLeaveDays: 3,
    });

    // leaveEncashmentDailyRate = 52001 / 26 = 2000.0384... -> 2000.04
    expect(result.leaveEncashmentDailyRate).toBe(2000.04);
    // leaveEncashment = 2000.04 * 3 = 6000.12 -> 6000.12
    expect(result.leaveEncashment).toBe(6000.12);
  });
});