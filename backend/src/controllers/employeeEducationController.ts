import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const records = await prisma.education.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { yearPassed: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('listEducation error:', error);
    res.status(500).json({ message: 'Failed to load education records' });
  }
};

export const createEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { degree, institution, board, yearPassed, grade } = req.body;

    if (!degree || !institution) {
      res.status(400).json({ message: 'Degree and institution are required' });
      return;
    }

    const record = await prisma.education.create({
      data: {
        employeeId: parseInt(employeeId),
        degree,
        institution,
        board: board ?? null,
        yearPassed: yearPassed ? parseInt(yearPassed) : null,
        grade: grade ?? null,
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('createEducation error:', error);
    res.status(500).json({ message: 'Failed to create education record' });
  }
};

export const updateEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { degree, institution, board, yearPassed, grade } = req.body;

    const existing = await prisma.education.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Education record not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (degree !== undefined) updateData.degree = degree;
    if (institution !== undefined) updateData.institution = institution;
    if (board !== undefined) updateData.board = board;
    if (yearPassed !== undefined) updateData.yearPassed = parseInt(yearPassed);
    if (grade !== undefined) updateData.grade = grade;

    const record = await prisma.education.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(record);
  } catch (error) {
    console.error('updateEducation error:', error);
    res.status(500).json({ message: 'Failed to update education record' });
  }
};

export const deleteEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.education.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Education record not found' });
      return;
    }

    await prisma.education.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Education record deleted' });
  } catch (error) {
    console.error('deleteEducation error:', error);
    res.status(500).json({ message: 'Failed to delete education record' });
  }
};
