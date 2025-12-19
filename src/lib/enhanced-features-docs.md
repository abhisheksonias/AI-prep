# Enhanced AI Mock Interview System - Documentation

## Overview
The system now supports personalized, AI-driven mock interviews with voice input, profile-based question selection, and performance tracking.

## New Features

### 1. Student Profile Integration
- Uses `resume_text`, `skills`, `career_goal`, `interests`, `target_company_type` from users table
- AI builds personalized interview context
- Questions selected based on profile and performance

### 2. Voice Input Support
- Accepts `audio_url` and `transcribed_answer` fields
- Supports both text and voice-based answers
- Transcription assumed to be handled externally

### 3. Performance Metrics Tracking
- Automatic tracking per topic
- Weak/strong topic identification
- Adaptive question selection based on performance

### 4. Enhanced AI Evaluation
- Personalized feedback based on student profile
- Multiple scoring dimensions:
  - Overall score
  - Technical accuracy
  - Communication clarity
  - Interview readiness

## API Endpoints

### 1. Build Interview Context
**POST** `/api/interview/context`

Builds AI context from student profile and performance metrics.

**Request:**
```json
{
  "student_id": "uuid"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "context": "AI-generated interview context...",
  "profile": {
    "resume_text": "...",
    "skills": ["DSA", "Java"],
    "career_goal": "SDE",
    "interests": ["Backend"],
    "target_company_type": "Product"
  },
  "performance_metrics": [...]
}
```

---

### 2. Get Personalized Question
**POST** `/api/interview/question/personalized`

Selects question based on profile and performance.

**Request:**
```json
{
  "student_id": "uuid"
}
```

**Response:**
```json
{
  "question_id": "uuid",
  "question_text": "...",
  "role_type": "Technical",
  "topic": "DSA",
  "difficulty": "Medium",
  "priority_reason": "Selected based on areas needing improvement"
}
```

**Selection Logic:**
- Prioritizes weak performance areas (+5 points)
- Matches student skills/interests (+3 points)
- Aligns with career goals (+2 points)
- Prefers medium difficulty (+1 point)

---

### 3. Enhanced Evaluation (with Profile)
**POST** `/api/interview/evaluate`

Now supports voice input and uses profile context.

**Request:**
```json
{
  "student_id": "uuid",
  "question_id": "uuid",
  "student_answer": "text answer",  // Optional if transcribed_answer provided
  "transcribed_answer": "voice transcription",  // Optional
  "audio_url": "https://...",  // Optional
  "role_type": "Technical",  // Optional
  "topic": "DSA",  // Optional
  "difficulty": "Medium"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "response_id": "uuid",
  "evaluation": {
    "score": 7.5,
    "technical_accuracy": 8.0,
    "communication_clarity": 7.0,
    "interview_readiness": 7.5,
    "strengths": "...",
    "weaknesses": "...",
    "ideal_answer": "...",
    "feedback": "Personalized feedback..."
  },
  "session_id": "uuid"
}
```

**Features:**
- Automatically updates performance metrics
- Stores audio_url and transcribed_answer
- Uses profile for personalized evaluation
- Updates session AI context

---

### 4. Get Performance Metrics
**GET** `/api/interview/performance?student_id=uuid`

**Response:**
```json
{
  "metrics": [
    {
      "id": "uuid",
      "topic": "DSA",
      "avg_score": 6.5,
      "total_attempts": 10,
      "last_updated": "2024-01-01T00:00:00Z"
    }
  ],
  "statistics": {
    "total_attempts": 25,
    "overall_avg_score": "7.2",
    "topics_practiced": 5,
    "weak_topics_count": 2,
    "strong_topics_count": 3
  },
  "weak_topics": [...],
  "strong_topics": [...]
}
```

## Enhanced Gemini Prompt

The evaluation prompt now includes:
1. **Student Profile Context:**
   - Career goals
   - Skills and interests
   - Target company type
   - Resume summary

2. **Performance History:**
   - Past performance by topic
   - Strong and weak areas

3. **Personalized Evaluation:**
   - Considers student's background
   - Aligns feedback with career goals
   - Provides role-specific recommendations

## Performance Metrics Update Logic

1. After each evaluation:
   - Fetches existing metric for the topic
   - Updates average score: `(old_avg * (attempts - 1) + new_score) / attempts`
   - Increments total attempts
   - Updates timestamp

2. If no metric exists:
   - Creates new metric record
   - Sets initial score and attempts

## Database Schema Updates

### users table:
- `resume_text TEXT`
- `skills TEXT[]`
- `career_goal TEXT`
- `interests TEXT[]`
- `target_company_type TEXT`

### mock_interview_sessions table:
- `ai_context JSONB` - Stores AI-generated context and profile

### interview_responses table:
- `audio_url TEXT` - URL to audio file
- `transcribed_answer TEXT` - Voice transcription

### user_performance_metrics table:
- Tracks performance per topic
- Auto-updated after each evaluation

## Flow Example

1. Student logs in
2. Frontend calls `/api/interview/context` → Gets AI context
3. Frontend calls `/api/interview/question/personalized` → Gets relevant question
4. Student answers via voice
5. Audio transcribed (external service)
6. Frontend calls `/api/interview/evaluate` with:
   - `transcribed_answer`
   - `audio_url`
   - `question_id`
7. Backend:
   - Fetches student profile
   - Evaluates with Gemini (using profile context)
   - Stores response with audio data
   - Updates performance metrics
8. Frontend displays personalized feedback
9. Next question adapts based on updated metrics

## Key Improvements

1. **Personalization:** Every evaluation considers student's profile
2. **Adaptive Learning:** Questions selected based on weak areas
3. **Voice Support:** Ready for voice input integration
4. **Performance Tracking:** Automatic metrics per topic
5. **Context Awareness:** AI understands student's background and goals

