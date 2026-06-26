import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getStructures = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const employeeId = parseInt(id, 10);
    if (isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    const structures = await prisma.employeeSalaryStructure.findMany({
      where: { employeeId },
      include: { salaryHead: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    res.json(structures);
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStructure = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { salaryHeadId, monthlyAmount, effectiveFrom, effectiveUntil } = req.body;

  try {
    const employeeId = parseInt(id, 10);
    if (isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    if (!salaryHeadId || monthlyAmount === undefined) {
      res.status(400).json({ message: 'salaryHeadId and monthlyAmount are required' });
      return;
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Parse effectiveFrom or default to today
    const effFrom = effectiveFrom ? new Date(effectiveFrom) : new Date();
    effFrom.setHours(0, 0, 0, 0);

    // Check for existing active structure for this salary head
    const existingActive = await prisma.employeeSalaryStructure.findFirst({
      where: {
        employeeId,
        salaryHeadId,
        effectiveUntil: null,
      },
    });

    if (existingActive) {
      // Close the existing structure one day before new effectiveFrom
      const closeDate = new Date(effFrom);
      closeDate.setDate(closeDate.getDate() - 1);
      await prisma.employeeSalaryStructure.update({
        where: { id: existingActive.id },
        data: { effectiveUntil: closeDate },
      });
    }

    const structure = await prisma.employeeSalaryStructure.create({
      data: {
        employeeId,
        salaryHeadId,
        monthlyAmount,
        effectiveFrom: effFrom,
        effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
      },
      include: { salaryHead: true },
    });

    res.status(201).json(structure);
  } catch (error) {
    console.error('Error creating salary structure:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStructure = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { monthlyAmount, effectiveFrom, effectiveUntil } = req.body;

  try {
    const structureId = parseInt(id, 10);
    if (isNaN(structureId)) {
      res.status(400).json({ message: 'Invalid structure ID' });
      return;
    }

    const existing = await prisma.employeeSalaryStructure.findUnique({
      where: { id: structureId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Salary structure not found' });
      return;
    }

    const updateData: {
      monthlyAmount?: number;
      effectiveFrom?: Date;
      effectiveUntil?: Date | null;
    } = {};

    if (monthlyAmount !== undefined) updateData.monthlyAmount = monthlyAmount;
    if (effectiveFrom !== undefined) updateData.effectiveFrom = new Date(effectiveFrom);
    if (effectiveUntil !== undefined) {
      updateData.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : null;
    }

    const updated = await prisma.employeeSalaryStructure.update({
      where: { id: structureId },
      data: updateData,
      include: { salaryHead: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating salary structure:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteStructure = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const structureId = parseInt(id, 10);
    if (isNaN(structureId)) {
      res.status(400).json({ message: 'Invalid structure ID' });
      return;
    }

    const existing = await prisma.employeeSalaryStructure.findUnique({
      where: { id: structureId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Salary structure not found' });
      return;
    }

    // Soft delete: set effectiveUntil to today if currently null
    if (existing.effectiveUntil === null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const updated = await prisma.employeeSalaryStructure.update({
        where: { id: structureId },
        data: { effectiveUntil: today },
        include: { salaryHead: true },
      });
      res.json(updated);
    } else {
      res.status(400).json({ message: 'Salary structure already ended, cannot delete' });
    }
  } catch (error) {
    console.error('Error deleting salary structure:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};