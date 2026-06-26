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
