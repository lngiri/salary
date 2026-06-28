import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Employee, EmployeeSalaryStructure, SalaryHead } from '../types';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { FullPageLoader } from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

export const EmployeeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pan: '',
    ssfId: '',
    dateOfBirth: '',
    gender: '' as string,
    maritalStatus: '' as string,
    nationality: '',
    citizenshipNo: '',
    address: '',
    designation: '',
    department: '',
    employmentType: '' as string,
    dateOfJoining: '',
    bankName: '',
    bankAccountNo: '',
    basicSalary: '',
  });

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: structures } = useQuery<(EmployeeSalaryStructure & { salaryHead?: SalaryHead })[]>({
    queryKey: ['employee-structures', id],
    queryFn: () => api.get(`/employees/${id}/structures`).then((r) => r.data),
    enabled: !!id,
  });

  const getBasicSalary = () => {
    const basic = structures?.find((s) => s.salaryHead?.name === 'Basic');
    return basic?.monthlyAmount?.toString() || '';
  };

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        pan: employee.pan || '',
        ssfId: employee.ssfId || '',
        dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
        gender: employee.gender || '',
        maritalStatus: employee.maritalStatus || '',
        nationality: employee.nationality || '',
        citizenshipNo: employee.citizenshipNo || '',
        address: employee.address || '',
        designation: employee.designation || '',
        department: employee.department || '',
        employmentType: employee.employmentType || '',
        dateOfJoining: employee.dateOfJoining?.split('T')[0] || '',
        bankName: employee.bankName || '',
        bankAccountNo: employee.bankAccountNo || '',
        basicSalary: getBasicSalary(),
      });
    }
  }, [employee, structures]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setIsSubmitting(true);

    try {
      await api.put(`/employees/${id}`, {
        ...form,
        ssfId: form.ssfId || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        nationality: form.nationality || undefined,
        citizenshipNo: form.citizenshipNo || undefined,
        address: form.address || undefined,
        employmentType: form.employmentType || undefined,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : undefined,
      });
      navigate(`/employees/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message;
      setServerError(msg || 'Failed to update employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <FullPageLoader message="Loading employee data..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/employees/${id}`} className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={18} className="mr-1" />
          Back to Employee
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-500 mt-1">Update employee information</p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <Card className="mb-6">
          <CardBody className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input value={form.pan} onChange={(e) => handleChange('pan', e.target.value)} maxLength={9} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSF ID</label>
                  <input value={form.ssfId} onChange={(e) => handleChange('ssfId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select value={form.maritalStatus} onChange={(e) => handleChange('maritalStatus', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select marital status</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input value={form.nationality} onChange={(e) => handleChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship No</label>
                  <input value={form.citizenshipNo} onChange={(e) => handleChange('citizenshipNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.address} onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardBody className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => handleChange('department', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select value={form.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select type</option>
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="PROBATION">Probation</option>
                    <option value="INTERN">Intern</option>
                    <option value="TEMPORARY">Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input type="date" value={form.dateOfJoining} onChange={(e) => handleChange('dateOfJoining', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Rs.)</label>
                  <input type="number" step="0.01" value={form.basicSalary} onChange={(e) => handleChange('basicSalary', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardBody className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input value={form.bankName} onChange={(e) => handleChange('bankName', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                  <input value={form.bankAccountNo} onChange={(e) => handleChange('bankAccountNo', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </CardBody>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Link to={`/employees/${id}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              <Save size={18} />
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
