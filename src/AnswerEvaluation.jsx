import React, { useState } from "react";

export default function AnswerEvaluation() {
  const [formData, setFormData] = useState({
    student_name: "",
    subject_id: "",
    question_id: "",
    question_text: "",
    answer_text: "",
    max_marks: 10
  });

  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);

  // ✅ USE ONLY REAL UUIDs PRESENT IN DB
  const subjects = [
    { id: "B51C8A57-17FA-455E-B538-5D7D2C5ED4A8", name: "Polity" },
    { id: "FFFDD93B-7127-4DD5-98F7-47647FB2CC0A", name: "Economy" },
    { id: "DAB76144-64AF-4D11-A8A9-D23DCA9A0558", name: "Ethics" }
  ];

  // -----------------------------
  // SUBJECT CHANGE → FETCH QUESTIONS
  // -----------------------------
  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;

    setFormData(prev => ({
      ...prev,
      subject_id: subjectId,
      question_id: "",
      question_text: "",
      answer_text: ""
    }));

    setQuestions([]);
    setError("");

    if (!subjectId) return;

    setQuestionLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/subjects/${subjectId}/questions`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load questions for selected subject");
    } finally {
      setQuestionLoading(false);
    }
  };

  // -----------------------------
  // QUESTION CHANGE
  // -----------------------------
  const handleQuestionChange = (e) => {
    const qid = e.target.value;
    const selected = questions.find(q => q.question_id === qid);

    if (!selected) return;

    setFormData(prev => ({
      ...prev,
      question_id: qid,
      question_text: selected.question_text,
      max_marks: selected.max_marks
    }));
  };

  // -----------------------------
  // INPUT CHANGE
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // -----------------------------
  // SUBMIT ANSWER
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: formData.student_name,
          subject_id: formData.subject_id,
          question_text: formData.question_text,
          answer_text: formData.answer_text,
          max_marks: Number(formData.max_marks)
        })
      });

      if (!res.ok) {
        throw new Error("Evaluation failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ maxWidth: "720px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>AI Answer Evaluation</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          name="student_name"
          placeholder="Student Number"
          value={formData.student_name}
          onChange={handleChange}
          required
        />

        <select
          value={formData.subject_id}
          onChange={handleSubjectChange}
          required
        >
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={formData.question_id}
          onChange={handleQuestionChange}
          disabled={questions.length === 0 || questionLoading}
          required
        >
          <option value="">
            {questionLoading
              ? "Loading questions..."
              : questions.length === 0
              ? "No questions available"
              : "Select Question"}
          </option>

          {questions.map(q => (
            <option key={q.question_id} value={q.question_id}>
              {q.question_text}
            </option>
          ))}
        </select>

        <textarea
          name="answer_text"
          placeholder="Write your answer here"
          rows={7}
          value={formData.answer_text}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          disabled={loading || !formData.question_id}
          style={{
            padding: "10px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          {loading ? "Evaluating..." : "Submit Answer"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "30px", padding: "15px", border: "1px solid #ccc" }}>
          <h3>Score: {result.score}</h3>
          <pre style={{ background: "#f4f4f4", padding: "10px" }}>
            {JSON.stringify(result.evaluation, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
