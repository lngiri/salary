import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { calculateFinalSettlement } from '../services/settlement';

const PAN_REGEX = /^\d{9}$/;

export const listEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'ALL', search = '', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { pan: { contains: String(search), mode: 'insensitive' } },
        { designation: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
        include: {
          salaryStructures: {
            where: { effectiveUntil: null },
            include: { salaryHead: { select: { id: true, name: true, type: true } } },
          },
        },
      }),
    ]);

    res.json({
      data: employees,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('listEmployees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        organisation: true,
        salaryStructures: {
          include: { salaryHead: true },
          orderBy: { effectiveFrom: 'desc' },
        },
        leaveRecords: { orderBy: { id: 'desc' } },
      },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error('getEmployee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      pan,
      designation,
      dateOfJoining,
      basicSalary,
      ssfId,
      dateOfBirth,
      phone,
      email,
      address,
      department,
      bankAccountNo,
      bankName,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !pan || !designation || !dateOfJoining || basicSalary === undefined) {
      res.status(400).json({ message: 'firstName, lastName, pan, designation, dateOfJoining, basicSalary are required' });
      return;
    }

    // Validate PAN format (9 digits)
    if (!PAN_REGEX.test(pan)) {
      res.status(400).json({ message: 'PAN must be exactly 9 digits' });
      return;
    }

    // Check PAN uniqueness
    const existingPan = await prisma.employee.findUnique({ where: { pan } });
    if (existingPan) {
      res.status(409).json({ message: 'Employee with this PAN already exists' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          pan,
          designation,
          dateOfJoining: new Date(dateOfJoining),
          ssfId: ssfId ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone ?? null,
          email: email ?? null,
          address: address ?? null,
          department: department ?? null,
          bankAccountNo: bankAccountNo ?? null,
          bankName: bankName ?? null,
          organisationId: 1,
        },
      });

      // Find "Basic" salary head
      const basicHead = await tx.salaryHead.findFirst({ where: { name: 'Basic' } });
      if (!basicHead) {
        throw new Error('Salary head "Basic" not found. Please seed salary heads first.');
      }

      // Create initial salary structure
      const salaryStructure = await tx.employeeSalaryStructure.create({
        data: {
          employeeId: employee.id,
          salaryHeadId: basicHead.id,
          monthlyAmount: parseFloat(basicSalary),
          effectiveFrom: new Date(dateOfJoining),
        },
        include: { salaryHead: true },
      });

      return { employee, salaryStructure };
    });

    res.status(201).json({
      ...result.employee,
      salaryStructures: [result.salaryStructure],
    });
  } catch (error) {
    console.error('createEmployee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      ssfId,
      dateOfBirth,
      phone,
      email,
      address,
      designation,
      department,
      bankAccountNo,
      bankName,
      dateOfJoining,
    } = req.body;

    const employeeId = parseInt(id, 10);

    // Check employee exists
    const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!existing) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (ssfId !== undefined) updateData.ssfId = ssfId;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (dateOfJoining !== undefined) updateData.dateOfJoining = new Date(dateOfJoining);

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    res.json(employee);
  } catch (error) {
    console.error('updateEmployee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deactivateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lastWorkingDate, reason } = req.body;

    const employeeId = parseInt(id, 10);

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (employee.status === 'INACTIVE') {
      res.status(400).json({ message: 'Employee is already inactive' });
      return;
    }

    const lastDay = lastWorkingDate ? new Date(lastWorkingDate) : new Date();

    // Update employee status and leaving date
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: 'INACTIVE',
        dateOfLeaving: lastDay,
      },
    });

    // Compute final settlement
    const settlement = await calculateFinalSettlement(employee, lastDay, reason);

    res.json(settlement);
  } catch (error) {
    console.error('deactivateEmployee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalaryHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const structures = await prisma.employeeSalaryStructure.findMany({
      where: { employeeId: parseInt(id, 10) },
      include: { salaryHead: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    res.json(structures);
  } catch (error) {
    console.error('getSalaryHistory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};