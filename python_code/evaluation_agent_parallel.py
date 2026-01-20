"""
===========================================================
PARALLEL SAFE AI ANSWER EVALUATION AGENT
-----------------------------------------------------------
• Supports multiple parallel workers
• Uses DB row locking via status='processing'
• Retries failed answers
• Skips already evaluated answers
===========================================================
"""

import os
import time
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
import psycopg2

# =========================================================
# CONFIG
# =========================================================
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

MAX_RETRIES = 3
BATCH_SIZE = 5
SLEEP_BETWEEN_CYCLES = 5
SLEEP_BETWEEN_EVALS = 1.5

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

# =========================================================
# STRICT RUBRIC
# =========================================================
RUBRIC = """
You are a strict human examiner.
Average answers score around 4–5.
High scores (7+) must be rare.
Return JSON only.
"""

# =========================================================
# DB CONNECTION
# =========================================================
def get_conn():
    return psycopg2.connect(DATABASE_URL)

# =========================================================
# ATOMIC FETCH + LOCK (CRITICAL)
# =========================================================
def fetch_and_lock_answers():
    """
    Atomically:
    1. Select pending/failed answers
    2. Mark them as 'processing'
    3. Return them to THIS worker only
    """

    query = """
        UPDATE answers
        SET status = 'processing'
        WHERE id IN (
            SELECT id
            FROM answers
            WHERE status IN ('pending', 'failed')
              AND retry_count < %s
            ORDER BY id
            LIMIT %s
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, question, answer, retry_count;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (MAX_RETRIES, BATCH_SIZE))
            rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "question": r[1],
            "answer": r[2],
            "retry_count": r[3]
        }
        for r in rows
    ]

# =========================================================
# DB UPDATE HELPERS
# =========================================================
def mark_success(answer_id, result):
    query = """
        UPDATE answers
        SET status = 'evaluated',
            total_score = %s,
            content_score = %s,
            organization_score = %s,
            language_score = %s,
            grade = %s,
            feedback = %s,
            evaluated_at = %s
        WHERE id = %s;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                result["total_score"],
                result["content_score"],
                result["organization_score"],
                result["language_score"],
                result["grade"],
                result["feedback"],
                datetime.utcnow(),
                answer_id
            ))

def mark_failure(answer_id, retry_count):
    status = 'failed' if retry_count < MAX_RETRIES else 'failed'
    query = """
        UPDATE answers
        SET status = %s,
            retry_count = %s
        WHERE id = %s;
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (status, retry_count, answer_id))

# =========================================================
# AI EVALUATION
# =========================================================
def evaluate_answer(question, answer):
    prompt = f"""
{RUBRIC}

QUESTION:
{question[:800]}

ANSWER:
{answer[:1500]}
"""

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
    match = re.search(r"\{.*\}", raw, re.DOTALL)

    if not match:
        raise ValueError("Invalid AI output")

    return json.loads(match.group(0))

# =========================================================
# PARALLEL AGENT LOOP
# =========================================================
def run_worker():
    print("🧠 Parallel Evaluation Worker started")

    while True:
        batch = fetch_and_lock_answers()

        if not batch:
            print("No work found. Sleeping...")
            time.sleep(SLEEP_BETWEEN_CYCLES)
            continue

        for ans in batch:
            try:
                print(f"Evaluating ID {ans['id']}")
                result = evaluate_answer(ans["question"], ans["answer"])
                mark_success(ans["id"], result)
                print(f"✔ Completed ID {ans['id']}")

            except Exception as e:
                print(f"✖ Failed ID {ans['id']} → {e}")
                mark_failure(ans["id"], ans["retry_count"] + 1)

            time.sleep(SLEEP_BETWEEN_EVALS)

# =========================================================
# ENTRY POINT
# =========================================================
if __name__ == "__main__":
    run_worker()
