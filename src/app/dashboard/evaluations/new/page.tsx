'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';

interface User {
  id: string;
  employeeId: string;
  nameEn: string;
  nameKh: string;
  position: string;
  department: {
    name: string;
  };
}

interface EvaluationFormData {
  employeeId: string;
  type: 'STAFF_COMMENDATION' | 'SELF_COMMENDATION';
  month: number;
  year: number;
  workQuality: number | '';
  workQuantity: number | '';
  knowledge: number | '';
  initiative: number | '';
  teamwork: number | '';
  communication: number | '';
  punctuality: number | '';
  management: number | '';
  reliability: number | '';
  otherFactors: number | '';
  comments?: string;
}

const defaultFormData: EvaluationFormData = {
  employeeId: '',
  type: 'STAFF_COMMENDATION',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  workQuality: '',
  workQuantity: '',
  knowledge: '',
  initiative: '',
  teamwork: '',
  communication: '',
  punctuality: '',
  management: '',
  reliability: '',
  otherFactors: '',
  comments: ''
};

export default function NewEvaluationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<EvaluationFormData>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return users
      .filter(user => {
        const employeeId = (user.employeeId || '').toString().toLowerCase();
        const nameEn = (user.nameEn || '').toString().toLowerCase();
        
        return employeeId.includes(query) || nameEn.includes(query);
      })
      .slice(0, 5);
  }, [users, searchQuery]);

  const handleSelectEmployee = (user: User) => {
    setFormData(prev => ({
      ...prev,
      employeeId: user.id
    }));
    setSearchQuery(`${user.employeeId} - ${user.nameEn}`);
    setShowDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    if (!value.includes(searchQuery)) {
      setFormData(prev => ({
        ...prev,
        employeeId: ''
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'month' || name === 'year') {
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value)
      }));
    } else if (name.includes('work') || name.includes('Factor') || 
              name === 'knowledge' || name === 'initiative' || 
              name === 'teamwork' || name === 'communication' || 
              name === 'punctuality' || name === 'management' || 
              name === 'reliability') {
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          [name]: ''
        }));
        return;
      }

      if (value === '.' || value.endsWith('.')) {
        setFormData((prev) => ({
          ...prev,
          [name]: value
        }));
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({
          ...prev,
          [name]: numValue
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateScores = (data: EvaluationFormData) => {
    const scores = [
      data.workQuality === '' ? 0 : data.workQuality,
      data.workQuantity === '' ? 0 : data.workQuantity,
      data.knowledge === '' ? 0 : data.knowledge,
      data.initiative === '' ? 0 : data.initiative,
      data.teamwork === '' ? 0 : data.teamwork,
      data.communication === '' ? 0 : data.communication,
      data.punctuality === '' ? 0 : data.punctuality,
      data.management === '' ? 0 : data.management,
      data.reliability === '' ? 0 : data.reliability,
      data.otherFactors === '' ? 0 : data.otherFactors,
    ];

    if (scores.length === 0) return { totalScore: 0, percentage: 0, grade: 'F' };

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const percentage = (totalScore / (scores.length * 50)) * 100;

    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    return { totalScore, percentage, grade };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      setError('Please select an employee');
      return;
    }

    // Validate all required score fields
    const scoreFields = [
      'workQuality', 'workQuantity', 'knowledge', 'initiative',
      'teamwork', 'communication', 'punctuality', 'management',
      'reliability', 'otherFactors'
    ];

    const missingFields = scoreFields.filter(field => 
      formData[field as keyof EvaluationFormData] === ''
    );

    if (missingFields.length > 0) {
      setError(`Please fill in all score fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Calculate scores
      const { totalScore, percentage, grade } = calculateScores(formData);

      const requestData = {
        ...formData,
        totalScore,
        percentage,
        grade,
        evaluatorId: session?.user?.id,
        // Convert empty strings to 0 for numeric fields
        ...Object.fromEntries(
          scoreFields.map(field => [
            field, 
            formData[field as keyof EvaluationFormData] === '' 
              ? 0 
              : Number(formData[field as keyof EvaluationFormData])
          ])
        )
      };

      console.log('Submitting evaluation:', requestData);

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Failed to parse server response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(
          responseData.error 
            ? `${responseData.error}${responseData.message ? ': ' + responseData.message : ''}`
            : 'Failed to create evaluation'
        );
      }

      router.push('/dashboard/evaluations');
    } catch (error) {
      console.error('Error creating evaluation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const criteriaFields = [
    { name: 'workQuality', label: 'Work Quality' },
    { name: 'workQuantity', label: 'Work Quantity' },
    { name: 'knowledge', label: 'Knowledge' },
    { name: 'initiative', label: 'Initiative' },
    { name: 'teamwork', label: 'Teamwork' },
    { name: 'communication', label: 'Communication' },
    { name: 'punctuality', label: 'Punctuality' },
    { name: 'management', label: 'Management' },
    { name: 'reliability', label: 'Reliability' },
    { name: 'otherFactors', label: 'Other Factors' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Evaluations
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Create New Evaluation
          </h3>
          
          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div ref={searchRef} className="relative">
                <label htmlFor="employeeSearch" className="block text-sm font-medium text-gray-700">
                  Search Employee
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="employeeSearch"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by ID or name"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    autoComplete="off"
                  />
                  {showDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {loading ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : error ? (
                        <div className="px-4 py-2 text-sm text-red-500">
                          {error}
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleSelectEmployee(user)}
                            className="cursor-pointer hover:bg-indigo-50 px-4 py-2"
                          >
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {user.employeeId} - {user.nameEn}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.position} • {user.department.name}
                            </div>
                          </div>
                        ))
                      ) : searchQuery.trim() ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No employees found
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                {!formData.employeeId && searchQuery && (
                  <p className="mt-1 text-sm text-red-600">
                    Please select an employee from the list
                  </p>
                )}
                <input 
                  type="hidden" 
                  name="employeeId" 
                  value={formData.employeeId} 
                  required 
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Evaluation Type
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md text-gray-900"
                    required
                  >
                    <option value="STAFF_COMMENDATION">Staff Commendation</option>
                    <option value="SELF_COMMENDATION">Self Commendation</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  Month
                </label>
                <select
                  id="month"
                  name="month"
                  required
                  value={formData.month}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md text-gray-900"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  required
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Evaluation Criteria</h4>
              <p className="text-sm text-gray-500 mb-4">
                Rate each criterion from 0 to 50
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {criteriaFields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      id={field.name}
                      name={field.name}
                      required
                      value={formData[field.name as keyof EvaluationFormData]}
                      onChange={handleInputChange}
                      min="0"
                      max="50"
                      step="0.1"
                      placeholder="0-50"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 py-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={4}
                value={formData.comments}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 py-1.5"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
