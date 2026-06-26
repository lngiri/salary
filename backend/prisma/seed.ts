import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Admin User
  const passwordHash = bcrypt.hashSync('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created');

  // 2. Organisation
  const org = await prisma.organisation.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Himalaya Tech Pvt. Ltd.',
      panVat: '123456789',
      ssfRegNo: 'SSF-12345',
      address: 'Kathmandu, Nepal',
    },
  });
  console.log('Organisation created');

  // 3. SalaryHeads
  const salaryHeadsData = [
    { name: 'Basic', type: 'EARNING' as const, taxable: true, ssfApplicable: true, isSystem: true, legalReference: 'श्रम ऐन, २०७४, दफा १२(१) र न्यूनतम पारिश्रमिक सम्बन्धी सरकारी सूचना।' },
    { name: 'Dearness Allowance', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: false, legalReference: 'श्रम ऐन, २०७४, दफा १३(क) तथा श्रम नियमावली, २०७५, नियम ७।' },
    { name: 'House Rent Allowance', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: false, legalReference: 'श्रम ऐन, २०७४, दफा १३(ख) – कम्पनीको नीति अनुसार तोकिएको।' },
    { name: 'Medical', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: false, legalReference: 'श्रम नियमावली, २०७५, नियम ८ – रोजगारदाताले तोकेको रकम।' },
    { name: 'Conveyance', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: false, legalReference: 'श्रम नियमावली, २०७५, नियम ९ – कार्यालय आउजाउ खर्च।' },
    { name: 'Overtime', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: true, legalReference: 'श्रम ऐन, २०७४, दफा २८(१) र (२), श्रम नियमावली, २०७५, नियम १८(३) – प्रतिघण्टा दर (आधार+महँगी भत्ता)/२४० × १.५।' },
    { name: 'Festival Bonus', type: 'EARNING' as const, taxable: true, ssfApplicable: false, isSystem: true, legalReference: 'श्रम ऐन, २०७४, दफा ३८ – एक महिनाको आधारभूत तलब बराबर।' },
    { name: 'SSF Employee', type: 'DEDUCTION' as const, taxable: false, ssfApplicable: false, isSystem: true, legalReference: 'सामाजिक सुरक्षा ऐन, २०७५, दफा १५(क), सामाजिक सुरक्षा नियमावली, २०७६, नियम १०(१)।' },
    { name: 'SSF Employer', type: 'EARNING' as const, taxable: false, ssfApplicable: false, isSystem: true, legalReference: 'सामाजिक सुरक्षा ऐन, २०७५, दफा १५(ख), सामाजिक सुरक्षा नियमावली, २०७६, नियम १०(२)।' },
    { name: 'TDS', type: 'DEDUCTION' as const, taxable: false, ssfApplicable: false, isSystem: true, legalReference: 'आयकर ऐन, २०५८, दफा ८७(१) तथा अर्थ ऐनको अनुसूची १ – प्रगतिशील दरमा आयकर।' },
  ];

  for (const sh of salaryHeadsData) {
    await prisma.salaryHead.upsert({
      where: { name: sh.name },
      update: {},
      create: sh,
    });
  }
  console.log('Salary heads created');

  // 4. FiscalYear 2081/82
  // `name` is not a unique field, so use findFirst + create/update.
  const fiscalYearData = {
    name: '2081/82',
    startDate: new Date('2024-07-17'),
    endDate: new Date('2025-07-16'),
    taxSlabs: [
      { limit: 500000, rate: 0, type: 'tax' },
      { limit: 200000, rate: 10, type: 'tax' },
      { limit: 300000, rate: 20, type: 'tax' },
      { limit: 1000000, rate: 30, type: 'tax' },
      { limit: null, rate: 36, type: 'tax' },
    ],
    ssfEmployeeRate: 0.10,
    ssfEmployerRate: 0.10,
    // Sub-head percentages split the total 10% SSF contribution and sum to 100.
    ssfMedicalPct: 5,
    ssfPensionPct: 87.22,
    ssfAccidentPct: 1.6,
    ssfDependentPct: 6.18,
    ssfProvidentFundPct: 0,
    minimumWage: 17300,
    overtimeRateMultiplier: 1.5,
    maxOvertimeHoursPerDay: 4,
    maxOvertimeHoursPerWeek: 24,
    insurancePremiumDeductionLimit: 25000,
    medicalInsuranceDeductionLimit: 20000,
  };

  const existingFy = await prisma.fiscalYear.findFirst({ where: { name: fiscalYearData.name } });
  if (existingFy) {
    await prisma.fiscalYear.update({ where: { id: existingFy.id }, data: fiscalYearData });
  } else {
    await prisma.fiscalYear.create({ data: fiscalYearData });
  }
  console.log('Fiscal year 2081/82 created');

  // 5. 20 Employees with varied salaries
  const basicHead = await prisma.salaryHead.findUnique({ where: { name: 'Basic' } });

  const employeesData = [
    // Below 500k annual (no tax): ~20k-41k monthly
    { firstName: 'Ram', lastName: 'Sharma', pan: '234567890', basic: 25000, joined: '2022-03-15', dept: 'Engineering', desig: 'Junior Developer', dob: '1998-05-12' },
    { firstName: 'Sita', lastName: 'Kumari', pan: '345678901', basic: 28000, joined: '2021-07-01', dept: 'HR', desig: 'HR Officer', dob: '1996-09-22' },
    { firstName: 'Hari', lastName: 'Prasad', pan: '456789012', basic: 32000, joined: '2023-01-10', dept: 'Finance', desig: 'Accountant', dob: '1995-03-18' },
    { firstName: 'Gita', lastName: 'Thapa', pan: '567890123', basic: 35000, joined: '2020-11-25', dept: 'Admin', desig: 'Office Assistant', dob: '1997-07-08' },
    { firstName: 'Krishna', lastName: 'Acharya', pan: '678901234', basic: 38000, joined: '2019-06-30', dept: 'Engineering', desig: 'Senior Developer', dob: '1993-12-01' },
    // 500k-700k (10% slab): ~42k-58k monthly
    { firstName: 'Bibek', lastName: 'Ranjit', pan: '789012345', basic: 45000, joined: '2018-04-15', dept: 'Engineering', desig: 'Tech Lead', dob: '1990-08-14' },
    { firstName: 'Nirmala', lastName: 'Basnet', pan: '890123456', basic: 48000, joined: '2021-02-20', dept: 'Sales', desig: 'Sales Executive', dob: '1994-11-30' },
    { firstName: 'Rajesh', lastName: 'Khatri', pan: '901234567', basic: 52000, joined: '2017-09-12', dept: 'Engineering', desig: 'Senior Engineer', dob: '1989-04-25' },
    { firstName: 'Sunita', lastName: 'Magar', pan: '112233445', basic: 55000, joined: '2020-05-18', dept: 'Marketing', desig: 'Marketing Manager', dob: '1992-01-09' },
    { firstName: 'Anil', lastName: 'Tamang', pan: '223344556', basic: 58000, joined: '2016-08-22', dept: 'Finance', desig: 'Finance Manager', dob: '1987-06-17' },
    // 700k-1M (20% slab): ~60k-85k monthly
    { firstName: 'Prakash', lastName: 'Gurung', pan: '334455667', basic: 65000, joined: '2015-03-10', dept: 'Engineering', desig: 'Architect', dob: '1985-02-28' },
    { firstName: 'Mina', lastName: 'Rai', pan: '445566778', basic: 70000, joined: '2014-07-15', dept: 'Operations', desig: 'Operations Head', dob: '1984-09-05' },
    { firstName: 'Dinesh', lastName: 'Newar', pan: '556677889', basic: 75000, joined: '2013-12-01', dept: 'Engineering', desig: 'Senior Architect', dob: '1983-10-20' },
    { firstName: 'Asha', lastName: 'Sherpa', pan: '667788990', basic: 80000, joined: '2012-04-18', dept: 'HR', desig: 'HR Director', dob: '1982-03-12' },
    { firstName: 'Santosh', lastName: 'Maharjan', pan: '778899001', basic: 85000, joined: '2011-06-25', dept: 'Admin', desig: 'Admin Manager', dob: '1981-07-30' },
    // Above 1M (30%+ slab): ~90k-120k monthly
    { firstName: 'Ramesh', lastName: 'Lama', pan: '889900112', basic: 95000, joined: '2010-02-14', dept: 'Engineering', desig: 'Principal Engineer', dob: '1980-11-15' },
    { firstName: 'Kalpana', lastName: 'Gurung', pan: '990011223', basic: 100000, joined: '2009-09-01', dept: 'Finance', desig: 'CFO', dob: '1979-04-22' },
    { firstName: 'Nabin', lastName: 'Tamang', pan: '001122334', basic: 105000, joined: '2008-05-20', dept: 'Operations', desig: 'COO', dob: '1978-08-10' },
    { firstName: 'Rekha', lastName: 'Sharma', pan: '112233440', basic: 115000, joined: '2007-01-08', dept: 'Legal', desig: 'Legal Head', dob: '1977-12-25' },
    { firstName: 'Bikash', lastName: 'Poudel', pan: '223344550', basic: 120000, joined: '2006-06-30', dept: 'Engineering', desig: 'VP Engineering', dob: '1976-05-18' },
  ];

  const createdEmployees = [];
  for (const emp of employeesData) {
    const employee = await prisma.employee.upsert({
      where: { pan: emp.pan },
      update: {},
      create: {
        organisationId: org.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        pan: emp.pan,
        dateOfBirth: new Date(emp.dob),
        phone: `9849${Math.floor(Math.random() * 9000000 + 1000000)}`,
        email: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@himalayatech.com`,
        address: 'Kathmandu, Nepal',
        designation: emp.desig,
        department: emp.dept,
        bankAccountNo: `000${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        bankName: ['NMB Bank', 'Nepal Investment Bank', 'Standard Chartered', 'Himalaya Bank', 'NIC Asia'][Math.floor(Math.random() * 5)],
        dateOfJoining: new Date(emp.joined),
        status: 'ACTIVE',
      },
    });
    createdEmployees.push({ employee, basic: emp.basic, joined: emp.joined });
  }
  console.log(`${createdEmployees.length} employees created`);

  // 6. EmployeeSalaryStructure for Basic head
  // No composite unique key exists, so use deleteMany + create for idempotent seeding.
  let structCount = 0;
  for (const { employee, basic, joined } of createdEmployees) {
    if (basicHead) {
      await prisma.employeeSalaryStructure.deleteMany({
        where: {
          employeeId: employee.id,
          salaryHeadId: basicHead.id,
          effectiveFrom: new Date(joined),
        },
      });
      await prisma.employeeSalaryStructure.create({
        data: {
          employeeId: employee.id,
          salaryHeadId: basicHead.id,
          monthlyAmount: basic,
          effectiveFrom: new Date(joined),
          effectiveUntil: null,
        },
      });
      structCount++;
    }
  }
  console.log(`${structCount} salary structures created`);

  // Summary
  const userCount = await prisma.user.count();
  const orgCount = await prisma.organisation.count();
  const headCount = await prisma.salaryHead.count();
  const fyCount = await prisma.fiscalYear.count();
  const empCount = await prisma.employee.count();
  const structTotal = await prisma.employeeSalaryStructure.count();

  console.log('\n--- Seed Summary ---');
  console.log(`Users: ${userCount}`);
  console.log(`Organisations: ${orgCount}`);
  console.log(`Salary Heads: ${headCount}`);
  console.log(`Fiscal Years: ${fyCount}`);
  console.log(`Employees: ${empCount}`);
  console.log(`Salary Structures: ${structTotal}`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
