import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // If user is ADMIN, get all evaluations
    // If user is STAFF, get only their evaluations
    const where = session.user.role === 'STAFF' 
      ? { employeeId: session.user.id }
      : {};

    // Get all evaluations
    const evaluations = await prisma.evaluation.findMany({
      where,
      select: {
        id: true,
        month: true,
        year: true,
        type: true,
        status: true,
        percentage: true,
        grade: true,
        employeeId: true,
        employee: {
          select: {
            nameEn: true,
            nameKh: true,
            employeeId: true,
          },
        },
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

    // Ensure percentage is a number or null
    const formattedEvaluations = evaluations.map(item => ({
      ...item,
      percentage: item.percentage ? Number(item.percentage) : null
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'employeeId',
      'type',
      'workQuality',
      'workQuantity',
      'knowledge',
      'initiative',
      'teamwork',
      'communication',
      'punctuality',
      'management',
      'reliability',
      'otherFactors',
      'totalScore',
      'percentage',
      'grade',
      'evaluatorId'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const scoreFields = [
      'workQuality', 'workQuantity', 'knowledge', 'initiative',
      'teamwork', 'communication', 'punctuality', 'management',
      'reliability', 'otherFactors'
    ];

    const invalidScoreFields = scoreFields.filter(field => {
      const value = Number(data[field]);
      return isNaN(value) || value < 0 || value > 50;
    });

    if (invalidScoreFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid score values for fields: ${invalidScoreFields.join(', ')}. Values must be between 0 and 50.` },
        { status: 400 }
      );
    }

    // Validate totalScore and percentage
    if (isNaN(Number(data.totalScore)) || Number(data.totalScore) < 0) {
      return NextResponse.json(
        { error: 'Total score must be a positive number' },
        { status: 400 }
      );
    }

    if (isNaN(Number(data.percentage)) || Number(data.percentage) < 0 || Number(data.percentage) > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Create the evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        employeeId: data.employeeId,
        evaluatorId: data.evaluatorId,
        month: currentMonth,
        year: currentYear,
        type: data.type,
        status: 'COMPLETE',
        workQuality: Number(data.workQuality),
        workQuantity: Number(data.workQuantity),
        knowledge: Number(data.knowledge),
        initiative: Number(data.initiative),
        teamwork: Number(data.teamwork),
        communication: Number(data.communication),
        punctuality: Number(data.punctuality),
        management: Number(data.management),
        reliability: Number(data.reliability),
        otherFactors: Number(data.otherFactors),
        totalScore: Number(data.totalScore),
        ratio: 1,
        percentage: Number(data.percentage),
        grade: data.grade,
        comments: data.comments || '',
      },
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('Error creating evaluation:', error);
    
    // Check if it's a Prisma error
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: error.message,
          code: error.code 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
