import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  employee_id: string;
  name_en: string;
  name_kh: string;
  email: string;
  role: string;
  position: string;
  department: {
    id: string;
    name: string;
  };
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  user?: User;
  title: string;
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  title,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    name_en: '',
    name_kh: '',
    email: '',
    password: '',
    role: 'STAFF',
    position: '',
    department_id: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        employee_id: user.employee_id,
        name_en: user.name_en,
        name_kh: user.name_kh,
        email: user.email,
        password: '', // Don't show password
        role: user.role,
        position: user.position,
        department_id: user.department.id,
      });
    } else {
      setFormData({
        employee_id: '',
        name_en: '',
        name_kh: '',
        email: '',
        password: '',
        role: 'STAFF',
        position: '',
        department_id: '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch departments');
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />

            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700">
                Name (English)
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                value={formData.name_en}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="name_kh" className="block text-sm font-medium text-gray-700">
                Name (Khmer)
              </label>
              <input
                type="text"
                id="name_kh"
                name="name_kh"
                value={formData.name_kh}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password {user && '(Leave blank to keep current)'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={!user}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-smm"
                required
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="HR">HR</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-smm"
                required
              />
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-black text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-smm"
                required
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
