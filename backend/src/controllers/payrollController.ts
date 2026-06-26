import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  calculateTds,
  calculateSsfContributions,
  isFestivalBonusApplicable,
  FiscalYear,
  TaxSlab,
} from '../services/payroll';

interface RunPayrollBody {
  periodStart: string;
  periodEnd: string;
  fiscalYearId: number;
}

interface PayrollSummary {
  payrollPeriod: { id: number; periodStart: Date; periodEnd: Date; fiscalYearId: number };
  totalEmployees: number;
  totalEarnings: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  netPayroll: number;
}

export async function runPayroll(req: Request, res: Response): Promise<void> {
  const { periodStart, periodEnd, fiscalYearId } = req.body as RunPayrollBody;

  if (!periodStart || !periodEnd || !fiscalYearId) {
    res.status(400).json({ message: 'periodStart, periodEnd, and fiscalYearId are required' });
    return;
  }

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({ message: 'Invalid date format. Use ISO date strings.' });
    return;
  }

  if (startDate > endDate) {
    res.status(400).json({ message: 'periodStart must be before or equal to periodEnd' });
    return;
  }

  const fiscalYear = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
  if (!fiscalYear) {
    res.status(404).json({ message: `FiscalYear with id ${fiscalYearId} not found` });
    return;
  }

  const existingPeriod = await prisma.payrollPeriod.findFirst({
    where: { fiscalYearId, periodStart: startDate, periodEnd: endDate },
    include: { transactions: true },
  });

  if (existingPeriod && existingPeriod.transactions.length > 0) {
    res.status(409).json({ message: 'Payroll already run for this period' });
    return;
  }

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    include: {
      salaryStructures: {
        where: { effectiveUntil: null },
        include: { salaryHead: true },
      },
    },
  });

  if (employees.length === 0) {
    res.status(400).json({ message: 'No active employees found' });
    return;
  }

  const salaryHeads = await prisma.salaryHead.findMany();
  const salaryHeadsByName: Record<string, { id: number; name: string }> = {};
  for (const sh of salaryHeads) {
    salaryHeadsByName[sh.name] = { id: sh.id, name: sh.name };
  }

  const fyConfig: FiscalYear = {
    ssfEmployeeRate: fiscalYear.ssfEmployeeRate,
    ssfEmployerRate: fiscalYear.ssfEmployerRate,
    ssfMedicalPct: fiscalYear.ssfMedicalPct,
    ssfPensionPct: fiscalYear.ssfPensionPct,
    ssfAccidentPct: fiscalYear.ssfAccidentPct,
    ssfDependentPct: fiscalYear.ssfDependentPct,
    ssfProvidentFundPct: fiscalYear.ssfProvidentFundPct,
    overtimeRateMultiplier: fiscalYear.overtimeRateMultiplier,
    maxOvertimeHoursPerDay: fiscalYear.maxOvertimeHoursPerDay,
    maxOvertimeHoursPerWeek: fiscalYear.maxOvertimeHoursPerWeek,
  };

  const taxSlabs = fiscalYear.taxSlabs as unknown as TaxSlab[];
  const festivalBonus = isFestivalBonusApplicable(startDate, endDate, fyConfig);

  // Collect all transaction data before the transaction
  const allTransactions: Array<{
    employeeId: number;
    payrollPeriodId: number;
    salaryHeadId: number;
    amount: number;
    isEmployerContribution: boolean;
  }> = [];

  let totalEmployees = 0;
  let totalEarnings = 0;
  let totalDeductions = 0;
  let totalEmployerContributions = 0;
  let netPayroll = 0;

  for (const employee of employees) {
    const structs = employee.salaryStructures;

    const basicStruct = structs.find((s) => s.salaryHead.name === 'Basic');
    const basicSalary = basicStruct?.monthlyAmount ?? 0;

    const daStruct = structs.find((s) => s.salaryHead.name === 'Dearness Allowance');
    const dearnessAllowance = daStruct?.monthlyAmount ?? 0;
    void dearnessAllowance; // reserved for future overtime

    const earningStructs = structs.filter(
      (s) => s.salaryHead.type === 'EARNING' && s.salaryHead.name !== 'SSF Employer'
    );

    let grossMonthly = 0;
    for (const s of earningStructs) {
      grossMonthly += s.monthlyAmount;
    }

    const annualTaxableIncome = grossMonthly * 12;
    const annualTds = calculateTds(annualTaxableIncome, taxSlabs);
    const monthlyTds = Math.round((annualTds / 12) * 100) / 100;

    const ssf = calculateSsfContributions(basicSalary, fyConfig);

    const festivalBonusAmount = festivalBonus && basicSalary > 0 ? basicSalary : 0;

    // Add earning salary heads
    for (const s of earningStructs) {
      allTransactions.push({
        employeeId: employee.id,
        payrollPeriodId: -1,
        salaryHeadId: s.salaryHead.id,
        amount: s.monthlyAmount,
        isEmployerContribution: false,
      });
    }

    // Festival bonus earning
    if (festivalBonusAmount > 0) {
      const festivalHead = salaryHeadsByName['Festival Bonus'];
      if (festivalHead) {
        allTransactions.push({
          employeeId: employee.id,
          payrollPeriodId: -1,
          salaryHeadId: festivalHead.id,
          amount: festivalBonusAmount,
          isEmployerContribution: false,
        });
      }
    }

    // SSF Employee deduction
    if (salaryHeadsByName['SSF Employee']) {
      allTransactions.push({
        employeeId: employee.id,
        payrollPeriodId: -1,
        salaryHeadId: salaryHeadsByName['SSF Employee'].id,
        amount: ssf.employeeTotal,
        isEmployerContribution: false,
      });
    }

    // SSF Employer earning
    if (salaryHeadsByName['SSF Employer']) {
      allTransactions.push({
        employeeId: employee.id,
        payrollPeriodId: -1,
        salaryHeadId: salaryHeadsByName['SSF Employer'].id,
        amount: ssf.employerTotal,
        isEmployerContribution: true,
      });
    }

    // TDS deduction
    if (salaryHeadsByName['TDS']) {
      allTransactions.push({
        employeeId: employee.id,
        payrollPeriodId: -1,
        salaryHeadId: salaryHeadsByName['TDS'].id,
        amount: monthlyTds,
        isEmployerContribution: false,
      });
    }

    totalEmployees += 1;
    totalEarnings += grossMonthly + festivalBonusAmount;
    totalDeductions += ssf.employeeTotal + monthlyTds;
    totalEmployerContributions += ssf.employerTotal;
    netPayroll += grossMonthly - ssf.employeeTotal - monthlyTds + festivalBonusAmount;
  }

  // Create period and insert transactions in a transaction
  const payrollPeriod = await prisma.$transaction(async (tx) => {
    const period = await tx.payrollPeriod.create({
      data: {
        fiscalYearId,
        periodStart: startDate,
        periodEnd: endDate,
      },
    });

    // Replace placeholder with real period id
    const realTransactions = allTransactions.map((tx) => ({
      ...tx,
      payrollPeriodId: period.id,
    }));

    await tx.payrollTransaction.createMany({ data: realTransactions });

    return period;
  });

  const summary: PayrollSummary = {
    payrollPeriod: {
      id: payrollPeriod.id,
      periodStart: payrollPeriod.periodStart,
      periodEnd: payrollPeriod.periodEnd,
      fiscalYearId: payrollPeriod.fiscalYearId,
    },
    totalEmployees,
    totalEarnings,
    totalDeductions,
    totalEmployerContributions,
    netPayroll,
  };

  res.status(201).json(summary);
}

