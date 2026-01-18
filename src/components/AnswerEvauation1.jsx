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

  const subjects = [
    { id: "B51C8A57-17FA-455E-B538-5D7D2C5ED4A8", name: "Polity" },
    { id: "FFFDD93B-7127-4DD5-98F7-47647FB2CC0A", name: "Economy" },
    { id: "DAB76144-64AF-4D11-A8A9-D23DCA9A0558", name: "Ethics" }
  ];

  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setFormData(prev => ({ ...prev, subject_id: subjectId, question_id: "", question_text: "", answer_text: "" }));
    setQuestions([]); setError("");
    if (!subjectId) return;
    setQuestionLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/subjects/${subjectId}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      setQuestions(await res.json());
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
    const qid = e.target.value;
    const selected = questions.find(q => q.question_id === qid);
    if (selected) {
      setFormData(prev => ({ ...prev, question_id: qid, question_text: selected.question_text, max_marks: selected.max_marks }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setResult(null);
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
      if (!res.ok) throw new Error("Evaluation failed");
      setResult(await res.json());
    } catch (err) {
      setError("Evaluation failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { maxWidth: "720px", margin: "40px auto", fontFamily: "Arial", padding: "20px" },
    input: { padding: "10px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px" },
    textarea: { padding: "10px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" },
    select: { padding: "10px", fontSize: "16px" },
    button: { padding: "12px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" },
    buttonDisabled: { ...button, backgroundColor: "#9ca3af", cursor: "not-allowed" },
    result: { marginTop: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "4px", background: "#f9fafb" },
    error: { color: "red", marginTop: "10px" },
    info: { fontSize: "14px", color: "#666", margin: "5px 0" }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", color: "#333" }}>AI Answer Evaluator (SEBI/PFRDA)</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input name="student_name" placeholder="Student Name/Number" value={formData.student_name} 
               onChange={handleChange} required style={styles.input} />
        
        <select value={formData.subject_id} onChange={handleSubjectChange} required style={styles.select}>
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={formData.question_id} onChange={handleQuestionChange} disabled={!formData.subject_id || questionLoading}
                required style={styles.select}>
          <option value="">{questionLoading ? "Loading..." : "Select Question"}</option>
          {questions.map(q => (
            <option key={q.question_id} value={q.question_id}>
              {q.question_text.substring(0, 80)}...
            </option>
          ))}
        </select>

        {formData.max_marks > 0 && (
          <p style={styles.info}>Max Marks: <strong>{formData.max_marks}</strong></p>
        )}

        <textarea name="answer_text" placeholder="Paste student answer here..." rows={8} 
                  value={formData.answer_text} onChange={handleChange} required style={styles.textarea} />

        <button type="submit" disabled={loading || !formData.question_id} 
                style={loading || !formData.question_id ? styles.buttonDisabled : styles.button}>
          {loading ? "🧠 Evaluating..." : "📝 Submit & Evaluate"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.result}>
          <h3>✅ Score: <strong>{result.score}/{formData.max_marks}</strong></h3>
          <details>
            <summary>Full Evaluation</summary>
            <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "4px", fontSize: "14px" }}>
              {JSON.stringify(result.evaluation, null, 2)}
            </pre>
          </details>
          <p style={styles.info}>Submission ID: {result.submission_id}</p>
        </div>
      )}
    </div>
  );
}
