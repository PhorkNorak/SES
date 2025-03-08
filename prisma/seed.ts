const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test department
    const itDepartment = await prisma.department.create({
      data: {
        name: 'IT Department',
        managerId: '00000000-0000-0000-0000-000000000000', // Will update this after creating admin user
      },
    });

    console.log('Created department:', itDepartment);

    // Create admin user
    const adminPassword = await hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        employeeId: 'EMP001',
        nameEn: 'Admin User',
        nameKh: 'អ្នកគ្រប់គ្រង',
        gender: 'MALE',
        role: 'ADMIN',
        position: 'System Administrator',
        joinDate: new Date(),
        email: 'admin@example.com',
        passwordHash: adminPassword,
        departmentId: itDepartment.id,
      },
    });

    console.log('Created admin user:', admin);

    // Update department with admin as manager
    await prisma.department.update({
      where: { id: itDepartment.id },
      data: { managerId: admin.id },
    });

    console.log('Updated department manager');

    // Create test user
    const userPassword = await hash('user123', 12);
    const user = await prisma.user.create({
      data: {
        employeeId: 'EMP002',
        nameEn: 'Test User',
        nameKh: 'អ្នកប្រើប្រាស់',
        gender: 'FEMALE',
        role: 'STAFF',
        position: 'Software Developer',
        joinDate: new Date(),
        email: 'user@example.com',
        passwordHash: userPassword,
        departmentId: itDepartment.id,
      },
    });

    console.log('Created staff user:', user);

    // Create some test evaluations
    const evaluations = await Promise.all([
      prisma.evaluation.create({
        data: {
          month: 1,
          year: 2024,
          employeeId: user.id,
          evaluatorId: admin.id,
          type: 'SUPERVISOR',
          workQuality: 8.5,
          workQuantity: 8.0,
          knowledge: 8.5,
          initiative: 7.5,
          teamwork: 9.0,
          communication: 8.0,
          punctuality: 9.0,
          management: 7.5,
          reliability: 8.5,
          otherFactors: 8.0,
          totalScore: 82.5,
          ratio: 1.0,
          percentage: 82.5,
          grade: 'B+',
          comments: 'Good performance overall',
          status: 'COMPLETED',
        },
      }),
      prisma.evaluation.create({
        data: {
          month: 2,
          year: 2024,
          employeeId: user.id,
          evaluatorId: admin.id,
          type: 'SUPERVISOR',
          workQuality: 8.0,
          workQuantity: 8.0,
          knowledge: 8.0,
          initiative: 8.0,
          teamwork: 8.0,
          communication: 8.0,
          punctuality: 8.0,
          management: 8.0,
          reliability: 8.0,
          otherFactors: 8.0,
          totalScore: 80.0,
          ratio: 1.0,
          percentage: 80.0,
          grade: 'B',
          status: 'PENDING',
        },
      }),
    ]);

    console.log('Created evaluations:', evaluations);
  } catch (error) {
    console.error('Error in seed script:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
