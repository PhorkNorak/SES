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

    const evaluations = await prisma.evaluation.findMany({
      where: {
        employeeId: session.user.id,
      },
      select: {
        id: true,
        month: true,
        year: true,
        type: true,
        status: true,
        percentage: true,
        grade: true,
        evaluator: {
          select: {
            nameEn: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    // Convert decimal fields to numbers
    const formattedEvaluations = evaluations.map(evaluation => ({
      ...evaluation,
      percentage: Number(evaluation.percentage),
    }));

    return NextResponse.json(formattedEvaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
