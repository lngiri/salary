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
        { employeeCode: { contains: String(search), mode: 'insensitive' } },
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

    const mapped = employees.map(e => ({
      ...e,
      fullName: `${e.firstName} ${e.lastName}`,
    }));

    res.json({
      employees: mapped,
      total,
      page: pageNum,
      limit: limitNum,
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
        emergencyContacts: { orderBy: { id: 'asc' } },
        educationRecords: { orderBy: { yearPassed: 'desc' } },
        workHistories: { orderBy: { startDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json({
      ...employee,
      fullName: `${employee.firstName} ${employee.lastName}`,
    });
  } catch (error) {
    console.error('getEmployee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const generateEmployeeCode = async (): Promise<string> => {
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: { id: 'desc' },
    select: { employeeCode: true },
  });

  let nextNum = 1;
  if (lastEmployee?.employeeCode) {
    const match = lastEmployee.employeeCode.match(/EMP-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `EMP-${String(nextNum).padStart(4, '0')}`;
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
      employeeCode,
      ssfId,
      dateOfBirth,
      phone,
      email,
      address,
      department,
      employmentType,
      gender,
      maritalStatus,
      nationality,
      citizenshipNo,
      bankAccountNo,
      bankName,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !pan || !designation || !dateOfJoining || basicSalary === undefined) {
      res.status(400).json({
        message: 'Validation failed',
        details: [
          !firstName ? 'First name is required' : null,
          !lastName ? 'Last name is required' : null,
          !pan ? 'PAN number is required' : null,
          !designation ? 'Designation is required' : null,
          !dateOfJoining ? 'Date of joining is required' : null,
          basicSalary === undefined ? 'Basic salary is required' : null,
        ].filter(Boolean),
      });
      return;
    }

    // Validate PAN format (9 digits)
    if (!PAN_REGEX.test(pan)) {
      res.status(400).json({ message: 'PAN must be exactly 9 digits. Example: 123456789' });
      return;
    }

    // Check PAN uniqueness
    const existingPan = await prisma.employee.findUnique({ where: { pan } });
    if (existingPan) {
      res.status(409).json({ message: `PAN ${pan} is already assigned to another employee. Each employee must have a unique PAN.` });
      return;
    }

    const code = employeeCode || await generateEmployeeCode();

    const result = await prisma.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          pan,
          employeeCode: code,
          designation,
          dateOfJoining: new Date(dateOfJoining),
          ssfId: ssfId ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone ?? null,
          email: email ?? null,
          address: address ?? null,
          department: department ?? null,
          employmentType: employmentType ?? null,
          gender: gender ?? null,
          maritalStatus: maritalStatus ?? null,
          nationality: nationality ?? null,
          citizenshipNo: citizenshipNo ?? null,
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
      employeeCode,
      ssfId,
      dateOfBirth,
      phone,
      email,
      address,
      designation,
      department,
      employmentType,
      gender,
      maritalStatus,
      nationality,
      citizenshipNo,
      photoUrl,
      bankAccountNo,
      bankName,
      dateOfJoining,
      reasonForLeaving,
      basicSalary,
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
    if (employeeCode !== undefined) updateData.employeeCode = employeeCode;
    if (ssfId !== undefined) updateData.ssfId = ssfId;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (gender !== undefined) updateData.gender = gender;
    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (citizenshipNo !== undefined) updateData.citizenshipNo = citizenshipNo;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (dateOfJoining !== undefined) updateData.dateOfJoining = new Date(dateOfJoining);
    if (reasonForLeaving !== undefined) updateData.reasonForLeaving = reasonForLeaving;

    const employee = await prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: employeeId },
        data: updateData,
      });

      if (basicSalary !== undefined) {
        const basicHead = await tx.salaryHead.findFirst({ where: { name: 'Basic' } });
        if (basicHead) {
          const existingStruct = await tx.employeeSalaryStructure.findFirst({
            where: { employeeId, salaryHeadId: basicHead.id, effectiveUntil: null },
          });
          if (existingStruct) {
            await tx.employeeSalaryStructure.update({
              where: { id: existingStruct.id },
              data: { monthlyAmount: parseFloat(basicSalary) },
            });
          } else {
            await tx.employeeSalaryStructure.create({
              data: {
                employeeId,
                salaryHeadId: basicHead.id,
                monthlyAmount: parseFloat(basicSalary),
                effectiveFrom: new Date(dateOfJoining || existing.dateOfJoining),
              },
            });
          }
        }
      }

      return updated;
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

    // Update employee status, leaving date, and reason
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: 'INACTIVE',
        dateOfLeaving: lastDay,
        reasonForLeaving: reason ?? null,
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