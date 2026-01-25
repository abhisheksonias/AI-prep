-- Aptitude Test Schema
-- This schema stores aptitude test questions and results for students

-- Table to store aptitude test questions
CREATE TABLE IF NOT EXISTS aptitude_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('quantitative', 'logical', 'verbal')),
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer IN (0, 1, 2, 3)),
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store aptitude test results
CREATE TABLE IF NOT EXISTS aptitude_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_questions INTEGER NOT NULL DEFAULT 15,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    time_taken_seconds INTEGER,
    resume_analyzed BOOLEAN DEFAULT TRUE,
    tab_switches INTEGER DEFAULT 0,
    violations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aptitude_questions_type ON aptitude_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_aptitude_questions_difficulty ON aptitude_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_aptitude_questions_active ON aptitude_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_aptitude_test_results_student_id ON aptitude_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_aptitude_test_results_test_date ON aptitude_test_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_aptitude_test_results_score ON aptitude_test_results(score_percentage DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE aptitude_test_results ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only view their own test results
CREATE POLICY "Students can view own test results"
ON aptitude_test_results
FOR SELECT
USING (auth.uid() = student_id);

-- Policy: Students can insert their own test results
CREATE POLICY "Students can insert own test results"
ON aptitude_test_results
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Policy: Admins can view all test results
CREATE POLICY "Admins can view all test results"
ON aptitude_test_results
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
    )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_aptitude_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_aptitude_test_results_timestamp
BEFORE UPDATE ON aptitude_test_results
FOR EACH ROW
EXECUTE FUNCTION update_aptitude_test_results_updated_at();

-- Optional: View for getting student aptitude test statistics
CREATE OR REPLACE VIEW student_aptitude_stats AS
SELECT 
    student_id,
    COUNT(*) as total_tests_taken,
    AVG(score_percentage) as average_score,
    MAX(score_percentage) as best_score,
    MIN(score_percentage) as lowest_score,
    AVG(time_taken_seconds) as avg_time_taken,
    MAX(test_date) as last_test_date
FROM aptitude_test_results
GROUP BY student_id;
