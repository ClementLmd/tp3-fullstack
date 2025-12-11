# Socket.io Quiz Management Guide

This document explains how to use the Socket.io real-time quiz management features for teachers.

## Overview

Teachers can create, update, and delete quizzes in real-time using Socket.io events. All quiz management operations are authenticated and broadcast to other connected teachers.

## Authentication

Before using any quiz management features, clients must authenticate their socket connection by providing a JWT token:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

Alternatively, you can pass the token in the authorization header or query params:
- Header: `Authorization: Bearer <token>`
- Query: `?token=<token>`

## Events

### Client to Server Events

#### 1. createQuiz

Creates a new quiz with questions.

```javascript
socket.emit('createQuiz', {
  title: 'My Quiz',
  description: 'Quiz description',
  questions: [
    {
      text: 'What is 2+2?',
      type: 'MULTIPLE_CHOICE',
      options: {
        choices: ['3', '4', '5'],
        correctAnswer: 1  // Index of correct answer
      },
      order: 0,
      points: 1,
      timeLimit: 30  // seconds
    },
    {
      text: 'Is the sky blue?',
      type: 'TRUE_FALSE',
      correctAnswer: 'true',
      order: 1,
      points: 1
    },
    {
      text: 'What is the capital of France?',
      type: 'TEXT',
      correctAnswer: 'Paris',
      order: 2,
      points: 1
    }
  ]
}, (response) => {
  if (response.success) {
    console.log('Quiz created:', response.quiz);
  } else {
    console.error('Error:', response.error);
  }
});
```

#### 2. updateQuiz

Updates an existing quiz.

```javascript
socket.emit('updateQuiz', {
  quizId: 'quiz-uuid-here',
  title: 'Updated Quiz Title',
  description: 'Updated description',
  questions: [
    // Same format as createQuiz
  ]
}, (response) => {
  if (response.success) {
    console.log('Quiz updated:', response.quiz);
  } else {
    console.error('Error:', response.error);
  }
});
```

#### 3. deleteQuiz

Deletes a quiz.

```javascript
socket.emit('deleteQuiz', {
  quizId: 'quiz-uuid-here'
}, (response) => {
  if (response.success) {
    console.log('Quiz deleted successfully');
  } else {
    console.error('Error:', response.error);
  }
});
```

### Server to Client Events

Teachers automatically receive these broadcast events:

#### 1. quizCreated

Emitted when any teacher creates a quiz.

```javascript
socket.on('quizCreated', (quiz) => {
  console.log('New quiz created:', quiz);
  // Update UI to show new quiz
});
```

#### 2. quizUpdated

Emitted when any teacher updates a quiz.

```javascript
socket.on('quizUpdated', (quiz) => {
  console.log('Quiz updated:', quiz);
  // Update UI to reflect changes
});
```

#### 3. quizDeleted

Emitted when any teacher deletes a quiz.

```javascript
socket.on('quizDeleted', (quizId) => {
  console.log('Quiz deleted:', quizId);
  // Remove quiz from UI
});
```

## Question Types

### MULTIPLE_CHOICE

```javascript
{
  text: 'Question text',
  type: 'MULTIPLE_CHOICE',
  options: {
    choices: ['Option 1', 'Option 2', 'Option 3'],
    correctAnswer: 0  // Index of correct choice
  },
  order: 0,
  points: 1,
  timeLimit: 30  // optional
}
```

### TRUE_FALSE

```javascript
{
  text: 'Question text',
  type: 'TRUE_FALSE',
  correctAnswer: 'true',  // or 'false'
  order: 0,
  points: 1,
  timeLimit: 30  // optional
}
```

### TEXT

```javascript
{
  text: 'Question text',
  type: 'TEXT',
  correctAnswer: 'Expected answer',
  order: 0,
  points: 1,
  timeLimit: 30  // optional
}
```

## Error Handling

All socket events return a callback with a response object:

```javascript
{
  success: boolean,
  quiz?: Quiz,      // For create/update operations
  error?: string    // Error message if success is false
}
```

Common errors:
- **"Unauthorized. Only teachers can..."**: User is not a teacher or not authenticated
- **"Title is required."**: Missing or empty title
- **"At least one question is required."**: Questions array is empty or missing
- **"Quiz not found or you do not have permission..."**: Quiz doesn't exist or belongs to another teacher
- **Question validation errors**: Invalid question format (missing fields, invalid types, etc.)

## Security

- All socket connections must be authenticated with a valid JWT token
- Only teachers can create, update, or delete quizzes
- Quiz broadcasts are restricted to the "teachers" room
- Teachers can only update/delete quizzes they created

## Room Management

When a teacher connects, they are automatically added to the "teachers" room:

```javascript
socket.on('connect', () => {
  console.log('Connected and joined teachers room');
});
```

Students do not receive quiz management broadcasts, only teachers do.

## Example: Complete Quiz Management Component

```javascript
import { io } from 'socket.io-client';

class QuizManager {
  constructor(token) {
    this.socket = io('http://localhost:3001', {
      auth: { token }
    });
    
    this.setupListeners();
  }
  
  setupListeners() {
    this.socket.on('quizCreated', (quiz) => {
      console.log('Quiz created:', quiz);
      this.onQuizCreated(quiz);
    });
    
    this.socket.on('quizUpdated', (quiz) => {
      console.log('Quiz updated:', quiz);
      this.onQuizUpdated(quiz);
    });
    
    this.socket.on('quizDeleted', (quizId) => {
      console.log('Quiz deleted:', quizId);
      this.onQuizDeleted(quizId);
    });
  }
  
  createQuiz(data, callback) {
    this.socket.emit('createQuiz', data, callback);
  }
  
  updateQuiz(data, callback) {
    this.socket.emit('updateQuiz', data, callback);
  }
  
  deleteQuiz(quizId, callback) {
    this.socket.emit('deleteQuiz', { quizId }, callback);
  }
  
  onQuizCreated(quiz) {
    // Update UI
  }
  
  onQuizUpdated(quiz) {
    // Update UI
  }
  
  onQuizDeleted(quizId) {
    // Update UI
  }
}

// Usage
const token = localStorage.getItem('authToken');
const quizManager = new QuizManager(token);

quizManager.createQuiz({
  title: 'My Quiz',
  description: 'Description',
  questions: [/* ... */]
}, (response) => {
  if (response.success) {
    console.log('Created:', response.quiz);
  }
});
```

## Testing

Run the socket handler tests:

```bash
cd backend
npm test -- socket
```
