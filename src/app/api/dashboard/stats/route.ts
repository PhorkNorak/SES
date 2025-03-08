import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const [
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      averageScoreResult,
    ] = await Promise.all([
      prisma.evaluation.count(),
      prisma.evaluation.count({
        where: {
          status: 'PENDING',
        },
      }),
      prisma.evaluation.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      prisma.evaluation.aggregate({
        where: {
          status: 'COMPLETED',
        },
        _avg: {
          percentage: true,
        },
      }),
    ]);

    const averageScore = averageScoreResult._avg.percentage 
      ? Number(averageScoreResult._avg.percentage) 
      : 0;

    return NextResponse.json({
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      averageScore,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
