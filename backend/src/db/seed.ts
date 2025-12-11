import { query } from './connection';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create teachers
    const teacher1Password = await bcrypt.hash('teacher123', 10);
    const teacher1Result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['teacher1@example.com', teacher1Password, 'John', 'Smith', 'TEACHER']
    );

    const teacher2Password = await bcrypt.hash('teacher123', 10);
    const teacher2Result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['teacher2@example.com', teacher2Password, 'Sarah', 'Johnson', 'TEACHER']
    );

    // Create students
    const student1Password = await bcrypt.hash('student123', 10);
    const student1Result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['student1@example.com', student1Password, 'Alice', 'Brown', 'STUDENT']
    );

    const student2Password = await bcrypt.hash('student123', 10);
    const student2Result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['student2@example.com', student2Password, 'Bob', 'Wilson', 'STUDENT']
    );

    const student3Password = await bcrypt.hash('student123', 10);
    const student3Result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['student3@example.com', student3Password, 'Carol', 'Davis', 'STUDENT']
    );

    const teacher1Id = teacher1Result.rows[0]?.id || 'error';
    const teacher2Id = teacher2Result.rows[0]?.id || 'error';
    const student1Id = student1Result.rows[0]?.id || 'error';
    const student2Id = student2Result.rows[0]?.id || 'error';
    const student3Id = student3Result.rows[0]?.id || 'error';

    // Create quizzes by teacher1
    const quiz1Result = await query(
      `INSERT INTO quizzes (title, description, creator_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['Mathematics Basics', 'A quiz covering basic mathematical concepts', teacher1Id]
    );

    const quiz2Result = await query(
      `INSERT INTO quizzes (title, description, creator_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['Science Fundamentals', 'An introduction to basic science principles', teacher1Id]
    );

    // Create quizzes by teacher2
    const quiz3Result = await query(
      `INSERT INTO quizzes (title, description, creator_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['History 101', 'Key historical events and dates', teacher2Id]
    );

    const quiz1Id = quiz1Result.rows[0]?.id || 'error';
    const quiz2Id = quiz2Result.rows[0]?.id || 'error';
    const quiz3Id = quiz3Result.rows[0]?.id || 'error';

    // Create questions for quiz1
    await query(
      `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        quiz1Id,
        'What is 2 + 2?',
        'MULTIPLE_CHOICE',
        JSON.stringify({ choices: ['3', '4', '5', '6'], correctAnswer: 1 }),
        '4',
        1,
        10,
        30
      ]
    );

    await query(
      `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        quiz1Id,
        'Is 5 * 3 equal to 15?',
        'TRUE_FALSE',
        null,
        'true',
        2,
        10,
        20
      ]
    );

    // Create questions for quiz2
    await query(
      `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        quiz2Id,
        'What is the chemical symbol for gold?',
        'MULTIPLE_CHOICE',
        JSON.stringify({ choices: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 2 }),
        'Au',
        1,
        10,
        30
      ]
    );

    // Create questions for quiz3
    await query(
      `INSERT INTO questions (quiz_id, text, type, options, correct_answer, "order", points, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        quiz3Id,
        'Was the signing of the Declaration of Independence in 1776?',
        'TRUE_FALSE',
        null,
        'true',
        1,
        10,
        30
      ]
    );

    // Create sessions
    const session1Result = await query(
      `INSERT INTO sessions (quiz_id, access_code, is_active, current_question_index, started_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (access_code) DO NOTHING
       RETURNING id`,
      [quiz1Id, 'ABC123', true, 0, new Date()]
    );

    const session2Result = await query(
      `INSERT INTO sessions (quiz_id, access_code, is_active, current_question_index, started_at, ended_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (access_code) DO NOTHING
       RETURNING id`,
      [quiz2Id, 'DEF456', false, 1, new Date(Date.now() - 3600000), new Date(Date.now() - 1800000)]
    );

    const session3Result = await query(
      `INSERT INTO sessions (quiz_id, access_code, is_active, current_question_index, started_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (access_code) DO NOTHING
       RETURNING id`,
      [quiz3Id, 'GHI789', true, 0, new Date()]
    );

    const session1Id = session1Result.rows[0]?.id || 'error';
    const session2Id = session2Result.rows[0]?.id || 'error';
    const session3Id = session3Result.rows[0]?.id || 'error';

    // Create participations
    const part1Result = await query(
      `INSERT INTO participations (session_id, user_id, score, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING id`,
      [session1Id, student1Id, 15, new Date()]
    );

    const part2Result = await query(
      `INSERT INTO participations (session_id, user_id, score, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING id`,
      [session1Id, student2Id, 18, new Date()]
    );

    const part3Result = await query(
      `INSERT INTO participations (session_id, user_id, score, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING id`,
      [session2Id, student1Id, 20, new Date()]
    );

    const part4Result = await query(
      `INSERT INTO participations (session_id, user_id, score, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING id`,
      [session2Id, student2Id, 17, new Date()]
    );

    const part5Result = await query(
      `INSERT INTO participations (session_id, user_id, score, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id) DO NOTHING
       RETURNING id`,
      [session3Id, student3Id, 10, new Date()]
    );

    const part1Id = part1Result.rows[0]?.id || 'error';
    const part2Id = part2Result.rows[0]?.id || 'error';
    const part3Id = part3Result.rows[0]?.id || 'error';
    const part4Id = part4Result.rows[0]?.id || 'error';
    const part5Id = part5Result.rows[0]?.id || 'error';

    // Get question IDs for answers
    const questionsResult = await query(
      `SELECT id FROM questions ORDER BY created_at`
    );

    if (questionsResult.rows.length >= 3) {
      const [q1, q2, q3] = questionsResult.rows;

      // Create answers
      await query(
        `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q1.id, part1Id, '4', true, 10]
      );

      await query(
        `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q2.id, part1Id, 'true', true, 5]
      );

      await query(
        `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q1.id, part2Id, '4', true, 10]
      );

      await query(
        `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q2.id, part2Id, 'true', true, 8]
      );

      await query(
        `INSERT INTO answers (question_id, participation_id, answer, is_correct, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q3.id, part3Id, 'Au', true, 10]
      );
    }

    console.log('✅ Seed data created successfully');
    console.log('📝 Test accounts:');
    console.log('   Teacher 1: teacher1@example.com / teacher123');
    console.log('   Teacher 2: teacher2@example.com / teacher123');
    console.log('   Student 1: student1@example.com / student123');
    console.log('   Student 2: student2@example.com / student123');
    console.log('   Student 3: student3@example.com / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

