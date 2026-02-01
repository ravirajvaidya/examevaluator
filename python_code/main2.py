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
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_API_KEY:
    raise ValueError("PERPLEXITY_API_KEY not found in environment variables")

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)


# =========================================================
# CLIENTS
# =========================================================

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    allow_origins=["*"],  # tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# RUBRIC
# =========================================================

GRADING_RUBRIC = """
You are an academic answer evaluator for Indian-style written examinations.

You must evaluate answers strictly, conservatively, and objectively.
You are NOT a teacher, tutor, or chatbot.
You are a STRICT evaluator following Indian examination standards.

────────────────────────────────────────
INPUTS:
1. Question
2. Student Answer

────────────────────────────────────────
ANTI-HALLUCINATION & SAFETY GUARDS (MANDATORY):

- Evaluate ONLY what is explicitly written in the student's answer.
- Do NOT assume intent, implied meaning, or unstated knowledge.
- Do NOT invent expectations beyond the question level.
- If an idea is vague or weakly explained → award minimal partial credit.
- If an idea is completely absent → treat it as missing.
- Repeating the question without explanation → no credit.
- Memorized but irrelevant content → no credit.

────────────────────────────────────────
STEP 1–6: INTERNAL ONLY (DO NOT OUTPUT)

Apply Indian exam evaluation logic strictly.

FINAL SCORE:
- Score out of 10
- If relevant content exists, minimum score = 1
- NEVER give 0 unless blank or irrelevant

────────────────────────────────────────
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "score": <Float 0–10>,
  "feedback": "<2–4 sentences, exam-oriented>"
}

NO extra text. NO markdown.
"""

# =========================================================
# AI GRADER (FIXED)
# =========================================================

def grade_answer(question: str, answer: str) -> dict:
    if not answer or not answer.strip():
        return {
            "score": 0,
            "feedback": "No answer submitted."
        }

    prompt = f"""
{GRADING_RUBRIC}

QUESTION:
{question[:1500]}

STUDENT ANSWER:
{answer[:20000]}
"""

    response = client.chat.completions.create(
        model="sonar-pro",
        temperature=0,
        max_tokens=700,
        messages=[
            {"role": "system", "content": "Return valid JSON only"},
            {"role": "user", "content": prompt}
        ]
    )

    raw = response.choices[0].message.content.strip()

    # Extract JSON safely
    match = re.search(r"\{[\s\S]*?\}", raw)
    if not match:
        raise ValueError("AI response does not contain JSON")

    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON returned by AI")

    # ✅ CORRECT KEY
    score = data.get("score")
    feedback = data.get("feedback", "").strip()

    if score is None:
        raise ValueError("Missing 'score' in AI response")

    try:
        score = float(score)
    except Exception:
        raise ValueError("Score is not numeric")

    # Clamp score
    score = max(0.0, min(score, 10.0))

    # Feedback fallback
    if not feedback:
        feedback = "Answer evaluated."

    # 🚨 Consistency safety (critical)
    if score == 0 and any(word in feedback.lower() for word in ["accurate", "good", "clear", "relevant"]):
        score = 1

    return {
        "score": int(round(score)),
        "feedback": feedback
    }

# =========================================================
# PROCESS PENDING / FAILED ROWS
# =========================================================

def process_pending_evaluations():
    response = (
        supabase
        .table(TABLE_NAME)
        .select("eval_id, question, answer")
        .in_("evaluation_status", ["PENDING", "FAILED"])
        .order("created_at")
        .limit(5)
        .execute()
    )

    rows = response.data or []
    print(f"📦 Rows fetched: {len(rows)}")

    for row in rows:
        eval_id = row["eval_id"]

        # Lock row
        supabase.table(TABLE_NAME) \
            .update({"evaluation_status": "PROCESSING"}) \
            .eq("eval_id", eval_id) \
            .execute()

        try:
            result = grade_answer(row["question"], row["answer"])
            print(f"🧠 AI result | eval_id={eval_id} | {result}")

        except Exception as e:
            print(f"❌ AI FAILED | eval_id={eval_id} | {e}")
            traceback.print_exc()

            supabase.table(TABLE_NAME) \
                .update({"evaluation_status": "FAILED"}) \
                .eq("eval_id", eval_id) \
                .execute()
            continue

        try:
            res = supabase.table(TABLE_NAME) \
                .update({
                    "score": result["score"],
                    "feedback": result["feedback"],
                    "evaluation_status": "EVALUATED",
                    "evaluated_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("eval_id", eval_id) \
                .execute()

            print(f"✅ EVALUATED | eval_id={eval_id} | score={result['score']}")
            print("🧾 DB response:", res)

        except Exception as db_error:
            print(f"⚠️ DB UPDATE FAILED | eval_id={eval_id} | {db_error}")
            traceback.print_exc()

# =========================================================
# BACKGROUND WORKER
# =========================================================

@app.on_event("startup")
def start_worker():
    import threading

    print("🚀 Evaluator service started")

    def worker():
        while True:
            print("🔍 Checking for pending evaluations...")
            process_pending_evaluations()
            time.sleep(20)

    threading.Thread(target=worker, daemon=True).start()
