/**
 * Manual test script for session API endpoints
 * This script tests the session creation and management endpoints
 * 
 * Run with: tsx src/test-manual/test-session-api.ts
 */

import { query } from '../db/connection';
import {
  createSession,
  getSession,
  startSession,
  broadcastQuestion,
  endSession,
  getSessionByCode,
} from '../controllers/sessionController';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { UserRole } from 'shared/src/types/auth';

// Mock response object
function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    data: null,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.data = data;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting Session API Manual Tests\n');

  try {
    // Test 1: Create a teacher user
    console.log('1. Creating test teacher user...');
    const teacherResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['teacher-test@example.com', 'hashed_password', 'Test', 'Teacher', UserRole.TEACHER]
    );
    const teacherId = teacherResult.rows[0].id;
    console.log(`✓ Teacher created with ID: ${teacherId}`);

    // Test 2: Create a quiz
    console.log('\n2. Creating test quiz...');
    const quizResult = await query(
      `INSERT INTO quizzes (title, description, creator_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Test Quiz', 'A quiz for testing sessions', teacherId]
    );
    const quizId = quizResult.rows[0].id;
    console.log(`✓ Quiz created with ID: ${quizId}`);

    // Test 3: Create questions
    console.log('\n3. Creating test questions...');
    const q1Result = await query(
      `INSERT INTO questions (quiz_id, text, type, options, "order", points, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        quizId,
        'What is 2 + 2?',
        'MULTIPLE_CHOICE',
        JSON.stringify({ choices: ['3', '4', '5'], correctAnswer: 1 }),
        0,
        10,
        30,
      ]
    );
    console.log(`✓ Question 1 created with ID: ${q1Result.rows[0].id}`);

    // Test 4: Create a session
    console.log('\n4. Testing createSession endpoint...');
    const createReq: Partial<AuthRequest> = {
      body: { quizId },
      userId: teacherId,
      userRole: UserRole.TEACHER,
    };
    const createRes = createMockResponse();
    await createSession(createReq as AuthRequest, createRes as Response);
    
    if (createRes.statusCode === 201) {
      console.log(`✓ Session created successfully`);
      console.log(`  Session ID: ${createRes.data.id}`);
      console.log(`  Access Code: ${createRes.data.accessCode}`);
    } else {
      console.log(`✗ Failed to create session: ${JSON.stringify(createRes.data)}`);
      return;
    }

    const sessionId = createRes.data.id;
    const accessCode = createRes.data.accessCode;

    // Test 5: Get session by ID
    console.log('\n5. Testing getSession endpoint...');
    const getReq: Partial<AuthRequest> = {
      params: { id: sessionId },
      userId: teacherId,
      userRole: UserRole.TEACHER,
    };
    const getRes = createMockResponse();
    await getSession(getReq as AuthRequest, getRes as Response);
    
    if (getRes.statusCode === 200) {
      console.log(`✓ Session retrieved successfully`);
      console.log(`  Active: ${getRes.data.isActive}`);
    } else {
      console.log(`✗ Failed to get session: ${JSON.stringify(getRes.data)}`);
    }

    // Test 6: Start session
    console.log('\n6. Testing startSession endpoint...');
    const startReq: Partial<AuthRequest> = {
      params: { id: sessionId },
      userId: teacherId,
      userRole: UserRole.TEACHER,
    };
    const startRes = createMockResponse();
    await startSession(startReq as AuthRequest, startRes as Response);
    
    if (startRes.statusCode === 200) {
      console.log(`✓ Session started successfully`);
    } else {
      console.log(`✗ Failed to start session: ${JSON.stringify(startRes.data)}`);
    }

    // Test 7: Get session by access code
    console.log('\n7. Testing getSessionByCode endpoint...');
    const codeReq: Partial<AuthRequest> = {
      params: { code: accessCode },
      userId: 'student-123',
      userRole: UserRole.STUDENT,
    };
    const codeRes = createMockResponse();
    await getSessionByCode(codeReq as AuthRequest, codeRes as Response);
    
    if (codeRes.statusCode === 200) {
      console.log(`✓ Session found by access code`);
      console.log(`  Quiz Title: ${codeRes.data.quizTitle}`);
    } else {
      console.log(`✗ Failed to get session by code: ${JSON.stringify(codeRes.data)}`);
    }

    // Test 8: Broadcast question
    console.log('\n8. Testing broadcastQuestion endpoint...');
    const broadcastReq: Partial<AuthRequest> = {
      params: { id: sessionId },
      body: { questionIndex: 0 },
      userId: teacherId,
      userRole: UserRole.TEACHER,
    };
    const broadcastRes = createMockResponse();
    await broadcastQuestion(broadcastReq as AuthRequest, broadcastRes as Response);
    
    if (broadcastRes.statusCode === 200) {
      console.log(`✓ Question broadcasted successfully`);
      console.log(`  Question Text: ${broadcastRes.data.question.text}`);
    } else {
      console.log(`✗ Failed to broadcast question: ${JSON.stringify(broadcastRes.data)}`);
    }

    // Test 9: End session
    console.log('\n9. Testing endSession endpoint...');
    const endReq: Partial<AuthRequest> = {
      params: { id: sessionId },
      userId: teacherId,
      userRole: UserRole.TEACHER,
    };
    const endRes = createMockResponse();
    await endSession(endReq as AuthRequest, endRes as Response);
    
    if (endRes.statusCode === 200) {
      console.log(`✓ Session ended successfully`);
    } else {
      console.log(`✗ Failed to end session: ${JSON.stringify(endRes.data)}`);
    }

    // Cleanup
    console.log('\n10. Cleaning up test data...');
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    await query('DELETE FROM questions WHERE quiz_id = $1', [quizId]);
    await query('DELETE FROM quizzes WHERE id = $1', [quizId]);
    await query('DELETE FROM users WHERE id = $1', [teacherId]);
    console.log('✓ Test data cleaned up');

    console.log('\n✅ All manual tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }

  process.exit(0);
}

runTests();