// GET /api/payroll/periods - List all payroll periods
export async function listPayrollPeriods(req: Request, res: Response): Promise<void> {
  const fiscalYearId = req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = fiscalYearId ? { fiscalYearId } : {};

  const [periods, total] = await Promise.all([
    prisma.payrollPeriod.findMany({
      where,
      include: { fiscalYear: true },
      orderBy: { periodStart: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payrollPeriod.count({ where }),
  ]);

  const periodIds = periods.map((p) => p.id);

  const [txCounts, empCounts] = await Promise.all([
    prisma.payrollTransaction.groupBy({
      by: ['payrollPeriodId'],
      where: { payrollPeriodId: { in: periodIds } },
      _count: true,
    }),
    prisma.payrollTransaction.groupBy({
      by: ['payrollPeriodId', 'employeeId'],
      where: { payrollPeriodId: { in: periodIds } },
    }),
  ]);

  const txCountMap: Record<number, number> = {};
  for (const row of txCounts) {
    txCountMap[row.payrollPeriodId] = row._count;
  }

  const empCountMap: Record<number, number> = {};
  for (const row of empCounts) {
    empCountMap[row.payrollPeriodId] = (empCountMap[row.payrollPeriodId] || 0) + 1;
  }

  const data = periods.map((p) => ({
    id: p.id,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    locked: p.locked,
    fiscalYear: { id: p.fiscalYear.id, name: p.fiscalYear.name },
    _count: {
      transactions: txCountMap[p.id] || 0,
      employees: empCountMap[p.id] || 0,
    },
  }));

  res.json({ data, page, limit, total });
}

// GET /api/payroll/periods/:id - Get payroll period by id with employee transactions
export async function getPayrollPeriod(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid period id' });
    return;
  }

  const period = await prisma.payrollPeriod.findUnique({
    where: { id },
    include: { fiscalYear: true },
  });

  if (!period) {
    res.status(404).json({ message: 'Payroll period not found' });
    return;
  }

  const transactions = await prisma.payrollTransaction.findMany({
    where: { payrollPeriodId: id },
    include: { salaryHead: true, employee: true },
    orderBy: [{ employeeId: 'asc' }, { salaryHeadId: 'asc' }],
  });

  // Group by employee
  const empMap: Record<number, { employee: unknown; transactions: unknown[]; totalEarnings: number; totalDeductions: number; netPay: number }> = {};

  for (const tx of transactions) {
    if (!empMap[tx.employeeId]) {
      empMap[tx.employeeId] = {
        employee: {
          id: tx.employee.id,
          firstName: tx.employee.firstName,
          lastName: tx.employee.lastName,
          pan: tx.employee.pan,
          designation: tx.employee.designation,
        },
        transactions: [],
        totalEarnings: 0,
        totalDeductions: 0,
        netPay: 0,
      };
    }
    empMap[tx.employeeId].transactions.push({
      id: tx.id,
      salaryHead: {
        id: tx.salaryHead.id,
        name: tx.salaryHead.name,
        type: tx.salaryHead.type,
        legalReference: tx.salaryHead.legalReference,
      },
      amount: tx.amount,
    });
    if (tx.salaryHead.type === 'EARNING') {
      empMap[tx.employeeId].totalEarnings += tx.amount;
    } else {
      empMap[tx.employeeId].totalDeductions += tx.amount;
    }
  }

  // Compute netPay after summing
  for (const emp of Object.values(empMap)) {
    emp.netPay = emp.totalEarnings - emp.totalDeductions;
  }

  res.json({
    period: {
      id: period.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      locked: period.locked,
      fiscalYear: { id: period.fiscalYear.id, name: period.fiscalYear.name },
    },
    employees: Object.values(empMap),
  });
}

// GET /api/payroll/payslip/:employeeId/:periodId - Get payslip for employee and period
export async function getPayslip(req: Request, res: Response): Promise<void> {
  const employeeId = parseInt(req.params.employeeId);
  const periodId = parseInt(req.params.periodId);

  if (isNaN(employeeId) || isNaN(periodId)) {
    res.status(400).json({ message: 'Invalid employeeId or periodId' });
    return;
  }

  const [employee, period] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.payrollPeriod.findUnique({ where: { id: periodId } }),
  ]);

  if (!employee) {
    res.status(404).json({ message: 'Employee not found' });
    return;
  }
  if (!period) {
    res.status(404).json({ message: 'Payroll period not found' });
    return;
  }

  const transactions = await prisma.payrollTransaction.findMany({
    where: { employeeId, payrollPeriodId: periodId },
    include: { salaryHead: true },
    orderBy: { salaryHeadId: 'asc' },
  });

  const earnings = transactions
    .filter((tx) => tx.salaryHead.type === 'EARNING')
    .map((tx) => ({
      name: tx.salaryHead.name,
      amount: tx.amount,
      legalReference: tx.salaryHead.legalReference,
    }));

  const deductions = transactions
    .filter((tx) => tx.salaryHead.type === 'DEDUCTION')
    .map((tx) => ({
      name: tx.salaryHead.name,
      amount: tx.amount,
      legalReference: tx.salaryHead.legalReference,
    }));

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  res.json({
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      pan: employee.pan,
      designation: employee.designation,
    },
    period: {
      id: period.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    },
    earnings,
    deductions,
    totals: {
      totalEarnings,
      totalDeductions,
      netPay: totalEarnings - totalDeductions,
    },
  });
}

