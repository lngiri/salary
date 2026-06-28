import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listEmergencyContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const contacts = await prisma.emergencyContact.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { id: 'asc' },
    });
    res.json(contacts);
  } catch (error) {
    console.error('listEmergencyContacts error:', error);
    res.status(500).json({ message: 'Failed to load emergency contacts' });
  }
};

export const createEmergencyContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { name, relationship, phone, address } = req.body;

    if (!name || !relationship || !phone) {
      res.status(400).json({ message: 'Name, relationship, and phone are required' });
      return;
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        employeeId: parseInt(employeeId),
        name,
        relationship,
        phone,
        address: address ?? null,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('createEmergencyContact error:', error);
    res.status(500).json({ message: 'Failed to create emergency contact' });
  }
};

export const updateEmergencyContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, address } = req.body;

    const existing = await prisma.emergencyContact.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Emergency contact not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const contact = await prisma.emergencyContact.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(contact);
  } catch (error) {
    console.error('updateEmergencyContact error:', error);
    res.status(500).json({ message: 'Failed to update emergency contact' });
  }
};

export const deleteEmergencyContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.emergencyContact.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Emergency contact not found' });
      return;
    }

    await prisma.emergencyContact.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Emergency contact deleted' });
  } catch (error) {
    console.error('deleteEmergencyContact error:', error);
    res.status(500).json({ message: 'Failed to delete emergency contact' });
  }
};
