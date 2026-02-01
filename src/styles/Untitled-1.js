import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Test.css";

const QUESTIONS = [
  {
    question: "Which of the following is an example of a sunk cost?",
    options: [
      "The cost of raw materials for a new product line.",
      "The future marketing expenditure for an existing product.",
      "The amount paid for a machine that has no resale value.",
      "The variable cost per unit."
    ]
  },
  {
    question: "Opportunity cost refers to:",
    options: [
      "Explicit cost",
      "Implicit cost",
      "Next best alternative forgone",
      "Accounting cost"
    ]
  }
];

export default function TestPage() {
  const navigate = useNavigate();

  /* ================= AUTH (localStorage) ================= */
  const [user, setUser] = useState(null);
  const [studentName, setStudentName] = useState("Student");

  /* ================= TEST STATE ================= */
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 90); // 90 minutes
  const [paused, setPaused] = useState(false);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      navigate("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      const email = parsed.user?.email || "student";
      setStudentName(email.split("@")[0]);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [paused]);

  const formatTime = () => {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return `${String(h).padStart(2, "0")} : ${String(m).padStart(
      2,
      "0"
    )} : ${String(s).padStart(2, "0")}`;
  };

  /* ================= ACTIONS ================= */
  const selectOption = idx => {
    setAnswers({ ...answers, [current]: idx });
  };

  const clearResponse = () => {
    const copy = { ...answers };
    delete copy[current];
    setAnswers(copy);
  };

  const saveNext = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    }
  };

  const markForReview = () => {
    setMarked({ ...marked, [current]: true });
    saveNext();
  };

  const status = i => {
    if (marked[i]) return "marked";
    if (answers[i] !== undefined) return "answered";
    return "not-answered";
  };

  if (!user) return null;

  /* ================= UI ================= */
  return (
    <div className="exam-root">
      {/* HEADER */}
      <div className="exam-header">
        <div className="exam-title">Online Test</div>
        <div className="exam-timer">{formatTime()}</div>
        <button
          className="pause-btn"
          onClick={() => setPaused(p => !p)}
        >
          {paused ? "RESUME TEST" : "PAUSE TEST"}
        </button>
      </div>

      <div className="exam-main">
        {/* QUESTION AREA */}
        <div className="question-area">
          <div className="question-meta">
            <span>SECTION 1</span>
            <span>
              Q. {current + 1} / {QUESTIONS.length}
            </span>
            <span className="marks">
              +1 <b className="neg">-0.25</b>
            </span>
          </div>

          <div className="question-box">
            <div className="question-text">
              {QUESTIONS[current].question}
            </div>

            {QUESTIONS[current].options.map((opt, idx) => (
              <label
                key={idx}
                className={`option-card ${
                  answers[current] === idx ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  disabled={paused}
                  checked={answers[current] === idx}
                  onChange={() => selectOption(idx)}
                />
                <span className="opt-label">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </label>
            ))}
          </div>

          <div className="action-row">
            <button
              className="secondary"
              disabled={paused}
              onClick={markForReview}
            >
              MARK FOR REVIEW & NEXT
            </button>
            <button
              className="secondary"
              disabled={paused}
              onClick={clearResponse}
            >
              CLEAR RESPONSE
            </button>
            <button
              className="primary"
              disabled={paused}
              onClick={saveNext}
            >
              SAVE & NEXT
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="student-card">
            <div className="avatar">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <b>{studentName}</b>
              <div className="role">Student</div>
            </div>
          </div>

          <div className="legend-box">
            <div><span className="answered"></span> Answered</div>
            <div><span className="not-answered"></span> Not Answered</div>
            <div><span className="marked"></span> Marked</div>
          </div>

          <div className="palette">
            {QUESTIONS.map((_, i) => (
              <button
                key={i}
                className={`palette-btn ${status(i)}`}
                onClick={() => !paused && setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PAUSE OVERLAY */}
      {paused && (
        <div className="pause-overlay">
          <div className="pause-box">
            <h2>Test Paused</h2>
            <p>Click Resume to continue</p>
          </div>
        </div>
      )}
    </div>
  );
}
