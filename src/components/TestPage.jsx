import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Test.css";

/* ================= NEET SECTIONS ================= */
const SECTIONS = [
  {
    name: "Physics",
    questions: [
      { question: "Unit of electric current is:", options: ["Volt", "Ampere", "Ohm", "Watt"] },
      { question: "Dimensional formula of force?", options: ["MLT⁻²", "ML²T⁻²", "ML⁻¹T⁻²", "MT⁻²"] },
      { question: "Speed of light is:", options: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁵ km/s", "300 m/s"] },
      { question: "SI unit of power is:", options: ["Joule", "Newton", "Watt", "Pascal"] },
      { question: "Which is a vector quantity?", options: ["Speed", "Mass", "Distance", "Velocity"] }
    ]
  },
  {
    name: "Chemistry",
    questions: [
      { question: "pH of neutral solution is:", options: ["0", "7", "14", "1"] },
      { question: "Atomic number represents:", options: ["Neutrons", "Electrons", "Protons", "Mass"] },
      { question: "NaCl is an example of:", options: ["Covalent bond", "Metallic bond", "Ionic bond", "Hydrogen bond"] },
      { question: "Gas used in Haber process:", options: ["O₂", "H₂", "N₂", "Both H₂ & N₂"] },
      { question: "Avogadro number is:", options: ["6.02×10²³", "6.6×10⁻³⁴", "9.8", "3×10⁸"] }
    ]
  },
  {
    name: "Biology",
    questions: [
      { question: "Powerhouse of cell is:", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"] },
      { question: "Human chromosome number:", options: ["23", "46", "44", "22"] },
      { question: "Photosynthesis occurs in:", options: ["Mitochondria", "Chloroplast", "Nucleus", "Vacuole"] },
      { question: "Blood group O is:", options: ["Universal donor", "Universal acceptor", "Rh positive", "Rh negative"] },
      { question: "Genetic material is:", options: ["Protein", "RNA", "DNA", "Lipid"] }
    ]
  }
];

export default function TestPage() {
  const navigate = useNavigate();

  /* ================= AUTH ================= */
  const [user, setUser] = useState(null);
  const [studentName, setStudentName] = useState("Student");

  /* ================= SECTION ================= */
  const [sectionIndex, setSectionIndex] = useState(0);
  const [current, setCurrent] = useState(0);

  /* ================= QUESTION STATE ================= */
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [visited, setVisited] = useState({});

  /* ================= TIMER ================= */
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  const section = SECTIONS[sectionIndex];
  const questions = section.questions;

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    const email = parsed.user?.email || "student";
    setStudentName(email.split("@")[0]);
    setVisited({ "0-0": true });
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
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
  };

  const key = `${sectionIndex}-${current}`;

  /* ================= ACTIONS ================= */
  const selectOption = idx => {
    setAnswers({ ...answers, [key]: idx });
  };

  const clearResponse = () => {
    const copy = { ...answers };
    delete copy[key];
    setAnswers(copy);
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setVisited(v => ({ ...v, [`${sectionIndex}-${next}`]: true }));
    }
  };

  const markForReview = () => {
    setMarked({ ...marked, [key]: true });
    goNext();
  };

  /* ================= STATUS ================= */
  const getStatus = (s, q) => {
    const k = `${s}-${q}`;
    if (!visited[k]) return "not-visited";
    if (marked[k] && answers[k] !== undefined) return "answered-marked";
    if (marked[k]) return "marked";
    if (answers[k] !== undefined) return "answered";
    return "not-answered";
  };

  /* ================= COUNTS ================= */
  const counts = { answered: 0, notAnswered: 0, notVisited: 0, marked: 0, answeredMarked: 0 };

  questions.forEach((_, i) => {
    const st = getStatus(sectionIndex, i);
    if (st === "answered") counts.answered++;
    else if (st === "not-answered") counts.notAnswered++;
    else if (st === "not-visited") counts.notVisited++;
    else if (st === "marked") counts.marked++;
    else if (st === "answered-marked") counts.answeredMarked++;
  });

  if (!user) return null;

  /* ================= UI ================= */
  return (
    <div className="exam-root">
      {/* HEADER */}
      <div className="exam-header">
        <div className="exam-title">NEET Test</div>
        <div className="exam-timer">{formatTime()}</div>
        <button className="pause-btn" onClick={() => setPaused(p => !p)}>
          {paused ? "RESUME TEST" : "PAUSE TEST"}
        </button>
      </div>

      {/* SECTION TABS */}
      <div className="section-tabs">
        {SECTIONS.map((s, i) => (
          <button
            key={i}
            className={`section-btn ${i === sectionIndex ? "active" : ""}`}
            onClick={() => {
              setSectionIndex(i);
              setCurrent(0);
              setVisited(v => ({ ...v, [`${i}-0`]: true }));
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="exam-main">
        {/* QUESTION AREA */}
        <div className="question-area">
          <div className="question-meta">
            <span>{section.name}</span>
            <span>Q. {current + 1} / {questions.length}</span>
          </div>

          <div className="question-box">
            <div className="question-text">{questions[current].question}</div>

            {questions[current].options.map((opt, idx) => (
              <label key={idx} className={`option-card ${answers[key] === idx ? "selected" : ""}`}>
                <input
                  type="radio"
                  disabled={paused}
                  checked={answers[key] === idx}
                  onChange={() => selectOption(idx)}
                />
                <span className="opt-label">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt}</span>
              </label>
            ))}
          </div>

          <div className="action-row">
            <button className="secondary" onClick={markForReview} disabled={paused}>
              MARK FOR REVIEW & NEXT
            </button>
            <button className="secondary" onClick={clearResponse} disabled={paused}>
              CLEAR RESPONSE
            </button>
            <button className="primary" onClick={goNext} disabled={paused}>
              SAVE & NEXT
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="student-card">
            <div className="avatar">{studentName[0].toUpperCase()}</div>
            <b>{studentName}</b>
          </div>

          {/* COUNTERS (KEPT AS REQUESTED) */}
          <div className="count-box">
            <div>🟢 Answered: {counts.answered}</div>
            <div>🔴 Not Answered: {counts.notAnswered}</div>
            <div>⚪ Not Visited: {counts.notVisited}</div>
            <div>🟣 Marked: {counts.marked}</div>
            <div>🟡 Answered & Marked: {counts.answeredMarked}</div>
          </div>

          {/* QUESTION PALETTE */}
          <div className="palette">
            {questions.map((_, i) => {
              const st = getStatus(sectionIndex, i);
              return (
                <button
                  key={i}
                  className={`palette-btn ${st}`}
                  onClick={() => {
                    setCurrent(i);
                    setVisited(v => ({ ...v, [`${sectionIndex}-${i}`]: true }));
                  }}
                >
                  {i + 1}
                  {st === "answered-marked" && <span className="gold-tick">✔</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
