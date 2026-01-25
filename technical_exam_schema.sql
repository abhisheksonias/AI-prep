-- Technical Exam Schema
-- Stores technical exam questions and results (non-AI, database-driven)

-- Table to store technical questions
CREATE TABLE IF NOT EXISTS technical_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    topic VARCHAR(50) NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'theory')),
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer IN (0, 1, 2, 3)),
    explanation TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store technical exam results
CREATE TABLE IF NOT EXISTS technical_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_questions INTEGER NOT NULL DEFAULT 15,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    time_taken_seconds INTEGER,
    tab_switches INTEGER DEFAULT 0,
    violations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_technical_questions_topic ON technical_questions(topic);
CREATE INDEX IF NOT EXISTS idx_technical_questions_difficulty ON technical_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_technical_questions_active ON technical_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_technical_test_results_student_id ON technical_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_technical_test_results_test_date ON technical_test_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_technical_test_results_score ON technical_test_results(score_percentage DESC);

-- RLS for results
ALTER TABLE technical_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own technical results"
ON technical_test_results
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own technical results"
ON technical_test_results
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all technical results"
ON technical_test_results
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
    )
);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_technical_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_technical_test_results_timestamp
BEFORE UPDATE ON technical_test_results
FOR EACH ROW
EXECUTE FUNCTION update_technical_test_results_updated_at();

-- View for student technical stats
CREATE OR REPLACE VIEW student_technical_stats AS
SELECT 
    student_id,
    COUNT(*) as total_tests_taken,
    AVG(score_percentage) as average_score,
    MAX(score_percentage) as best_score,
    MIN(score_percentage) as lowest_score,
    AVG(time_taken_seconds) as avg_time_taken,
    MAX(test_date) as last_test_date
FROM technical_test_results
GROUP BY student_id;
