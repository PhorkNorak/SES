import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const departments = await prisma.department.findMany({
      include: {
        users: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get managers for each department
    const departmentsWithManagers = await Promise.all(
      departments.map(async (dept) => {
        const manager = await prisma.user.findUnique({
          where: { id: dept.managerId },
          select: {
            nameEn: true,
            nameKh: true,
          },
        });

        return {
          id: dept.id,
          name: dept.name,
          manager_id: dept.managerId,
          manager: manager ? {
            name_en: manager.nameEn,
            name_kh: manager.nameKh,
          } : null,
          _count: {
            users: dept.users.length,
          },
        };
      })
    );

    return NextResponse.json(departmentsWithManagers);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch departments' },
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
    if (!data.name || !data.managerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        managerId: data.managerId,
      },
      include: {
        users: true,
      },
    });

    // Get manager details
    const manager = await prisma.user.findUnique({
      where: { id: department.managerId },
      select: {
        nameEn: true,
        nameKh: true,
      },
    });

    // Transform the response
    const transformedDepartment = {
      id: department.id,
      name: department.name,
      manager_id: department.managerId,
      manager: manager ? {
        name_en: manager.nameEn,
        name_kh: manager.nameKh,
      } : null,
      _count: {
        users: department.users.length,
      },
    };

    return NextResponse.json(transformedDepartment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create department' },
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
    if (!data.id || !data.name || !data.managerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        managerId: data.managerId,
      },
      include: {
        users: true,
      },
    });

    // Get manager details
    const manager = await prisma.user.findUnique({
      where: { id: department.managerId },
      select: {
        nameEn: true,
        nameKh: true,
      },
    });

    // Transform the response
    const transformedDepartment = {
      id: department.id,
      name: department.name,
      manager_id: department.managerId,
      manager: manager ? {
        name_en: manager.nameEn,
        name_kh: manager.nameKh,
      } : null,
      _count: {
        users: department.users.length,
      },
    };

    return NextResponse.json(transformedDepartment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update department' },
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
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Check if department has users
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    if (department.users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with active users' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
