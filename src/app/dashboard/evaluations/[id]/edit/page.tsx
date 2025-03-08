'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Evaluation } from '@prisma/client';

interface EvaluationFormData {
  employeeId: string;
  month: number;
  year: number;
  type: string;
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

export default function EditEvaluationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState<EvaluationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/evaluations/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch evaluation');
        }
        const data = await response.json();
        setFormData({
          employeeId: data.employee.id,
          month: data.month,
          year: data.year,
          type: data.type,
          workQuality: data.workQuality,
          workQuantity: data.workQuantity,
          knowledge: data.knowledge,
          initiative: data.initiative,
          teamwork: data.teamwork,
          communication: data.communication,
          punctuality: data.punctuality,
          management: data.management,
          reliability: data.reliability,
          otherFactors: data.otherFactors,
          comments: data.comments || '',
        });
      } catch (error) {
        console.error('Error fetching evaluation:', error);
        setError('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [params.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.includes('work') || name.includes('Factor') || 
        name === 'knowledge' || name === 'initiative' || 
        name === 'teamwork' || name === 'communication' || 
        name === 'punctuality' || name === 'management' || 
        name === 'reliability') {
      // Handle score inputs
      if (value === '') {
        setFormData((prev) => prev ? ({
          ...prev,
          [name]: ''
        }) : null);
        return;
      }

      // Allow typing decimal point and numbers
      if (value === '.' || value.endsWith('.')) {
        setFormData((prev) => prev ? ({
          ...prev,
          [name]: value
        }) : null);
        return;
      }

      const numValue = parseFloat(value);
      // Check if it's a valid number
      if (!isNaN(numValue)) {
        setFormData((prev) => prev ? ({
          ...prev,
          [name]: value
        }) : null);
      }
    } else {
      setFormData((prev) => prev ? ({
        ...prev,
        [name]: value
      }) : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/evaluations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update evaluation');
      }

      router.push(`/dashboard/evaluations/${params.id}`);
    } catch (error) {
      console.error('Error updating evaluation:', error);
      setError('Failed to update evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) {
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
          ← Back
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Edit Evaluation
          </h3>
          
          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Evaluation Criteria</h4>
              <p className="text-sm text-gray-500 mb-4">
                Rate each criterion from 0 to 50 (decimals allowed, e.g. 47.5)
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {criteriaFields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      id={field.name}
                      name={field.name}
                      required
                      placeholder="0-50"
                      value={formData[field.name as keyof EvaluationFormData]}
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === '.') {
                          setFormData(prev => prev ? ({
                            ...prev,
                            [field.name]: ''
                          }) : null);
                          return;
                        }
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue < 0) {
                          setFormData(prev => prev ? ({
                            ...prev,
                            [field.name]: 0
                          }) : null);
                        } else if (numValue > 50) {
                          setFormData(prev => prev ? ({
                            ...prev,
                            [field.name]: 50
                          }) : null);
                        } else {
                          // Round to 1 decimal place on blur
                          const roundedValue = Math.round(numValue * 10) / 10;
                          setFormData(prev => prev ? ({
                            ...prev,
                            [field.name]: roundedValue
                          }) : null);
                        }
                      }}
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
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
