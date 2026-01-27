import os
import json
import re
import time
import traceback
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from openai import OpenAI

# =========================================================
# ENV
# =========================================================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, PERPLEXITY_API_KEY]):
    raise ValueError("Missing environment variables")

# =========================================================
# CLIENTS
# =========================================================
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

TABLE_NAME = "manual_evaluations"

# =========================================================
# FASTAPI
# =========================================================
app = FastAPI(title="Supabase AI Answer Evaluator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# RUBRIC
# =========================================================
GRADING_RUBRIC = """
You are an experienced examiner. You are a fair, strict, and unbiased evaluator.

Ignore:
- Emotional statements or self-harm related remarks
- Executable scripts (mention them only in feedback if present)

Be objective and strict like a human evaluator.
Do not award high marks for average answers.

Grade out of 10 using:
1. Accuracy & relevance (0–4)
2. Organization & clarity (0–3)
3. Language & grammar (0–3)

Return ONLY valid JSON:
{
  "total_score": 10,
  "content_score": 4,
  "organization_score": 3,
  "language_score": 3,
  "grade": "A",
  "feedback": "Concise feedback"
}
"""

# =========================================================
# AI GRADER (SAFE + CLEAN)
# =========================================================
def grade_answer(question: str, answer: str) -> dict:
    if not answer.strip():
        return {
            "score": 0,
            "feedback": "No answer submitted."
        }

    prompt = f"""
{GRADING_RUBRIC}

QUESTION:
{question[:1000]}

STUDENT ANSWER:
{answer[:20000]}
"""

    response = client.chat.completions.create(
        model="sonar-pro",
        temperature=0,
        max_tokens=300,
        messages=[
            {"role": "system", "content": "Return valid JSON only"},
            {"role": "user", "content": prompt}
        ]
    )

    raw = response.choices[0].message.content.strip()

    match = re.search(r"\{[\s\S]*?\}", raw)
    if not match:
        raise ValueError("AI response does not contain JSON")

    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON returned by AI")

    total_score = data.get("total_score", 0)
    feedback = data.get("feedback", "")

    try:
        total_score = float(total_score)
    except Exception:
        total_score = 0.0

    total_score = max(0.0, min(total_score, 10.0))

    feedback = str(feedback).strip()
    if not feedback:
        feedback = "Answer evaluated."

    return {
        "score": int(round(total_score)),
        "feedback": feedback
    }

# =========================================================
# PROCESS PENDING / FAILED ROWS
# =========================================================
def process_pending_evaluations():
    response = (
        supabase
        .table(TABLE_NAME)
        .select("*")
        .in_("evaluation_status", ["pending", "failed", "PENDING", "FAILED","Pending", "Failed"])
        .order("created_at")
        .limit(5)
        .execute()
    )

    rows = response.data or []
    print(f"📦 Rows fetched: {len(rows)}")


    for row in rows:
        eval_id = row["eval_id"]

        try:
            # Lock row
            supabase.table(TABLE_NAME) \
                .update({"evaluation_status": "processing"}) \
                .eq("eval_id", eval_id) \
                .execute()

            # Evaluate
            result = grade_answer(
                row["question"],
                row["answer"]
            )

            # Update result
            res = ( supabase.table(TABLE_NAME) \
                .update({
                    "score": result["score"],
                    "feedback": result["feedback"],
                    "evaluation_status": "evaluated",
                    "evaluated_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("eval_id", eval_id) \
                .execute()
                )
            print("Update result:", res.data, res.error)
            print(
    f"✅ Evaluated | eval_id={eval_id} | "
    f"score={result['score']}/10"
)

        except Exception:
            supabase.table(TABLE_NAME) \
                .update({
                    "evaluation_status": "failed"
                }) \
                .eq("eval_id", eval_id) \
                .execute()

            traceback.print_exc()

# =========================================================
# BACKGROUND WORKER LOOP
# =========================================================
'''@app.on_event("startup")
def start_worker():
    import threading

    def worker():
        while True:
            process_pending_evaluations()
            time.sleep(60)

    threading.Thread(target=worker, daemon=True).start()'''
@app.on_event("startup")
def start_worker():
    import threading

    print("🚀 FastAPI startup event triggered")
    print("🧠 Background evaluator worker starting...")

    def worker():
        while True:
            print("🔍 Checking for pending evaluations...")
            process_pending_evaluations()
            time.sleep(60)

    threading.Thread(target=worker, daemon=True).start()

