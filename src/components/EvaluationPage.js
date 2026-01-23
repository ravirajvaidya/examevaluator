// EvaluationPage.jsx - COMPLETE FINAL VERSION
// All fixes included: Excel download with Q/A/RollNo, dynamic question height, modern UI

import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

export default function EvaluationPage() {

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const userData = JSON.parse(localStorage.getItem("user"));
    console.log("userData = " + JSON.stringify(userData));
    const [file, setFile] = useState(null);
    const [rollNo, setRollNo] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [results, setResults] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const API_ENDPOINT = "http://localhost:8000/api/evaluate-excel";

    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleFileUpload = (e) => {
        setFile(e.target.files[0]);
        setError("");
        setResults([]);
        setShowPreview(false);
    };

    const validateInput = useCallback(() => {
        if (!rollNo.trim()) return "Please enter a roll number";
        if (!question.trim()) return "Please enter a question";
        if ((!answer.trim() && !file)) return "Please enter an answer or upload a file";
        return "";
    }, [rollNo, question, answer, file]);

    const handleEvaluate = async () => {
        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setLoading(true);
        setShowPreview(false);

        const formData = new FormData();

        try {
            if (file) {
                formData.append("file", file);
            } else {
                const data = [{
                    roll_number: rollNo.trim(),
                    question: question.trim(),
                    answer: answer.trim()
                }];
                const ws = XLSX.utils.json_to_sheet(data, {
                    header: ["roll_number", "question", "answer"]
                });
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });
                formData.append("file", blob, "answers.xlsx");
            }

            const response = await axios.post(API_ENDPOINT, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000,
            });

            let evalResults = [];
            if (response.data.results && Array.isArray(response.data.results)) {
                evalResults = response.data.results;
            } else if (Array.isArray(response.data)) {
                evalResults = response.data;
            } else {
                evalResults = [response.data];
            }

            const transformedResults = evalResults.map(item => {
                const safeItem = {
                    rollNo: item.roll_number || item.rollNo || item.roll_no || "Unknown",
                    question: item.question || "",
                    answer: item.answer || "",
                    total_score: parseFloat(item.total_score) || 0,
                    content_score: parseFloat(item.content_score) || 0,
                    organization_score: parseFloat(item.organization_score) || 0,
                    language_score: parseFloat(item.language_score) || 0,
                    grade: item.grade || "F",
                    feedback: item.feedback || "No feedback available"
                };
                Object.keys(safeItem).forEach(key => {
                    if (typeof safeItem[key] === 'number' && isNaN(safeItem[key])) {
                        safeItem[key] = 0;
                    }
                });
                return safeItem;
            });

            setResults(transformedResults);
            setShowPreview(true);

        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
            if (err.code === 'ECONNABORTED') {
                setError("⏰ Request timed out. Backend processing may take longer.");
            } else if (err.response?.status === 404) {
                setError("🚫 Backend not found. Is server running on http://localhost:8000?");
            } else if (err.response?.status === 400) {
                setError(`📄 ${err.response.data.error || "Invalid file format"}`);
            } else {
                setError(`❌ ${err.response?.data?.error || err.message || "Unknown error"}`);
            }
        } finally {
            setLoading(false);
        }
    };

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

    const clearForm = () => {
        setRollNo("");
        setQuestion("");
        setAnswer("");
        setFile(null);
        setResults([]);
        setShowPreview(false);
        setError("");
    };

    return (
        <div style={styles.container}>
            {/* Profile Header Bar */}
            <div style={styles.profileBar}>
                <button
                    style={styles.profileButton}
                    onClick={() => setShowProfileMenu(prev => !prev)}
                >
                    <img
                        src="logo192.png"
                        alt="profile"
                        style={styles.profileImage}
                    />
                    <span style={styles.profileName}>{userData.user.email}</span>
                    <span style={styles.caret}>▾</span>
                </button>

                {showProfileMenu && (
                    <div style={styles.profileDropdown}>
                        <button
                            style={styles.dropdownButton}
                            onClick={() => navigate("/profile")}
                        >
                            👤 My Profile
                        </button>

                        <button
                            style={styles.dropdownButton}
                            onClick={() => navigate("/scores")}
                        >
                            📊 My Scores
                        </button>

                        <button
                            style={styles.dropdownButton}
                            onClick={() => navigate("/settings")}
                        >
                            ⚙️ Settings
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
            <div style={styles.header}>
                <h1 style={styles.title}>🤖 AI Answer Evaluator</h1>
                <p style={styles.subtitle}>Professional grading powered by AI</p>
            </div>

            <div style={styles.mainContent}>

                {/* <div style={styles.uploadCard}>

                    <div style={styles.cardHeader}>
                        <span style={styles.icon}>📊</span>
                        <h3 style={styles.cardTitle}>Excel Submission</h3>
                    </div>

                    <div style={styles.instructionsBox}>
                        <h4 style={styles.instructionsTitle}>How to Submit</h4>
                        <div style={styles.instructionsList}>
                            <p>1. Download the provided Excel template.</p>
                            <p>2. Fill in your details, questions, and answers. Every entry should have your roll number.</p>
                            <p>3. Upload the completed Excel file.</p>
                            <p>4. Submit to get your answers evaluated.</p>
                        </div>
                        <a
                            href="Answers.xlsx"
                            download
                            style={styles.downloadButton}
                        >
                            ⬇ Download Excel Template
                        </a>
                    </div>
                    <div style={styles.uploadContainer}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            style={styles.hiddenFileInput}
                        />

                        <label htmlFor="file-upload" style={styles.uploadButton}>
                            {file ? (
                                <>
                                    <div style={styles.fileIcon}>✅</div>
                                    <div>
                                        <div style={styles.fileName}>{file.name}</div>
                                        <div style={styles.fileSize}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                    <button
                                        style={styles.removeButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={styles.uploadIcon}>📁</div>
                                    <div style={styles.uploadText}>
                                        <div style={styles.uploadTitle}>Choose Excel File</div>
                                        <div style={styles.uploadSubtitle}>
                                            or drag and drop (XLSX, XLS, CSV)
                                        </div>
                                    </div>
                                    <div style={styles.uploadBrowse}>Browse Files</div>
                                </>
                            )}
                        </label>
                    </div>
                </div> */}

                {/* Manual Entry */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.icon}>✏️</span>
                        <h3 style={styles.cardTitle}>Manual Entry</h3>
                    </div>

                    {error && (
                        <div style={styles.errorCard} onClick={() => setError("")}>
                            <span style={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}
                    <div style={styles.formWrapper}>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Roll Number <span style={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g., 12345"
                                    value={rollNo}
                                    onChange={(e) => setRollNo(e.target.value)}
                                    style={styles.rollNoInput}
                                    disabled={loading}
                                />
                            </div>

                            {/* ✅ DYNAMIC SMALL QUESTION BOX */}
                            <div style={styles.textareaGroup}>
                                <label style={styles.label}>Question <span style={styles.required}>*</span></label>
                                <textarea
                                    placeholder="Enter the complete question here..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    style={styles.questionTextarea}
                                    disabled={loading}
                                />
                            </div>

                            <div style={styles.textareaGroup}>
                                <label style={styles.label}>Student Answer <span style={styles.required}>*</span></label>
                                <textarea
                                    placeholder="Enter the student's complete answer here..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    style={styles.fullTextarea}
                                    rows={6}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button
                            onClick={handleEvaluate}
                            disabled={loading || (!rollNo && !file)}
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
                            ) : (
                                <>
                                    🚀 <span>Evaluate Answer</span>
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

                {/* Results */}
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
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: { textAlign: "center", marginBottom: "3rem", color: "white" },
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
    cardHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" },
    icon: { fontSize: "2rem" },
    cardTitle: { fontSize: "1.8rem", fontWeight: "700", color: "#1e293b", margin: 0 },

    formWrapper: {
        maxWidth: "1920px",
        margin: "0 auto",
        padding: "0 24px"
    },

    formGrid: {
        display: "grid",
        gap: "2rem",
        marginBottom: "2.5rem"
    },

    inputGroup: {
        display: "flex",
        flexDirection: "column"
    },

    textareaGroup: {
        display: "flex",
        flexDirection: "column"
    },

    label: {
        textAlign: "left",
        fontSize: "1rem",
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: "0.75rem"
    },

    required: {
        color: "#ef4444"
    },

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
    buttonGroup: { display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" },
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
    statsRow: { display: "flex", gap: "3rem", justifyContent: "center", marginBottom: "2.5rem", flexWrap: "wrap" },
    stat: { textAlign: "center" },
    statNumber: { fontSize: "2.5rem", fontWeight: "800", color: "#667eea" },
    statLabel: { color: "#64748b", fontWeight: "500", fontSize: "0.95rem", textTransform: "uppercase" },
    tableContainer: { overflowX: "auto", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", marginBottom: "2.5rem" },
    table: { width: "100%", borderCollapse: "collapse", background: "white" },
    tableHead: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    tableHeader: { padding: "1.25rem 1.5rem", color: "white", fontWeight: "700", textAlign: "left" },
    tableRow: { transition: "background 0.2s ease" },
    tableCell: { padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" },
    tableCellFeedback: { padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", color: "#475569", lineHeight: "1.6" },
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
    },
    instructionsBox: {
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "20px"
    },
    instructionsTitle: {
        margin: "0 0 10px",
        fontSize: "16px",
        fontWeight: "600",
        color: "#111827"
    },
    instructionsList: {
        margin: "0 0 14px",
        paddingLeft: "18px",
        fontSize: "14px",
        color: "#374151",
        lineHeight: "1.6",
        textAlign: "center"
    },
    downloadButton: {
        display: "inline-block",
        padding: "8px 14px",
        background: "#2563eb",
        color: "#fff",
        borderRadius: "6px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "500"
    },
    profileBar: {
        display: "flex",
        justifyContent: "flex-end",
        position: "relative",
        marginBottom: "1rem"
    },

    profileButton: {
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "999px",
        padding: "0.4rem 0.8rem",
        cursor: "pointer",
        fontWeight: "600"
    },

    profileImage: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        objectFit: "cover"
    },

    profileName: {
        fontSize: "0.95rem",
        color: "#1f2937"
    },

    caret: {
        fontSize: "0.8rem",
        color: "#6b7280"
    },

    profileDropdown: {
        position: "absolute",
        top: "48px",
        right: "0",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        width: "180px",
        overflow: "hidden",
        zIndex: 1000
    },

    dropdownItem: {
        padding: "10px 14px",
        fontSize: "0.9rem",
        cursor: "pointer",
        color: "#111827"
    },

    dropdownDivider: {
        height: "1px",
        background: "#e5e7eb",
        margin: "4px 0"
    },
    dropdownButton: {
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        fontSize: "0.9rem",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#111827",
        fontFamily: "inherit"
    },
    dropdownButtonHover: {
        background: "#f3f4f6"
    },
};

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
