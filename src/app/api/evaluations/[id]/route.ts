import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        month: true,
        year: true,
        type: true,
        status: true,
        workQuality: true,
        workQuantity: true,
        knowledge: true,
        initiative: true,
        teamwork: true,
        communication: true,
        punctuality: true,
        management: true,
        reliability: true,
        otherFactors: true,
        totalScore: true,
        ratio: true,
        percentage: true,
        grade: true,
        comments: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            nameEn: true,
            nameKh: true,
            employeeId: true,
            position: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        evaluator: {
          select: {
            nameEn: true,
            position: true,
          },
        },
      },
    });

    if (!evaluation) {
      return new NextResponse(
        JSON.stringify({ error: 'Evaluation not found' }),
        { status: 404 }
      );
    }

    // Check if user has access to this evaluation
    if (
      session.user.role !== 'ADMIN' &&
      evaluation.employee.employeeId !== session.user.id
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // Convert decimal fields to numbers
    const formattedEvaluation = {
      ...evaluation,
      workQuality: Number(evaluation.workQuality),
      workQuantity: Number(evaluation.workQuantity),
      knowledge: Number(evaluation.knowledge),
      initiative: Number(evaluation.initiative),
      teamwork: Number(evaluation.teamwork),
      communication: Number(evaluation.communication),
      punctuality: Number(evaluation.punctuality),
      management: Number(evaluation.management),
      reliability: Number(evaluation.reliability),
      otherFactors: Number(evaluation.otherFactors),
      totalScore: Number(evaluation.totalScore),
      ratio: Number(evaluation.ratio),
      percentage: Number(evaluation.percentage),
    };

    return NextResponse.json(formattedEvaluation);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        evaluator: true,
      },
    });

    if (!evaluation) {
      return new NextResponse(
        JSON.stringify({ error: 'Evaluation not found' }),
        { status: 404 }
      );
    }

    // Only allow admins, the original evaluator, or department heads to update
    if (
      session.user.role !== 'ADMIN' &&
      evaluation.evaluatorId !== session.user.id &&
      session.user.role !== 'DEPARTMENT_HEAD'
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // If it's a status update (Complete/Incomplete)
    if (body.status) {
      if (body.status !== 'COMPLETE' && body.status !== 'INCOMPLETE') {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid status value' }),
          { status: 400 }
        );
      }
      const updatedEvaluation = await prisma.evaluation.update({
        where: { id: params.id },
        data: {
          status: body.status,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updatedEvaluation);
    }

    // For regular evaluation updates
    const { 
      workQuality, workQuantity, knowledge, initiative,
      teamwork, communication, punctuality, management,
      reliability, otherFactors, comments
    } = body;

    const scores = [
      workQuality, workQuantity, knowledge, initiative,
      teamwork, communication, punctuality, management,
      reliability, otherFactors
    ].filter(score => score !== '');

    const totalScore = scores.reduce((sum, score) => sum + Number(score), 0);
    const percentage = (totalScore / (scores.length * 50)) * 100;

    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: params.id },
      data: {
        workQuality,
        workQuantity,
        knowledge,
        initiative,
        teamwork,
        communication,
        punctuality,
        management,
        reliability,
        otherFactors,
        totalScore,
        percentage,
        grade,
        comments,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedEvaluation);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
    });

    if (!evaluation) {
      return new NextResponse(
        JSON.stringify({ error: 'Evaluation not found' }),
        { status: 404 }
      );
    }

    await prisma.evaluation.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
