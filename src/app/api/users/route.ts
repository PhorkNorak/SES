import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: role ? { role: role.toUpperCase() } : undefined,
      select: {
        id: true,
        employeeId: true,
        nameEn: true,
        nameKh: true,
        email: true,
        role: true,
        position: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        employeeId: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
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
    if (!data.employee_id || !data.name_en || !data.name_kh || !data.email || !data.password || !data.role || !data.department_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        employeeId: data.employee_id,
        nameEn: data.name_en,
        nameKh: data.name_kh,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
        position: data.position,
        departmentId: data.department_id,
        gender: data.gender || 'MALE', // Default value
        joinDate: data.join_date || new Date(), // Default to current date
      },
      select: {
        id: true,
        employeeId: true,
        nameEn: true,
        nameKh: true,
        email: true,
        role: true,
        position: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform the response
    const transformedUser = {
      id: user.id,
      employee_id: user.employeeId,
      name_en: user.nameEn,
      name_kh: user.nameKh,
      email: user.email,
      role: user.role,
      position: user.position,
      department: user.department,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    if (!data.id || !data.employee_id || !data.name_en || !data.name_kh || !data.email || !data.role || !data.department_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: {
          id: data.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const updateData: any = {
      employeeId: data.employee_id,
      nameEn: data.name_en,
      nameKh: data.name_kh,
      email: data.email,
      role: data.role,
      position: data.position,
      departmentId: data.department_id,
    };

    // Only update password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: {
        id: data.id,
      },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        nameEn: true,
        nameKh: true,
        email: true,
        role: true,
        position: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform the response
    const transformedUser = {
      id: user.id,
      employee_id: user.employeeId,
      name_en: user.nameEn,
      name_kh: user.nameKh,
      email: user.email,
      role: user.role,
      position: user.position,
      department: user.department,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        evaluationsAsEmployee: true,
        evaluationsAsEvaluator: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has any evaluations
    if (user.evaluationsAsEmployee.length > 0 || user.evaluationsAsEvaluator.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with existing evaluations',
          message: 'This user has associated evaluations. Please delete the evaluations first or deactivate the user instead.'
        },
        { status: 400 }
      );
    }

    // Delete the user if no evaluations exist
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
