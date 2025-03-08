import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';

interface DepartmentAverage {
  name: string;
  percentage: number;
  count: number;
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

export async function GET() {
  // Initialize response data with defaults
  const analyticsData: AnalyticsData = {
    overall: {
      totalEvaluations: 0,
      averageScore: 0,
      averagePercentage: 0,
    },
    gradeDistribution: [],
    monthlyAverages: [],
    departmentAverages: [],
  };

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get overall statistics
    try {
      const overallStats = await prisma.evaluation.aggregate({
        _count: {
          id: true,
        },
        _avg: {
          totalScore: true,
          percentage: true,
        },
      });

      if (overallStats) {
        analyticsData.overall = {
          totalEvaluations: Number(overallStats._count.id) || 0,
          averageScore: Number((overallStats._avg.totalScore || 0).toFixed(2)),
          averagePercentage: Number((overallStats._avg.percentage || 0).toFixed(2)),
        };
      }
    } catch (error) {
      // Continue with default values
    }

    // Get grade distribution
    try {
      const gradeDistribution = await prisma.evaluation.groupBy({
        by: ['grade'],
        _count: {
          id: true,
        },
        orderBy: {
          grade: 'asc',
        },
      });

      if (gradeDistribution) {
        analyticsData.gradeDistribution = gradeDistribution.map(grade => ({
          grade: grade.grade || 'N/A',
          count: Number(grade._count.id) || 0,
        }));
      }
    } catch (error) {
      // Continue with default values
    }

    // Get monthly averages
    try {
      const monthlyAverages = await prisma.evaluation.groupBy({
        by: ['month'],
        _avg: {
          percentage: true,
        },
        orderBy: {
          month: 'asc',
        },
      });

      if (monthlyAverages) {
        analyticsData.monthlyAverages = monthlyAverages.map(month => ({
          month: month.month || 1,
          percentage: Number((month._avg.percentage || 0).toFixed(2)),
        }));
      }
    } catch (error) {
      // Continue with default values
    }

    // Get department performance
    try {
      const departmentAverages = await prisma.$queryRaw<DepartmentAverage[]>`
        SELECT 
          d.name,
          ROUND(CAST(AVG(e.percentage) AS FLOAT), 2) as percentage,
          COUNT(e.id) as count
        FROM evaluations e
        JOIN users u ON e.employee_id = u.id
        JOIN departments d ON u.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY percentage DESC
      `;

      if (departmentAverages && Array.isArray(departmentAverages)) {
        analyticsData.departmentAverages = departmentAverages.map(dept => ({
          name: dept.name || 'Unknown',
          percentage: Number(dept.percentage || 0),
          count: Number(dept.count || 0),
        }));
      }
    } catch (error) {
      // Continue with default values
    }

    return NextResponse.json(analyticsData);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
