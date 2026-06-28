import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listFiscalYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    const fiscalYears = await prisma.fiscalYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json({ fiscalYears });
  } catch (error) {
    console.error('listFiscalYears error:', error);
    res.status(500).json({ message: 'Failed to load fiscal years' });
  }
};

export const createFiscalYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, startDate, endDate, taxSlabs } = req.body;

    if (!year || !startDate || !endDate) {
      res.status(400).json({ message: 'Year name, start date, and end date are required' });
      return;
    }

    let parsedSlabs;
    try {
      parsedSlabs = typeof taxSlabs === 'string' ? JSON.parse(taxSlabs) : (taxSlabs || [
        { limit: 500000, rate: 0, type: 'tax' },
        { limit: 200000, rate: 10, type: 'tax' },
        { limit: 300000, rate: 20, type: 'tax' },
        { limit: 1000000, rate: 30, type: 'tax' },
        { limit: null, rate: 36, type: 'tax' },
      ]);
    } catch {
      res.status(400).json({ message: 'Invalid taxSlabs JSON format' });
      return;
    }

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        name: year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        taxSlabs: parsedSlabs,
        ssfEmployeeRate: 0.10,
        ssfEmployerRate: 0.10,
        ssfMedicalPct: 5,
        ssfPensionPct: 87.22,
        ssfAccidentPct: 1.6,
        ssfDependentPct: 6.18,
        ssfProvidentFundPct: 0,
        minimumWage: 15000,
        overtimeRateMultiplier: 1.5,
        maxOvertimeHoursPerDay: 2,
        maxOvertimeHoursPerWeek: 8,
      },
    });

    res.status(201).json(fiscalYear);
  } catch (error) {
    console.error('createFiscalYear error:', error);
    res.status(500).json({ message: 'Failed to create fiscal year' });
  }
};
