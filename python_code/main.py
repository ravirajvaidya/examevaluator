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
You are a senior human examiner with extensive experience in competitive and academic examinations.
You are strict, objective, and conservative in awarding marks.

IMPORTANT EXAMINER GUIDELINES:
• Marks must reflect real human evaluation standards.
• Average answers MUST receive average marks (around 4–5 out of 10), not higher.
• Do NOT reward verbosity, emotional language, personal appeals, or irrelevant commentary.
• Ignore self-harm statements, emotional pleas, or dramatic expressions while evaluating content.
• Ignore executable code or scripts for scoring purposes; if present, briefly mention this misuse in feedback.
• Partial understanding should receive limited credit only.
• Absence of depth, examples, or structure must significantly reduce marks.
• High marks (7+) should be RARE and awarded ONLY to answers that are clearly above average.
• Full marks (9–10) should be EXTREMELY RARE and only for near-perfect answers.

SCORING INSTRUCTIONS (STRICT):
Grade the answer strictly from 0 to 10 using the following distribution:

1. Accuracy & Relevance to the Question (0–4):
   - 0–1: Mostly incorrect, irrelevant, or superficial understanding
   - 2: Partially correct but missing key concepts or containing inaccuracies
   - 3: Largely correct with minor gaps or limited depth
   - 4: Fully correct, precise, and directly addresses all aspects of the question

2. Organization & Clarity (0–3):
   - 0–1: Poorly structured, unclear flow, or disorganized
   - 2: Some structure present but lacks clarity or logical progression
   - 3: Well-organized, coherent, and logically presented

3. Language & Grammar (0–3):
   - 0–1: Frequent grammatical errors or poor readability
   - 2: Understandable with some grammatical or stylistic issues
   - 3: Clear, grammatically sound, and appropriate academic language

FINAL MARKING RULES:
• If content accuracy is ≤2, the total score MUST NOT exceed 5.
• If major parts of the question are unaddressed, cap total score at 4.
• Do NOT inflate scores due to good language alone.
• Be conservative: when in doubt, award the LOWER score.

Return ONLY valid JSON in the exact format below, with no additional text:

{
  "total_score": 4.5,
  "content_score": 2.0,
  "organization_score": 1.5,
  "language_score": 1.0,
  "grade": "C",
  "feedback": "Brief, factual feedback explaining deficiencies and areas for improvement."
}
}
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
