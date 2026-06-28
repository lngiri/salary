import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listSalaryHeads(req: Request, res: Response) {
  try {
    const heads = await prisma.salaryHead.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(heads);
  } catch (error) {
    console.error('listSalaryHeads error:', error);
    res.status(500).json({ message: 'Failed to fetch salary heads' });
  }
}

export async function createSalaryHead(req: Request, res: Response) {
  try {
    const { name, type, category } = req.body;

    if (!name || !type) {
      res.status(400).json({ message: 'Name and type are required' });
      return;
    }

    if (type !== 'EARNING' && type !== 'DEDUCTION') {
      res.status(400).json({ message: 'Type must be EARNING or DEDUCTION' });
      return;
    }

    const existing = await prisma.salaryHead.findUnique({ where: { name } });
    if (existing) {
      res.status(409).json({ message: `A salary head named "${name}" already exists` });
      return;
    }

      const head = await prisma.salaryHead.create({
        data: {
          name,
          type,
        },
      });

    res.status(201).json(head);
  } catch (error) {
    console.error('createSalaryHead error:', error);
    res.status(500).json({ message: 'Failed to create salary head' });
  }
}

export async function updateSalaryHead(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid salary head id' });
      return;
    }

    const { legalReference } = req.body;
    if (typeof legalReference !== 'string') {
      res.status(400).json({ message: 'legalReference must be a string' });
      return;
    }

    const updated = await prisma.salaryHead.update({
      where: { id },
      data: { legalReference },
    });

    res.json(updated);
  } catch (error) {
    console.error('updateSalaryHead error:', error);
    res.status(500).json({ message: 'Failed to update salary head' });
  }
}
