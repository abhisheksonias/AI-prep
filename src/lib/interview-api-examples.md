# AI Mock Interview API Documentation

## Environment Variables

Add to your `.env.local`:
```
GIMINI_API=AIzaSyDOEla327ZZZQSyl87sYF3YGUMSH1yVxMA
```

## API Endpoints

### 1. Get or Create Session
**POST** `/api/interview/session`
**GET** `/api/interview/session?student_id=<uuid>`

Creates a new session or returns existing active session.

**Request Body (POST):**
```json
{
  "student_id": "uuid-here"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "started_at": "2024-01-01T00:00:00Z",
  "total_score": null
}
```

---

### 2. Get Random Question
**GET** `/api/interview/question?role_type=HR&topic=DSA&difficulty=Medium`

Fetches a random active question. All query params are optional.

**Query Parameters:**
- `role_type` (optional): HR / Technical
- `topic` (optional): DSA / DBMS / OOPS
- `difficulty` (optional): Easy / Medium / Hard

**Response:**
```json
{
  "question_id": "uuid",
  "question_text": "What is the time complexity of quicksort?",
  "role_type": "Technical",
  "topic": "DSA",
  "difficulty": "Medium"
}
```

---

### 3. Evaluate Answer
**POST** `/api/interview/evaluate`

Evaluates student answer using Gemini AI and stores the response.

**Request Body:**
```json
{
  "student_id": "uuid",
  "student_answer": "Quicksort has average time complexity of O(n log n)...",
  "question_id": "uuid",
  "role_type": "Technical",  // optional, uses question's role_type if not provided
  "topic": "DSA",            // optional
  "difficulty": "Medium"     // optional
}
```

**Response:**
```json
{
  "success": true,
  "response_id": "uuid",
  "evaluation": {
    "score": 7.5,
    "strengths": "Good understanding of time complexity, clear explanation",
    "weaknesses": "Missing worst-case scenario discussion, no space complexity mention",
    "ideal_answer": "Quicksort is a divide-and-conquer algorithm...",
    "feedback": "Your answer demonstrates solid understanding..."
  },
  "session_id": "uuid"
}
```

---

## Example Frontend Usage

```typescript
// 1. Get or create session
const sessionRes = await fetch('/api/interview/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ student_id: user.id })
})
const session = await sessionRes.json()

// 2. Get a question
const questionRes = await fetch('/api/interview/question?role_type=Technical&topic=DSA&difficulty=Medium')
const question = await questionRes.json()

// 3. Submit answer for evaluation
const evaluateRes = await fetch('/api/interview/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: user.id,
    student_answer: userAnswer,
    question_id: question.question_id,
    role_type: question.role_type,
    topic: question.topic,
    difficulty: question.difficulty
  })
})
const evaluation = await evaluateRes.json()
```

