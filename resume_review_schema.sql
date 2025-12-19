-- Resume Review Table Schema
-- This table stores resume review sessions with analysis results

CREATE TABLE IF NOT EXISTS resume_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Resume content that was reviewed
  resume_text TEXT NOT NULL,
  
  -- ATS Score (0-100)
  ats_score NUMERIC(5,2) NOT NULL,
  
  -- Overall rating/grade
  overall_rating TEXT, -- e.g., "Good", "Excellent", "Needs Improvement"
  
  -- Detailed analysis stored as JSONB for flexibility
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "strengths": ["strength1", "strength2"],
  --   "weaknesses": ["weakness1", "weakness2"],
  --   "key_improvements": [
  --     {
  --       "category": "Formatting",
  --       "suggestion": "Improve bullet points",
  --       "priority": "High"
  --     }
  --   ],
  --   "ats_analysis": {
  --     "keywords_match": 85,
  --     "formatting_score": 90,
  --     "content_quality": 75
  --   },
  --   "confidence_boost": "Your resume shows strong technical skills..."
  -- }
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_reviews_user_id ON resume_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_created_at ON resume_reviews(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resume_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_resume_reviews_updated_at
  BEFORE UPDATE ON resume_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_reviews_updated_at();

-- Optional: Add comment to table
COMMENT ON TABLE resume_reviews IS 'Stores resume review sessions with ATS scores and improvement suggestions';
COMMENT ON COLUMN resume_reviews.analysis IS 'JSONB field containing detailed analysis, improvements, and confidence boost message';

