import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';

// Custom error class for better error handling
class BulkOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkOperationError';
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

    // Validate the incoming data structure
    if (!Array.isArray(data)) {
      throw new BulkOperationError('Invalid data format. Expected an array of evaluations.');
    }

    // Process each evaluation
    const results = await Promise.all(
      data.map(async (evaluation) => {
        try {
          // Validate required fields
          if (!evaluation.employeeId || !evaluation.evaluatorId) {
            return {
              success: false,
              error: 'Missing required fields: employeeId or evaluatorId',
            };
          }

          // Find the employee by employee ID
          const employee = await prisma.user.findUnique({
            where: { employeeId: evaluation.employeeId },
          });

          if (!employee) {
            return {
              success: false,
              error: `Employee with ID ${evaluation.employeeId} not found`,
            };
          }

          // Calculate scores and ratios
          const scores = {
            workQuality: parseFloat(evaluation.workQuality) || 0,
            workQuantity: parseFloat(evaluation.workQuantity) || 0,
            knowledge: parseFloat(evaluation.knowledge) || 0,
            initiative: parseFloat(evaluation.initiative) || 0,
            teamwork: parseFloat(evaluation.teamwork) || 0,
            communication: parseFloat(evaluation.communication) || 0,
            punctuality: parseFloat(evaluation.punctuality) || 0,
            management: parseFloat(evaluation.management) || 0,
            reliability: parseFloat(evaluation.reliability) || 0,
            otherFactors: parseFloat(evaluation.otherFactors) || 0,
          };

          const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
          const maxPossibleScore = 500; // 10 categories * 50 points each
          const ratio = totalScore / maxPossibleScore;
          const percentage = ratio * 100;

          // Create the evaluation
          const newEvaluation = await prisma.evaluation.create({
            data: {
              month: parseInt(evaluation.month),
              year: parseInt(evaluation.year),
              employeeId: employee.id,
              evaluatorId: evaluation.evaluatorId,
              type: evaluation.type,
              workQuality: scores.workQuality,
              workQuantity: scores.workQuantity,
              knowledge: scores.knowledge,
              initiative: scores.initiative,
              teamwork: scores.teamwork,
              communication: scores.communication,
              punctuality: scores.punctuality,
              management: scores.management,
              reliability: scores.reliability,
              otherFactors: scores.otherFactors,
              totalScore,
              ratio,
              percentage,
              grade: percentage >= 90 ? 'A' :
                     percentage >= 80 ? 'B' :
                     percentage >= 70 ? 'C' :
                     percentage >= 60 ? 'D' : 'F',
              comments: evaluation.comments || '',
              status: 'PENDING',
            },
          });

          return {
            success: true,
            evaluation: newEvaluation,
          };
        } catch (createError) {
          if (createError instanceof Prisma.PrismaClientKnownRequestError) {
            return {
              success: false,
              error: `Database error: ${createError.message}`,
            };
          }
          return {
            success: false,
            error: createError instanceof Error ? createError.message : 'Failed to create evaluation',
          };
        }
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} evaluations. ${successful} successful, ${failed} failed.`,
      results,
    });
  } catch (error) {
    console.error('Bulk import error:', error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle our custom errors
    if (error instanceof BulkOperationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to process bulk import';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow HR and Admin to access bulk data
    if (!['ADMIN', 'HR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || '0');

    // Build the where clause
    const where: any = { year };
    if (month > 0) {
      where.month = month;
    }

    // Fetch evaluations with related data
    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            nameEn: true,
            nameKh: true,
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
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!evaluations) {
      return NextResponse.json(
        { error: 'No evaluations found' },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Bulk export error:', error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle our custom errors
    if (error instanceof BulkOperationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evaluation data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
