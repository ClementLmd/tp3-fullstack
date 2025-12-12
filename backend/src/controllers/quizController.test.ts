import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { getClient, query } from "../db/connection";
import quizRoutes from "../routes/quiz";
import { authenticateToken } from "../middleware/auth";
import { QuestionType, UserRole } from "shared/src/types";

// Mock express app for testing
const app = express();
app.use(express.json());

// Middleware setup
app.use((req: any, res, next) => {
  // Mock auth middleware for tests
  if (req.headers.authorization === "Bearer teacher-token") {
    req.userId = "teacher-id";
    req.userRole = UserRole.TEACHER;
    next();
  } else if (req.headers.authorization === "Bearer student-token") {
    req.userId = "student-id";
    req.userRole = UserRole.STUDENT;
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.use("/api/quizzes", quizRoutes);

describe("Quiz Controller Tests", () => {
  const teacherToken = "Bearer teacher-token";
  const studentToken = "Bearer student-token";
  let quizId: string;

  beforeAll(async () => {
    // Setup: Create test user in database
    try {
      const hashedPassword = "$2b$10$test"; // Mock hashed password
      await query(
        `INSERT INTO users (id, email, password, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        ["teacher-id", "teacher@test.com", hashedPassword, "Test", "Teacher", UserRole.TEACHER]
      );

      await query(
        `INSERT INTO users (id, email, password, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        ["student-id", "student@test.com", hashedPassword, "Test", "Student", UserRole.STUDENT]
      );
    } catch (err) {
      console.error("Setup error:", err);
    }
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    try {
      await query(`DELETE FROM quizzes WHERE creator_id = $1`, ["teacher-id"]);
      await query(`DELETE FROM users WHERE id = $1`, ["teacher-id"]);
      await query(`DELETE FROM users WHERE id = $1`, ["student-id"]);
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  });

  describe("POST /api/quizzes - Create Quiz", () => {
    it("should create a new quiz with multiple choice question", async () => {
      const newQuiz = {
        title: "Math Quiz",
        description: "Basic math questions",
        questions: [
          {
            text: "What is 2 + 2?",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["3", "4", "5"],
              correctAnswer: 1,
            },
            points: 5,
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(newQuiz)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Math Quiz");
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
      
      quizId = response.body.id;
    });

    it("should create a quiz with true/false question", async () => {
      const newQuiz = {
        title: "General Knowledge",
        description: "True or False questions",
        questions: [
          {
            text: "The Earth is flat?",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "false",
            points: 3,
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(newQuiz)
        .expect(201);

      expect(response.body.questions[0].type).toBe(QuestionType.TRUE_FALSE);
      expect(response.body.questions[0].correctAnswer).toBe("false");
    });

    it("should create a quiz with text question", async () => {
      const newQuiz = {
        title: "Essay Quiz",
        description: "Essay questions",
        questions: [
          {
            text: "What is your name?",
            type: QuestionType.TEXT,
            correctAnswer: "John Doe",
            points: 10,
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(newQuiz)
        .expect(201);

      expect(response.body.questions[0].type).toBe(QuestionType.TEXT);
    });

    it("should create a quiz with mixed question types", async () => {
      const newQuiz = {
        title: "Comprehensive Quiz",
        description: "All question types",
        questions: [
          {
            text: "What is the capital of France?",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["London", "Paris", "Berlin"],
              correctAnswer: 1,
            },
            points: 5,
          },
          {
            text: "The Eiffel Tower is in France?",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            points: 3,
          },
          {
            text: "Describe the architecture of the Eiffel Tower",
            type: QuestionType.TEXT,
            correctAnswer: "Iron lattice tower",
            points: 10,
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(newQuiz)
        .expect(201);

      expect(response.body.questions).toHaveLength(3);
      expect(response.body.questions[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(response.body.questions[1].type).toBe(QuestionType.TRUE_FALSE);
      expect(response.body.questions[2].type).toBe(QuestionType.TEXT);
    });

    it("should return 400 if title is missing", async () => {
      const invalidQuiz = {
        description: "Missing title",
        questions: [
          {
            text: "Question",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["A", "B"],
              correctAnswer: 0,
            },
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should return 400 if no questions provided", async () => {
      const invalidQuiz = {
        title: "No Questions Quiz",
        questions: [],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should return 400 if question is invalid", async () => {
      const invalidQuiz = {
        title: "Invalid Question Quiz",
        questions: [
          {
            text: "Missing type",
            // type is missing
            correctAnswer: "answer",
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should return 401 if not authenticated", async () => {
      const newQuiz = {
        title: "Unauthorized Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .send(newQuiz)
        .expect(401);
    });

    it("should return 403 if student tries to create quiz", async () => {
      const newQuiz = {
        title: "Student Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", studentToken)
        .send(newQuiz)
        .expect(403);
    });
  });

  describe("GET /api/quizzes - List Quizzes", () => {
    it("should return list of quizzes for authenticated teacher", async () => {
      const response = await request(app)
        .get("/api/quizzes")
        .set("Authorization", teacherToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("questionCount");
    });

    it("should return 401 if not authenticated", async () => {
      await request(app)
        .get("/api/quizzes")
        .expect(401);
    });

    it("should return 403 if student tries to list quizzes", async () => {
      await request(app)
        .get("/api/quizzes")
        .set("Authorization", studentToken)
        .expect(403);
    });
  });

  describe("GET /api/quizzes/:id - Get Quiz Details", () => {
    it("should return quiz with all questions", async () => {
      const response = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set("Authorization", teacherToken)
        .expect(200);

      expect(response.body.id).toBe(quizId);
      expect(response.body).toHaveProperty("title");
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions.length).toBeGreaterThan(0);
    });

    it("should return 404 if quiz not found", async () => {
      await request(app)
        .get("/api/quizzes/nonexistent-id")
        .set("Authorization", teacherToken)
        .expect(404);
    });

    it("should return 401 if not authenticated", async () => {
      await request(app)
        .get(`/api/quizzes/${quizId}`)
        .expect(401);
    });

    it("should return 403 if student tries to get another's quiz", async () => {
      // Assuming student cannot access teacher's quiz
      await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set("Authorization", studentToken)
        .expect(403);
    });
  });

  describe("PUT /api/quizzes/:id - Update Quiz", () => {
    it("should update quiz title and description", async () => {
      const updatedQuiz = {
        title: "Updated Math Quiz",
        description: "Updated description",
        questions: [
          {
            text: "What is 5 + 5?",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["8", "10", "12"],
              correctAnswer: 1,
            },
            points: 5,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set("Authorization", teacherToken)
        .send(updatedQuiz)
        .expect(200);

      expect(response.body.title).toBe("Updated Math Quiz");
      expect(response.body.description).toBe("Updated description");
    });

    it("should add more questions to quiz", async () => {
      const updatedQuiz = {
        title: "Extended Math Quiz",
        questions: [
          {
            text: "What is 2 + 2?",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["3", "4", "5"],
              correctAnswer: 1,
            },
            points: 5,
          },
          {
            text: "What is 10 - 5?",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["3", "5", "7"],
              correctAnswer: 1,
            },
            points: 5,
          },
          {
            text: "Mathematics is interesting?",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            points: 3,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set("Authorization", teacherToken)
        .send(updatedQuiz)
        .expect(200);

      expect(response.body.questions).toHaveLength(3);
    });

    it("should return 404 if quiz not found", async () => {
      const updatedQuiz = {
        title: "Not Found Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      await request(app)
        .put("/api/quizzes/nonexistent-id")
        .set("Authorization", teacherToken)
        .send(updatedQuiz)
        .expect(404);
    });

    it("should return 400 if validation fails", async () => {
      const invalidQuiz = {
        title: "",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should return 401 if not authenticated", async () => {
      const updatedQuiz = {
        title: "Update",
        questions: [
          {
            text: "Q",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      await request(app)
        .put(`/api/quizzes/${quizId}`)
        .send(updatedQuiz)
        .expect(401);
    });
  });

  describe("DELETE /api/quizzes/:id - Delete Quiz", () => {
    let deleteQuizId: string;

    beforeEach(async () => {
      // Create a quiz to delete
      const newQuiz = {
        title: "Quiz to Delete",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(newQuiz);

      deleteQuizId = response.body.id;
    });

    it("should delete quiz successfully", async () => {
      const response = await request(app)
        .delete(`/api/quizzes/${deleteQuizId}`)
        .set("Authorization", teacherToken)
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 404 if quiz not found", async () => {
      await request(app)
        .delete("/api/quizzes/nonexistent-id")
        .set("Authorization", teacherToken)
        .expect(404);
    });

    it("should return 401 if not authenticated", async () => {
      await request(app)
        .delete(`/api/quizzes/${deleteQuizId}`)
        .expect(401);
    });
  });

  describe("Question Validation Tests", () => {
    it("should reject multiple choice without options", async () => {
      const invalidQuiz = {
        title: "Invalid MC Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.MULTIPLE_CHOICE,
            // Missing options
            correctAnswer: "answer",
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should reject multiple choice with less than 2 choices", async () => {
      const invalidQuiz = {
        title: "Invalid MC Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.MULTIPLE_CHOICE,
            options: {
              choices: ["A"],
              correctAnswer: 0,
            },
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should reject true/false with invalid answer", async () => {
      const invalidQuiz = {
        title: "Invalid TF Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "maybe",
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should reject text question without correct answer", async () => {
      const invalidQuiz = {
        title: "Invalid Text Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TEXT,
            // Missing correctAnswer
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should reject question with negative points", async () => {
      const invalidQuiz = {
        title: "Invalid Points Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            points: -5,
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });

    it("should reject question with invalid time limit", async () => {
      const invalidQuiz = {
        title: "Invalid Time Limit Quiz",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            timeLimit: -10,
          },
        ],
      };

      await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(invalidQuiz)
        .expect(400);
    });
  });

  describe("Edge Cases and Special Scenarios", () => {
    it("should handle quiz with maximum questions", async () => {
      const questions = Array.from({ length: 50 }, (_, i) => ({
        text: `Question ${i + 1}`,
        type: QuestionType.TRUE_FALSE,
        correctAnswer: "true",
        points: 1,
      }));

      const largeQuiz = {
        title: "Large Quiz",
        questions,
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(largeQuiz)
        .expect(201);

      expect(response.body.questions).toHaveLength(50);
    });

    it("should handle quiz with special characters in title", async () => {
      const specialQuiz = {
        title: "Quiz with special chars: @#$%^&*()",
        description: "Testing <html> & \"quotes\"",
        questions: [
          {
            text: "Question with émojis 🎯",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(specialQuiz)
        .expect(201);

      expect(response.body.title).toContain("@#$%^&*()");
    });

    it("should handle quiz with very long descriptions", async () => {
      const longDescription = "A".repeat(1000);
      const longQuiz = {
        title: "Long Description Quiz",
        description: longDescription,
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(longQuiz)
        .expect(201);

      expect(response.body.description.length).toBe(1000);
    });

    it("should handle empty description", async () => {
      const quizNoDesc = {
        title: "No Description Quiz",
        description: null,
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(quizNoDesc)
        .expect(201);

      expect(response.body.description).toBeNull();
    });

    it("should preserve question order", async () => {
      const orderedQuiz = {
        title: "Ordered Quiz",
        questions: [
          {
            text: "First question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            order: 0,
          },
          {
            text: "Second question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "false",
            order: 1,
          },
          {
            text: "Third question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            order: 2,
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(orderedQuiz)
        .expect(201);

      expect(response.body.questions[0].text).toBe("First question");
      expect(response.body.questions[1].text).toBe("Second question");
      expect(response.body.questions[2].text).toBe("Third question");
    });

    it("should set default points to 1 if not specified", async () => {
      const nopointsQuiz = {
        title: "No Points Specified",
        questions: [
          {
            text: "Question",
            type: QuestionType.TRUE_FALSE,
            correctAnswer: "true",
            // points not specified
          },
        ],
      };

      const response = await request(app)
        .post("/api/quizzes")
        .set("Authorization", teacherToken)
        .send(nopointsQuiz)
        .expect(201);

      expect(response.body.questions[0].points).toBe(1);
    });
  });
});
