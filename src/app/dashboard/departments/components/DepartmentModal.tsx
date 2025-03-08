import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface User {
  id: string;
  name_en: string;
  name_kh: string;
}

interface Department {
  id: string;
  name: string;
  manager_id: string;
  manager: {
    name_en: string;
    name_kh: string;
  };
}

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; managerId: string }) => Promise<void>;
  department?: Department;
  title: string;
}

export default function DepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  department,
  title,
}: DepartmentModalProps) {
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setManagerId(department.manager_id);
    }
  }, [department]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch('/api/users?role=MANAGER');
        if (!response.ok) {
          throw new Error('Failed to fetch managers');
        }
        const data = await response.json();
        setManagers(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch managers');
      }
    };

    fetchManagers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSubmit({ name, managerId });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Department Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700">
                Department Manager
              </label>
              <select
                id="manager"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name_en} ({manager.name_kh})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

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
