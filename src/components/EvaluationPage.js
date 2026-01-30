import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"

export default function EvaluationPage() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();


  const API_ENDPOINT = "http://localhost:8000/api/evaluate-excel";

  const [file, setFile] = useState(null);
  const [rollNo, setRollNo] = useState("");
  const [session, setSession] = useState(null);


  // 🔹 MULTI QUESTION STATE (MAX 4)
  const [qaList, setQaList] = useState([{ question: "", answer: "" }]);

  const [results, setResults] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isButtonDisabled = loading || !session;


  /* ---------------- PROFILE ---------------- */
  // 1️⃣ Wait for session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ---------------- ADD / REMOVE QUESTIONS ---------------- */
  const handleAddQuestion = () => {
    if (qaList.length < 4) {
      setQaList([...qaList, { question: "", answer: "" }]);
    }
  };

  const handleRemoveQuestion = (index) => {
    if (qaList.length > 1) {
      setQaList(qaList.filter((_, i) => i !== index));
    }
  };

  const handleQAChange = (index, field, value) => {
    const updated = [...qaList];
    updated[index][field] = value;
    setQaList(updated);
  };

  /* ---------------- VALIDATION ---------------- */
  const validateInput = useCallback(() => {
    // if (!rollNo.trim()) return "Please enter a roll number";
    if (qaList.some(q => !q.question.trim()))
      return "Please enter all questions";
    if (qaList.some(q => !q.answer.trim()) && !file)
      return "Please enter all answers or upload a file";
    return "";
  }, [rollNo, qaList, file]);

  /* ---------------- EVALUATE ---------------- */

  const handleEvaluate = async () => {
    console.log("handleEvaluate CALLED 111");
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }


    setLoading(true);
    setError("");
    setShowPreview(false);

    try {

      if (!session) {
        throw new Error("No session yet");
      }


      // 2️⃣ Fetch user profile
      const { data, error } = await supabase
        .from("userdetails")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .single();

      if (error || !data) {
        throw new Error("User not authenticated");
      }

      console.log("Session Data Called : " + JSON.stringify(data));

      // 1️⃣ Prepare payload
      const payload = qaList.map((q) => ({
        auth_user_id: session.user.id,   // ✅ required
        student_id: data.studentid || null, // ✅ nullable
        question: q.question.trim(),     // ✅ required
        answer: q.answer.trim(),         // ✅ required
        evaluation_status: "PENDING"
      }));

      console.log(JSON.stringify(payload));

      // 2️⃣ Insert into Supabase
      const { error: insertError } = await supabase
        .from("manual_evaluations")
        .insert(payload);

      if (insertError) {
        throw insertError;
      }

      // ✅ SUCCESS FEEDBACK
      alert("✅ Data submitted successfully");

      // 🔄 RESET FORM
      clearForm();

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save answers");
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = useCallback(() => {
    const downloadData = results.map(r => ({
      "Roll_Number": r.rollNo,
      "Question": r.question.substring(0, 100) + (r.question.length > 100 ? "..." : ""),
      "Student_Answer": r.answer.substring(0, 150) + (r.answer.length > 150 ? "..." : ""),
      "Total_Score": r.total_score.toFixed(1),
      "Content_Score": r.content_score.toFixed(1),
      "Organization_Score": r.organization_score.toFixed(1),
      "Language_Score": r.language_score.toFixed(1),
      "Grade": r.grade,
      "Feedback": r.feedback
    }));

    const ws = XLSX.utils.json_to_sheet(downloadData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluation_Results");
    XLSX.writeFile(wb, `evaluation_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [results]);

  /* ---------------- CLEAR ---------------- */
  const clearForm = () => {
    setRollNo("");
    setQaList([{ question: "", answer: "" }]);
    setFile(null);
    setResults([]);
    setShowPreview(false);
    setError("");
  };

  return (
    <div style={styles.container}>
      {/* ✅ ORIGINAL PROFILE BAR */}
      <div style={styles.profileBar}>
        <button
          style={styles.profileButton}
          onClick={() => setShowProfileMenu(prev => !prev)}
        >
          <span style={styles.profileName}>
            {userData?.user?.email || userData?.email || "User"}
          </span>
          <span style={styles.caret}>▾</span>
        </button>

        {showProfileMenu && (
          <div style={styles.profileDropdown}>
            <button style={styles.dropdownButton} onClick={() => navigate("/profile")}>
              👤 My Profile
            </button>
            <button style={styles.dropdownButton} onClick={() => navigate("/scores")}>
              📊 My Scores
            </button>
            <div style={styles.dropdownDivider}></div>
            <button
              style={{ ...styles.dropdownButton, color: "#dc2626" }}
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* ✅ ORIGINAL HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 AI Answer Evaluator</h1>
        <p style={styles.subtitle}>Professional grading powered by AI</p>
      </div>

      <div style={styles.mainContent}>

        {/* ✅ ORIGINAL FORM CARD WITH MULTI-QUESTION */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>✏️</span>
            <h3 style={styles.cardTitle}>Enter Your Questions and Answers for evaluations</h3>
          </div>

          {error && (
            <div style={styles.errorCard} onClick={() => setError("")}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={styles.formGrid}>
            {/* Roll Number */}
            {/* <div style={styles.inputGroup}>
              <label style={styles.label}>Roll Number <span style={styles.required}>*</span></label>
              <input
                type="text"
                placeholder="e.g., 12345"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                style={styles.rollNoInput}
                disabled={loading}
              />
            </div> */}

            {/* 🔹 MULTI-QUESTION BLOCKS - SAME ORIGINAL STYLES */}
            {qaList.map((qa, index) => (
              <React.Fragment key={index}>
                <div style={styles.textareaGroup}>
                  <label style={styles.label}>
                    Question {index + 1} <span style={styles.required}>*</span>
                  </label>
                  <textarea
                    placeholder="Enter the complete question here..."
                    value={qa.question}
                    onChange={(e) => handleQAChange(index, "question", e.target.value)}
                    style={styles.questionTextarea}
                    disabled={loading}
                  />
                </div>

                <div style={styles.textareaGroup}>
                  <label style={styles.label}>
                    Student Answer {index + 1} <span style={styles.required}>*</span>
                  </label>
                  <textarea
                    placeholder="Enter the student's complete answer here..."
                    value={qa.answer}
                    onChange={(e) => handleQAChange(index, "answer", e.target.value)}
                    style={styles.fullTextarea}
                    rows={6}
                    disabled={loading}
                  />
                </div>

                {/* Remove Button (only if >1 question) */}
                {qaList.length > 1 && (
                  <div style={styles.removeQuestionContainer}>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      style={styles.removeQuestionButton}
                      disabled={loading}
                    >
                      ❌ Remove Question {index + 1}
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Add Question Button */}
          {qaList.length < 4 && (
            <div style={styles.addQuestionSection}>
              <button
                type="button"
                onClick={handleAddQuestion}
                style={styles.addQuestionButton}
                disabled={loading}
              >
                ➕ Add Another Question
              </button>
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              onClick={() => {
                console.log("BUTTON CLICKED");
                handleEvaluate();
              }}
              disabled={isButtonDisabled}
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.loadingButton : {})
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  <span>🔍 Analyzing with AI...</span>
                </>
              ) : !session ? (
                <>
                  🔒 <span>Login required</span>
                </>
              ) : (
                <>
                  🚀 <span>Submit Answers</span>
                </>
              )}
            </button>
            <button
              onClick={clearForm}
              disabled={loading}
              style={styles.secondaryButton}
            >
              🔄 Clear All
            </button>
          </div>
        </div>

        {/* ✅ ORIGINAL RESULTS CARD */}
        {showPreview && (
          <div style={styles.resultsCard}>
            <div style={styles.cardHeader}>
              <span style={styles.icon}>📊</span>
              <h3 style={styles.cardTitle}>Evaluation Results</h3>
            </div>
            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>{results.length}</div>
                <div style={styles.statLabel}>Evaluations</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>
                  {results.length ? (results.reduce((sum, r) => sum + r.total_score, 0) / results.length).toFixed(1) : 0}
                </div>
                <div style={styles.statLabel}>Average Score</div>
              </div>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.tableHeader}>Roll No</th>
                    <th style={styles.tableHeader}>Question</th>
                    <th style={styles.tableHeader}>Score</th>
                    <th style={styles.tableHeader}>Grade</th>
                    <th style={styles.tableHeader}>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} style={styles.tableRow}>
                      <td style={styles.tableCell}><strong>{result.rollNo}</strong></td>
                      <td style={styles.tableCell}>
                        <div style={styles.questionPreview}>
                          {result.question.substring(0, 50)}{result.question.length > 50 ? "..." : ""}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.scoreBadge}>{result.total_score?.toFixed(1)}/10</div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ ...styles.gradeBadge, background: getGradeColor(result.grade) }}>
                          {result.grade}
                        </span>
                      </td>
                      <td style={styles.tableCellFeedback}>{result.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.downloadSection}>
              <button onClick={handleDownload} style={styles.downloadButton}>
                💾 Download Complete Results (Excel)
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

/* ======================== ORIGINAL STYLES (100% PRESERVED) ======================== */
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  profileBar: {
    position: "absolute",
    top: "2rem",
    right: "2rem",
    zIndex: 1000
  },
  profileButton: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: "600",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
  },
  profileName: { fontSize: "0.95rem" },
  caret: { fontSize: "0.8rem", transition: "transform 0.2s" },
  profileDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    padding: "0.5rem 0",
    marginTop: "0.5rem",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    minWidth: "180px",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  dropdownButton: {
    width: "100%",
    padding: "0.75rem 1.5rem",
    background: "none",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500"
  },
  dropdownDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "0.5rem 1rem"
  },
  header: { textAlign: "center", marginBottom: "3rem", color: "white", marginTop: "6rem" },
  title: {
    fontSize: "3rem",
    fontWeight: "800",
    margin: "0 0 0.5rem 0",
    background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  subtitle: { fontSize: "1.2rem", color: "rgba(255,255,255,0.9)", margin: 0 },
  mainContent: { maxWidth: "1400px", margin: "0 auto" },
  uploadCard: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    marginBottom: "2rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" },
  icon: { fontSize: "2rem" },
  cardTitle: { fontSize: "1.8rem", fontWeight: "700", color: "#1e293b", margin: 0 },
  uploadContainer: { position: "relative", display: "flex", alignItems: "center" },
  uploadButton: {
    width: "100%",
    minHeight: "120px",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    border: "3px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "2rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    fontFamily: "inherit"
  },
  fileIcon: { fontSize: "2.5rem", marginRight: "1rem" },
  uploadIcon: { fontSize: "3rem", opacity: 0.7 },
  fileName: { fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" },
  fileSize: { color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" },
  uploadText: { flex: 1 },
  uploadTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#1e293b" },
  uploadSubtitle: { color: "#64748b", fontSize: "0.95rem", marginTop: "0.25rem" },
  uploadBrowse: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "0.95rem"
  },
  removeButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold"
  },
  hiddenFileInput: { display: "none" },
  card: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    marginBottom: "2rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  formGrid: { display: "grid", gap: "2rem", marginBottom: "2rem" },
  inputGroup: { display: "flex", flexDirection: "column" },
  textareaGroup: { display: "flex", flexDirection: "column" },
  label: { fontSize: "1rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.75rem" },
  required: { color: "#ef4444" },
  rollNoInput: {
    padding: "1rem 1.25rem",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "1rem",
    background: "white",
    width: "300px",
    maxWidth: "100%"
  },
  questionTextarea: {
    width: "100%",
    height: "100px",
    minHeight: "100px",
    maxHeight: "300px",
    padding: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "1rem",
    lineHeight: "1.6",
    resize: "vertical",
    fontFamily: "inherit",
    background: "white",
    transition: "all 0.3s ease",
    overflowY: "auto"
  },
  fullTextarea: {
    width: "100%",
    minHeight: "180px",
    padding: "1.25rem",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "1rem",
    lineHeight: "1.6",
    resize: "vertical",
    fontFamily: "inherit",
    background: "white"
  },
  removeQuestionContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "1rem"
  },
  removeQuestionButton: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    cursor: "pointer",
    fontWeight: "500"
  },
  addQuestionSection: {
    textAlign: "center",
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "rgba(102, 126, 234, 0.05)",
    borderRadius: "16px",
    border: "2px dashed rgba(102, 126, 234, 0.3)"
  },
  addQuestionButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer"
  },
  buttonGroup: {
    display: "flex",
    gap: "1.5rem",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "1rem 2.5rem",
    border: "none",
    borderRadius: "16px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(102,126,234,0.4)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: "220px"
  },
  loadingButton: { opacity: 0.8, cursor: "not-allowed" },
  secondaryButton: {
    background: "rgba(255,255,255,0.9)",
    color: "#475569",
    padding: "1rem 2rem",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    minWidth: "160px"
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  errorCard: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "2rem",
    cursor: "pointer",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  errorIcon: { fontSize: "1.2rem" },
  resultsCard: {
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "3rem",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
  },
  statsRow: {
    display: "flex",
    gap: "3rem",
    justifyContent: "center",
    marginBottom: "2.5rem",
    flexWrap: "wrap"
  },
  stat: { textAlign: "center" },
  statNumber: { fontSize: "2.5rem", fontWeight: "800", color: "#667eea" },
  statLabel: { color: "#64748b", fontWeight: "500", fontSize: "0.95rem", textTransform: "uppercase" },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    marginBottom: "2.5rem"
  },
  table: { width: "100%", borderCollapse: "collapse", background: "white" },
  tableHead: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  tableHeader: { padding: "1.25rem 1.5rem", color: "white", fontWeight: "700", textAlign: "left" },
  tableRow: { transition: "background 0.2s ease" },
  tableCell: { padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" },
  tableCellFeedback: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #f1f5f9",
    color: "#475569",
    lineHeight: "1.6",
    maxWidth: "300px"
  },
  questionPreview: {
    fontSize: "0.9rem",
    color: "#475569",
    fontStyle: "italic"
  },
  scoreBadge: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "0.9rem"
  },
  gradeBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "0.85rem",
    color: "white"
  },
  downloadSection: { textAlign: "center" },
  downloadButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    padding: "1rem 3rem",
    border: "none",
    borderRadius: "16px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(16,185,129,0.4)"
  }
};

// Add to your CSS file or use styled-components
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function getGradeColor(grade) {
  const colors = {
    'A': '#10b981',
    'B': '#f59e0b',
    'C': '#f97316',
    'D': '#ef4444',
    'F': '#dc2626'
  };
  return colors[grade?.toUpperCase()?.[0]] || '#6b7280';
}