// GET /api/payroll/etds-export - Export E-TDS CSV for fiscal year
export async function exportEtDsCsv(req: Request, res: Response): Promise<void> {
  const fiscalYearId = parseInt(req.query.fiscalYearId as string);
  const quarter = req.query.quarter ? parseInt(req.query.quarter as string) : undefined;

  if (isNaN(fiscalYearId)) {
    res.status(400).json({ message: 'fiscalYearId is required' });
    return;
  }
  if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
    res.status(400).json({ message: 'quarter must be between 1 and 4' });
    return;
  }

  const fiscalYear = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
  if (!fiscalYear) {
    res.status(404).json({ message: 'Fiscal year not found' });
    return;
  }

  // Find TDS salary head
  const tdsHead = await prisma.salaryHead.findFirst({ where: { name: 'TDS' } });
  if (!tdsHead) {
    res.status(404).json({ message: 'TDS salary head not found' });
    return;
  }

  // Build where clause for periods
  const periodWhere: Record<string, unknown> = { fiscalYearId };
  if (quarter !== undefined) {
    const quarterMonths: Record<number, [number, number]> = {
      1: [7, 9],
      2: [10, 12],
      3: [1, 3],
      4: [4, 6],
    };
    const [startMonth, endMonth] = quarterMonths[quarter];
    const fyStartMonth = 7; // Nepal fiscal year starts in Shrawan (July)
    const fyStartYear = new Date(fiscalYear.startDate).getFullYear();

    // Adjust year for quarters 3 and 4 which cross calendar year
    let periodStartMonth = startMonth;
    let periodEndMonth = endMonth;
    if (quarter >= 3) {
      // Quarters 3 and 4 are in the next calendar year
      periodStartMonth = quarter === 3 ? 1 : 4;
      periodEndMonth = quarter === 3 ? 3 : 6;
    }

    periodWhere['periodStart'] = {
      gte: new Date(fyStartYear, fyStartMonth - 1 + (quarter - 1) * 3, 1),
    };
  }

  const periods = await prisma.payrollPeriod.findMany({
    where: periodWhere,
    include: { transactions: { where: { salaryHeadId: tdsHead.id }, include: { employee: true } } },
  });

  // Group TDS by employee
  const empMap: Record<number, { pan: string; name: string; designation: string; totalTds: number; grossMonthly: number }> = {};

  for (const period of periods) {
    for (const tx of period.transactions) {
      if (!empMap[tx.employeeId]) {
        empMap[tx.employeeId] = {
          pan: tx.employee.pan ?? '',
          name: `${tx.employee.firstName} ${tx.employee.lastName}`.trim(),
          designation: tx.employee.designation ?? '',
          totalTds: 0,
          grossMonthly: 0,
        };
      }
      empMap[tx.employeeId].totalTds += tx.amount;
    }
  }

  // Get gross monthly for each employee from their salary structure
  const employeeIds = Object.keys(empMap).map(Number);
  if (employeeIds.length > 0) {
    const structs = await prisma.employeeSalaryStructure.findMany({
      where: { employeeId: { in: employeeIds }, effectiveUntil: null },
      include: { salaryHead: true },
    });

    for (const s of structs) {
      if (s.salaryHead.type === 'EARNING' && s.salaryHead.name !== 'SSF Employer') {
        if (empMap[s.employeeId]) {
          empMap[s.employeeId].grossMonthly += s.monthlyAmount;
        }
      }
    }
  }

  const rows = ['pan,employee_name,designation,total_taxable_income,tax_deducted'];
  for (const emp of Object.values(empMap)) {
    const totalTaxable = emp.grossMonthly * 12;
    rows.push(
      [
        emp.pan,
        `"${emp.name}"`,
        `"${emp.designation}"`,
        totalTaxable.toFixed(2),
        emp.totalTds.toFixed(2),
      ].join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="etds_fy${fiscalYearId}${quarter ? `_Q${quarter}` : ''}.csv"`);
  res.send(rows.join('\n'));
}

// GET /api/payroll/ssf-report - Export SSF contribution report CSV
export async function exportSsfReport(req: Request, res: Response): Promise<void> {
  const periodId = parseInt(req.query.periodId as string);

  if (isNaN(periodId)) {
    res.status(400).json({ message: 'periodId is required' });
    return;
  }

  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      transactions: {
        include: { employee: true, salaryHead: true },
      },
    },
  });

  if (!period) {
    res.status(404).json({ message: 'Payroll period not found' });
    return;
  }

  const ssfEmpHead = await prisma.salaryHead.findFirst({ where: { name: 'SSF Employee' } });
  const ssfErHead = await prisma.salaryHead.findFirst({ where: { name: 'SSF Employer' } });
  const basicHead = await prisma.salaryHead.findFirst({ where: { name: 'Basic' } });

  if (!ssfEmpHead || !ssfErHead) {
    res.status(404).json({ message: 'SSF salary heads not configured' });
    return;
  }

  // Group by employee
  const empMap: Record<number, { pan: string; name: string; basic: number; empContrib: number; erContrib: number }> = {};

  for (const tx of period.transactions) {
    if (tx.salaryHead.name !== 'SSF Employee' && tx.salaryHead.name !== 'SSF Employer') continue;

    if (!empMap[tx.employeeId]) {
      empMap[tx.employeeId] = {
        pan: tx.employee.pan ?? '',
        name: `${tx.employee.firstName} ${tx.employee.lastName}`.trim(),
        basic: 0,
        empContrib: 0,
        erContrib: 0,
      };
    }

    if (tx.salaryHead.name === 'SSF Employee') {
      empMap[tx.employeeId].empContrib += tx.amount;
    } else if (tx.salaryHead.name === 'SSF Employer') {
      empMap[tx.employeeId].erContrib += tx.amount;
    }
  }

  // Get basic salary from transactions
  if (basicHead) {
    for (const tx of period.transactions) {
      if (tx.salaryHead.name === 'Basic' && empMap[tx.employeeId]) {
        empMap[tx.employeeId].basic += tx.amount;
      }
    }
  }

  const rows = ['pan,employee_name,basic_salary,employee_contribution,employer_contribution,total'];
  for (const emp of Object.values(empMap)) {
    const total = emp.empContrib + emp.erContrib;
    rows.push(
      [
        emp.pan,
        `"${emp.name}"`,
        emp.basic.toFixed(2),
        emp.empContrib.toFixed(2),
        emp.erContrib.toFixed(2),
        total.toFixed(2),
      ].join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ssf_report_period${periodId}.csv"`);
  res.send(rows.join('\n'));
}

// PUT /api/payroll/periods/:id/lock - Lock/unlock a payroll period
export async function lockPayrollPeriod(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid period id' });
    return;
  }

  const period = await prisma.payrollPeriod.findUnique({ where: { id } });
  if (!period) {
    res.status(404).json({ message: 'Payroll period not found' });
    return;
  }

  const updated = await prisma.payrollPeriod.update({
    where: { id },
    data: { locked: !period.locked },
    include: { fiscalYear: true },
  });

  res.json({ id: updated.id, locked: updated.locked, periodStart: updated.periodStart, periodEnd: updated.periodEnd });
}