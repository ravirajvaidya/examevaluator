// TestPage.jsx — IBPS Descriptive Exam (AUTO-GROW + WORD COUNTER)

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function TestPage() {
  const navigate = useNavigate();
  const answerRef = useRef(null);

  /* ================= QUESTIONS ================= */
  const questions = [
    "Discuss the role of RBI in controlling inflation in India.",
    "What are the causes of unemployment in India?",
    "Explain the importance of financial inclusion.",
    "Write a short note on Non-Performing Assets (NPAs)."
  ];

  const MAX_WORDS = 250;

  /* ================= STATE ================= */
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  /* ================= TIMER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setShowSubmitModal(true);
          return 0;
        }
        return t - 1;
      });
    }, 1);

    return () => clearInterval(timer);
  }, []);

  /* ================= AUTO GROW TEXTAREA ================= */
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.style.height = "auto";
      answerRef.current.style.height =
        answerRef.current.scrollHeight + "px";
    }
  }, [answers, currentQ]);

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const saveAndNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const markForReviewAndNext = () => {
    setMarked({ ...marked, [currentQ]: true });
    saveAndNext();
  };

  const getStatus = (index) => {
    if (marked[index]) return "marked";
    if (answers[index]?.trim()) return "answered";
    return "notAnswered";
  };

  /* ================= WORD COUNT ================= */
  const getWordCount = () => {
    const text = answers[currentQ] || "";
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const wordCount = getWordCount();
  const overLimit = wordCount > MAX_WORDS;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        IBPS Exam Online
        <div style={styles.timer}>Time Left: {formatTime()}</div>
      </div>

      <div style={styles.body}>
        {/* MAIN */}
        <div style={styles.main}>
          <div style={styles.questionBox}>
            <strong>Question {currentQ + 1}</strong>
            <div style={{ marginTop: 8 }}>{questions[currentQ]}</div>
          </div>

          <textarea
            ref={answerRef}
            style={styles.answerBox}
            placeholder="Type your answer here..."
            value={answers[currentQ] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [currentQ]: e.target.value })
            }
            spellCheck={false}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) e.preventDefault();
            }}
          />

          {/* WORD COUNTER */}
          <div
            style={{
              ...styles.wordCounter,
              color: overLimit ? "#dc2626" : "#475569"
            }}
          >
            Words: {wordCount} / {MAX_WORDS}
          </div>

          <div style={styles.actionRow}>
            <button style={styles.reviewBtn} onClick={markForReviewAndNext}>
              Mark for Review & Next
            </button>

            <button style={styles.nextBtn} onClick={saveAndNext}>
              Save & Next
            </button>
          </div>
        </div>

        {/* QUESTION PALETTE */}
        <div style={styles.palette}>
          <h4>Question Palette</h4>
          <div style={styles.paletteGrid}>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  ...styles.paletteBtn,
                  ...styles[getStatus(i)]
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AUTO SUBMIT MODAL */}
      {showSubmitModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h1>⏰ Time Over</h1>
            <p>Your test has been automatically submitted.</p>
            <button
              style={styles.modalButton}
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES (UNCHANGED + COUNTER) ================= */
const styles = {
  page: { fontFamily: "Segoe UI", background: "#d9edf7", minHeight: "100vh" },

  header: {
    background: "#0f4c81",
    color: "white",
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold"
  },

  timer: {
    background: "white",
    color: "#0f4c81",
    padding: "6px 12px",
    borderRadius: 6
  },

  body: { display: "flex", padding: 10 },

  main: {
    flex: 1,
    background: "white",
    padding: 16,
    border: "1px solid #ccc"
  },

  questionBox: {
    background: "#f9fafb",
    padding: 12,
    border: "1px solid #ccc",
    marginBottom: 10
  },

  answerBox: {
    width: "100%",
    minHeight: 220,
    padding: 12,
    border: "1px solid #999",
    resize: "none",
    overflow: "hidden",
    fontSize: 14,
    lineHeight: "1.6"
  },

  wordCounter: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "right",
    fontWeight: 600
  },

  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 15
  },

  reviewBtn: {
    background: "#facc15",
    border: "none",
    padding: "12px 20px",
    fontWeight: "bold"
  },

  nextBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 24px",
    fontWeight: "bold"
  },

  palette: {
    width: 260,
    marginLeft: 10,
    background: "#f8fafc",
    padding: 12,
    border: "1px solid #ccc"
  },

  paletteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10
  },

  paletteBtn: {
    height: 44,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer"
  },

  answered: { background: "#22c55e", color: "white" },
  marked: { background: "#a855f7", color: "white" },
  notAnswered: { background: "#e5e7eb" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },

  modalBox: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    textAlign: "center"
  },

  modalButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "14px 28px",
    fontSize: 16,
    borderRadius: 8,
    cursor: "pointer"
  }
};
