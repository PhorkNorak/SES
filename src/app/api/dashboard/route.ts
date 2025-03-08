import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total evaluations by status
    const evaluationsByStatus = await prisma.evaluation.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });

    // Get total staff count (all users in the company)
    const totalStaff = await prisma.user.count();

    // Get evaluation with highest score
    const highestScore = await prisma.evaluation.findFirst({
      where: {
        status: 'COMPLETE'
      },
      orderBy: {
        percentage: 'desc'
      },
      select: {
        percentage: true,
        employee: {
          select: {
            nameEn: true,
            nameKh: true
          }
        }
      }
    });

    // Get evaluation with lowest score
    const lowestScore = await prisma.evaluation.findFirst({
      where: {
        status: 'COMPLETE'
      },
      orderBy: {
        percentage: 'asc'
      },
      select: {
        percentage: true,
        employee: {
          select: {
            nameEn: true,
            nameKh: true
          }
        }
      }
    });

    // Format the response
    const totalComplete = evaluationsByStatus.find(e => e.status === 'COMPLETE')?._count._all ?? 0;
    const totalIncomplete = evaluationsByStatus.find(e => e.status === 'INCOMPLETE')?._count._all ?? 0;

    return NextResponse.json({
      totalComplete,
      totalIncomplete,
      totalStaff,
      highestScore: highestScore ? {
        score: highestScore.percentage,
        staffName: highestScore.employee.nameEn,
        staffNameKh: highestScore.employee.nameKh
      } : null,
      lowestScore: lowestScore ? {
        score: lowestScore.percentage,
        staffName: lowestScore.employee.nameEn,
        staffNameKh: lowestScore.employee.nameKh
      } : null
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
