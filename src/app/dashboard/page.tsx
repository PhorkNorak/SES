'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';

interface DashboardData {
  totalComplete: number;
  totalIncomplete: number;
  totalStaff: number;
  highestScore: {
    score: number;
    staffName: string;
    staffNameKh: string;
  } | null;
  lowestScore: {
    score: number;
    staffName: string;
    staffNameKh: string;
  } | null;
}

interface AnalyticsData {
  overall: {
    totalEvaluations: number;
    averageScore: number;
    averagePercentage: number;
  };
  gradeDistribution: Array<{
    grade: string;
    count: number;
  }>;
  monthlyAverages: Array<{
    month: number;
    percentage: number;
  }>;
  departmentAverages: Array<{
    name: string;
    percentage: number;
    count: number;
  }>;
}

const COLORS = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#6366F1'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      Promise.all([
        fetchDashboardData(),
        fetchAnalyticsData()
      ]);
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/dashboard/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const analytics = await response.json();
      setAnalyticsData(analytics);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  if (!data || !analyticsData) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Staff</h2>
          <p className="text-3xl font-bold text-indigo-600">{data.totalStaff}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Complete</h2>
          <p className="text-3xl font-bold text-green-600">{data.totalComplete}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Incomplete</h2>
          <p className="text-3xl font-bold text-red-600">{data.totalStaff - data.totalComplete}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Average Score</h2>
          <p className="text-3xl font-bold text-blue-600">{analyticsData.overall.averageScore.toFixed(1)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Average %</h2>
          <p className="text-3xl font-bold text-purple-600">{analyticsData.overall.averagePercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Grade Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Grade Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.gradeDistribution}
                  dataKey="count"
                  nameKey="grade"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analyticsData.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Monthly Performance Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.monthlyAverages.map(item => ({
                  ...item,
                  month: MONTHS[item.month - 1]
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4F46E5"
                  name="Performance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Department Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData.departmentAverages}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="percentage" name="Average %" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Performance Highlights</h2>
          <div className="space-y-4">
            {data.highestScore && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Highest Performance</h3>
                <p className="text-green-600">
                  {data.highestScore.staffName} ({data.highestScore.staffNameKh})
                </p>
                <p className="text-green-700 font-bold">{Number(data.highestScore.score).toFixed(2)}%</p>
              </div>
            )}
            {data.lowestScore && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800">Needs Improvement</h3>
                <p className="text-red-600">
                  {data.lowestScore.staffName} ({data.lowestScore.staffNameKh})
                </p>
                <p className="text-red-700 font-bold">{Number(data.lowestScore.score).toFixed(2)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
