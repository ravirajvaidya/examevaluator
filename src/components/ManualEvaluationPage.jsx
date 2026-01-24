// ManualEvaluationPage.jsx — Clean & Standard UI (Polished)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ManualEvaluationPage() {
  const navigate = useNavigate();

  const [qaList, setQaList] = useState([
    { question: "", answer: "" }
  ]);

  const MAX_QUESTIONS = 4;

  /* ================= HANDLERS ================= */
  const addQuestion = () => {
    if (qaList.length < MAX_QUESTIONS) {
      setQaList([...qaList, { question: "", answer: "" }]);
    }
  };

  const removeQuestion = (index) => {
    setQaList(qaList.filter((_, i) => i !== index));
  };

  const updateQA = (index, field, value) => {
    const updated = [...qaList];
    updated[index][field] = value;
    setQaList(updated);
  };

  const evaluateAnswers = () => {
    // Later you will connect this to AI evaluation
    alert("Evaluation submitted successfully!");
    navigate("/dashboard");
  };

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Manual Evaluation</h2>
        <p style={styles.subtitle}>
          Enter your own questions and answers for AI evaluation
        </p>

        {qaList.map((qa, index) => (
          <div key={index} style={styles.qaBlock}>
            <div style={styles.qaHeader}>
              <h4>Question {index + 1}</h4>

              {qaList.length > 1 && (
                <button
                  style={styles.removeBtn}
                  onClick={() => removeQuestion(index)}
                >
                  ✕
                </button>
              )}
            </div>

            <textarea
              style={styles.questionBox}
              placeholder="Enter question here..."
              value={qa.question}
              onChange={(e) =>
                updateQA(index, "question", e.target.value)
              }
            />

            <textarea
              style={styles.answerBox}
              placeholder="Enter answer here..."
              value={qa.answer}
              onChange={(e) =>
                updateQA(index, "answer", e.target.value)
              }
            />
          </div>
        ))}

        {/* ADD QUESTION */}
        {qaList.length < MAX_QUESTIONS && (
          <div style={styles.addBtnWrapper}>
            <button style={styles.addBtn} onClick={addQuestion}>
              ➕ Add Another Question
            </button>
          </div>
        )}

        {/* EVALUATE BUTTON */}
        <div style={styles.evaluateWrapper}>
          <button
            style={styles.evaluateBtn}
            onClick={evaluateAnswers}
          >
            🚀 Evaluate Answers
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    fontFamily: "Segoe UI, sans-serif"
  },

  card: {
    background: "white",
    width: "100%",
    maxWidth: 900,
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
  },

  title: {
    margin: 0,
    fontSize: 26,
    textAlign: "center"
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 30,
    textAlign: "center",
    color: "#64748b"
  },

  qaBlock: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20
  },

  qaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },

  removeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#dc2626"
  },

  questionBox: {
    width: "100%",
    minHeight: 70,
    padding: 10,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    marginBottom: 10,
    resize: "vertical",
    fontSize: 14
  },

  answerBox: {
    width: "100%",
    minHeight: 120,
    padding: 10,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    resize: "vertical",
    fontSize: 14
  },

  addBtnWrapper: {
    textAlign: "center",
    marginTop: 10
  },

  /* SAME THEME COLOR AS DEFAULT */
  addBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer"
  },

  evaluateWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 30
  },

  evaluateBtn: {
    background: "#1e40af",
    color: "white",
    border: "none",
    padding: "14px 32px",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer"
  }
};
