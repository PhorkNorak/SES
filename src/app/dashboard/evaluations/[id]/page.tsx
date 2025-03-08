'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Evaluation {
  id: string;
  month: number;
  year: number;
  type: string;
  status: string;
  workQuality: number;
  workQuantity: number;
  knowledge: number;
  initiative: number;
  teamwork: number;
  communication: number;
  punctuality: number;
  management: number;
  reliability: number;
  otherFactors: number;
  totalScore: number;
  ratio: number;
  percentage: number;
  grade: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    nameEn: string;
    nameKh: string;
    employeeId: string;
    position: string;
    department: {
      name: string;
    };
  };
  evaluator: {
    nameEn: string;
    position: string;
  };
  evaluatorId: string;
}

export default function EvaluationDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evaluations/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch evaluation');
      }
      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      setError('Failed to load evaluation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [params.id]);

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!evaluation) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/evaluations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update evaluation status');
      }

      await fetchEvaluation();
    } catch (error) {
      console.error('Error updating evaluation status:', error);
      setError('Failed to update evaluation status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/evaluations/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete evaluation');
      }

      router.push('/dashboard/evaluations');
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      setError('Failed to delete evaluation');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center p-4">
        Evaluation not found
      </div>
    );
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return 'bg-green-100 text-green-800';
      case 'INCOMPLETE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const criteriaItems = [
    { label: 'Work Quality', value: evaluation.workQuality },
    { label: 'Work Quantity', value: evaluation.workQuantity },
    { label: 'Knowledge', value: evaluation.knowledge },
    { label: 'Initiative', value: evaluation.initiative },
    { label: 'Teamwork', value: evaluation.teamwork },
    { label: 'Communication', value: evaluation.communication },
    { label: 'Punctuality', value: evaluation.punctuality },
    { label: 'Management', value: evaluation.management },
    { label: 'Reliability', value: evaluation.reliability },
    { label: 'Other Factors', value: evaluation.otherFactors },
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

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Evaluation Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {getMonthName(evaluation.month)} {evaluation.year}
            </p>
          </div>
          {session?.user?.role === 'ADMIN' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Evaluation'}
            </button>
          )}
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Evaluation Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {getMonthName(evaluation.month)} {evaluation.year}
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Employee Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {evaluation.employee.nameEn}
                <br />
                <span className="text-gray-500">{evaluation.employee.nameKh}</span>
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{evaluation.employee.employeeId}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{evaluation.employee.position}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{evaluation.employee.department.name}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Evaluator</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {evaluation.evaluator.nameEn}
                <br />
                <span className="text-gray-500">{evaluation.evaluator.position}</span>
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(evaluation.status)}`}>
                  {evaluation.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Evaluation Criteria
            </h3>
            {(session?.user?.role === 'ADMIN' || evaluation?.evaluatorId === session?.user?.id) && (
              <button
                onClick={() => router.push(`/dashboard/evaluations/${evaluation?.id}/edit`)}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                aria-label={`Edit evaluation for ${evaluation?.employee?.nameEn} - ${evaluation?.month}/${evaluation?.year}`}
                title="Edit Evaluation"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {criteriaItems.map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 px-4 py-3 rounded-lg"
              >
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {item.value.toFixed(2)}
                </dd>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-indigo-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-indigo-500">Total Score</dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-600">
                {evaluation.totalScore.toFixed(2)}
              </dd>
            </div>
            <div className="bg-indigo-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-indigo-500">Final Percentage</dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-600">
                {evaluation.percentage.toFixed(2)}%
              </dd>
            </div>
            <div className="bg-indigo-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-indigo-500">Grade</dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-600">
                {evaluation.grade}
              </dd>
            </div>
          </div>

          {evaluation.comments && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Comments</h4>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{evaluation.comments}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4 sm:flex sm:space-x-4 sm:space-y-0">
          {/* Department Head Actions */}
          {session?.user?.role === 'DEPARTMENT_HEAD' && evaluation?.status === 'PENDING' && (
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusUpdate('APPROVED')}
                disabled={updating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                aria-label="Approve evaluation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {updating ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={updating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-200"
                aria-label="Reject evaluation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {updating ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
