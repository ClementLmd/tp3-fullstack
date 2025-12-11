-- Ensure unique constraints for upsert targets
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_title_creator ON quizzes(title, creator_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_quiz_order ON questions(quiz_id, "order");
CREATE UNIQUE INDEX IF NOT EXISTS idx_answers_question_participation ON answers(question_id, participation_id);
