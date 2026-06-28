import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const listDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    console.error('listDocuments error:', error);
    res.status(500).json({ message: 'Failed to load documents' });
  }
};

export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { documentType, fileName, fileUrl } = req.body;

    if (!documentType || !fileName || !fileUrl) {
      res.status(400).json({ message: 'Document type, file name, and file URL are required' });
      return;
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: parseInt(employeeId),
        documentType,
        fileName,
        fileUrl,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('createDocument error:', error);
    res.status(500).json({ message: 'Failed to create document record' });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentType, fileName, fileUrl } = req.body;

    const existing = await prisma.employeeDocument.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (documentType !== undefined) updateData.documentType = documentType;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

    const document = await prisma.employeeDocument.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(document);
  } catch (error) {
    console.error('updateDocument error:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.employeeDocument.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    await prisma.employeeDocument.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('deleteDocument error:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
};
