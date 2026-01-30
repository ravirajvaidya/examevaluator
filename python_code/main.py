"""
===========================================================
AI ANSWER EVALUATOR API
-----------------------------------------------------------
• Upload Excel file
• Evaluate answers using AI
• RETURN JSON (not Excel)
• Designed for Postman testing
===========================================================
"""

import os
import json
import re
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware


# =========================================================
# ENV SETUP
# =========================================================
'''
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY missing")

client = OpenAI(api_key=OPENAI_API_KEY)
'''
#===============================
#Perplexity API key
#===============================

load_dotenv()
# env_path = "venv/.env"
# load_dotenv(dotenv_path=env_path)

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_API_KEY:
    raise ValueError("PERPLEXITY_API_KEY not found in environment variables")

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

# =========================================================
# FASTAPI APP
# =========================================================
app = FastAPI(title="Excel Answer Evaluator (JSON API)")
##app = FastAPI(title="Excel Answer Evaluator (JSON API)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# GRADING RUBRIC
# =========================================================
GRADING_RUBRIC = """
You are an academic answer evaluator for Indian-style written examinations.

You must evaluate answers strictly, conservatively, and objectively.
You are NOT a teacher, tutor, or chatbot. You are a STRICT evaluator.
You must NOT invent expectations beyond the question.

────────────────────────────────────────
INPUTS:
1. Question
2. Student Answer


────────────────────────────────────────
ANTI-HALLUCINATION & SAFETY GUARDS (MANDATORY):

- Evaluate ONLY what is explicitly written in the student's answer.
- Do NOT assume intent, implied meaning, or unstated knowledge.
- Do NOT reward partially correct guesses unless clearly explained.
- If an idea is vague, unclear, or hinted but not explained → treat it as missing.
- If the answer repeats the question without explanation → treat as no content.
- If content appears memorized but irrelevant → do NOT reward.

────────────────────────────────────────
STEP 1: INTERNAL RUBRIC GENERATION (DO NOT OUTPUT)

From the question, internally derive:
- Core Mandatory Points (missing = major penalty)
- Supporting Points (improve score)
- Optional Enhancements (examples, diagrams, measures)

Do NOT hallucinate advanced points if the question is basic.
Match difficulty to question level.

────────────────────────────────────────
STEP 2: MULTI-DIMENSION EVALUATION (INTERNAL)

Score internally on these axes:

A. Conceptual Accuracy (0–10)
   - Correctness of facts and definitions

B. Coverage of Key Points (0–10)
   - How many required points are addressed

C. Explanation & Depth (0–10)
   - Clarity, cause–effect, reasoning

D. Relevance & Focus (0–10)
   - Stays on topic, avoids padding

E. Language & Structure (0–10)
   - Grammar, clarity, paragraphing

────────────────────────────────────────
STEP 3: INDIAN EXAM SCORING LOGIC

Apply the following rules strictly:

- Missing definition / core concept → cap final score at 50% of max marks
- Answer written in points OR paragraph → both acceptable
- Bullet points WITHOUT explanation → partial credit only
- Diagrams NOT present → do NOT penalize unless explicitly asked
- Examples improve score but are NOT mandatory unless stated
- Average school-level answers should score 40–60%
- Full marks only for near-ideal answers

Language errors should NOT heavily penalize content knowledge.

────────────────────────────────────────
STEP 4: LENGTH & QUALITY SANITY CHECK

- One-line or very short answers → usually low coverage
- Long answers do NOT get extra marks unless content adds value
- Repetition does NOT increase score

────────────────────────────────────────
STEP 5: PLAGIARISM / GENERIC ANSWER SIGNALS

If the answer:
- Is overly generic
- Matches textbook-style phrasing without explanation
- Avoids specifics

Then:
- Reduce Explanation & Depth score
- Lower confidence level

────────────────────────────────────────
FINAL SCORE CALCULATION (INTERNAL):

Content Score =
  0.30 * Conceptual Accuracy +
  0.30 * Coverage +
  0.20 * Explanation +
  0.20 * Relevance

Language Weight = max 25%

Map internal score proportionally to Maximum Marks.
Round to nearest integer.
NEVER exceed Maximum Marks.

────────────────────────────────────────
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "score": <integer>,
  
  "feedback": "<2–4 sentences, actionable, exam-oriented>"
}

────────────────────────────────────────
FEEDBACK RULES:

- Mention 1 strength if present.
- Mention 1–2 clear gaps.
- Give 1 specific improvement suggestion.
- Use neutral, academic tone.
- Do NOT mention AI, rubrics, or internal scoring.

────────────────────────────────────────
ABSOLUTE CONSTRAINTS:

- Output valid JSON only.
- No markdown.
- No extra keys.
- No explanations outside JSON.


"""

# =========================================================
# CORE GRADING FUNCTION
# =========================================================
def grade_answer(question: str, answer: str) -> dict:
    if pd.isna(answer) or str(answer).strip() == "":
        return {
            "total_score": 0,
            "content_score": 0,
            "organization_score": 0,
            "language_score": 0,
            "grade": "F",
            "feedback": "No answer submitted"
        }

    prompt = f"""
{GRADING_RUBRIC}

QUESTION:
{question[:8000]}

STUDENT ANSWER:
{answer[:1500]}
"""

    try:
        response = client.chat.completions.create(
            model="sonar-pro",
            temperature=0.1,
            max_tokens=300,
            messages=[
                {"role": "system", "content": "Return JSON only."},
                {"role": "user", "content": prompt}
            ]
        )

        raw = response.choices[0].message.content

        # Extract JSON safely
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        json_str = match.group(0) if match else raw

        result = json.loads(json_str) ## Convert JSON to Python dictionary.

        # Safety validation
        for k in [
            "total_score",
            "content_score",
            "organization_score",
            "language_score"
        ]:
            if k not in result or not isinstance(result[k], (int, float)):
                result[k] = 0

        result.setdefault("grade", "F")
        result.setdefault("feedback", "Evaluation failed")

        return result

    except Exception as e:
        return {
            "total_score": 0,
            "content_score": 0,
            "organization_score": 0,
            "language_score": 0,
            "grade": "F",
            "feedback": f"AI error: {str(e)[:80]}"
        }

# =========================================================
# API ENDPOINT: UPLOAD EXCEL → RETURN JSON
# =========================================================
@app.post("/api/evaluate-excel")
async def evaluate_excel(file: UploadFile = File(...)):
    """
    Accepts Excel file and returns JSON evaluation
    """

    # Read Excel into DataFrame
    try:
        df = pd.read_excel(file.file)
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid Excel file"}
        )

    # Normalize column names
    df.columns = [c.lower().strip() for c in df.columns]

    required_cols = {"roll_number", "question", "answer"}
    if not required_cols.issubset(df.columns):
        return JSONResponse(
            status_code=400,
            content={
                "error": "Excel must contain columns: roll_number, question, answer"
            }
        )

    results = []

    # Evaluate row by row
    for _, row in df.iterrows():
        evaluation = grade_answer(row["question"], row["answer"])
        evaluation["roll_number"] = row["roll_number"]
        results.append(evaluation)

    # FINAL JSON RESPONSE
    return {
        "status": "success",
        "total_records": len(results),
        "results": results
    }

# =========================================================
# HEALTH CHECK
# =========================================================
@app.get("/")
def health():
    return {"status": "Excel JSON Evaluator API running"}


#==========================
# Command to run the app
# uvicorn main:app --reload
#==========================
