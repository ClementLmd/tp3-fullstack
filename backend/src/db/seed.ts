import { query } from './connection';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create a test teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacherResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['teacher@example.com', teacherPassword, 'John', 'Teacher', 'TEACHER']
    );

    // Create a test student
    const studentPassword = await bcrypt.hash('student123', 10);
    await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['student@example.com', studentPassword, 'Jane', 'Student', 'STUDENT']
    );

    console.log('✅ Seed data created successfully');
    console.log('📝 Test accounts:');
    console.log('   Teacher: teacher@example.com / teacher123');
    console.log('   Student: student@example.com / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

