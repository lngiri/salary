import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listWorkHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const records = await prisma.workHistory.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { startDate: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('listWorkHistory error:', error);
    res.status(500).json({ message: 'Failed to load work history' });
  }
};

export const createWorkHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { company, position, startDate, endDate, reason } = req.body;

    if (!company || !position || !startDate) {
      res.status(400).json({ message: 'Company, position, and start date are required' });
      return;
    }

    const record = await prisma.workHistory.create({
      data: {
        employeeId: parseInt(employeeId),
        company,
        position,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        reason: reason ?? null,
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('createWorkHistory error:', error);
    res.status(500).json({ message: 'Failed to create work history record' });
  }
};

export const updateWorkHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { company, position, startDate, endDate, reason } = req.body;

    const existing = await prisma.workHistory.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Work history record not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (company !== undefined) updateData.company = company;
    if (position !== undefined) updateData.position = position;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (reason !== undefined) updateData.reason = reason;

    const record = await prisma.workHistory.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(record);
  } catch (error) {
    console.error('updateWorkHistory error:', error);
    res.status(500).json({ message: 'Failed to update work history record' });
  }
};

export const deleteWorkHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.workHistory.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Work history record not found' });
      return;
    }

    await prisma.workHistory.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Work history record deleted' });
  } catch (error) {
    console.error('deleteWorkHistory error:', error);
    res.status(500).json({ message: 'Failed to delete work history record' });
  }
};
