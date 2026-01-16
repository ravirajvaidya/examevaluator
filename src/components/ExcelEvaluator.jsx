import React, { useState } from "react";

function ExcelEvaluator() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/evaluate-excel",
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();
      setResults(data.results);

    } catch (err) {
      setError("Failed to evaluate file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* <h2 style={styles.title}>Excel Answer Evaluator</h2> */}

        {/* Upload & Action */}
        <div style={styles.actionRow}>
          <label style={styles.uploadBox}>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <span style={styles.uploadText}>
              {file ? file.name : "Choose Excel file"}
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.disabledButton : {})
            }}
          >
            {loading ? "Evaluating..." : "Evaluate"}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* Results */}
        {results && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Roll No</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{row.roll_number}</td>
                    <td style={styles.td}>{row.total_score}</td>
                    <td style={styles.grade}>{row.grade}</td>
                    <td style={styles.td}>{row.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "40px 20px",
    fontFamily: "Inter, system-ui, sans-serif"
  },
  card: {
    maxWidth: "960px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "32px",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },
  title: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "28px"
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  uploadBox: {
    padding: "12px 18px",
    border: "1.5px dashed #cbd5e1",
    borderRadius: "14px",
    cursor: "pointer",
    backgroundColor: "#f1f5f9",
    transition: "0.2s"
  },
  uploadText: {
    fontSize: "14px",
    color: "#334155"
  },
  primaryButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(59,130,246,0.35)",
    transition: "0.2s"
  },
  disabledButton: {
    background: "#94a3b8",
    boxShadow: "none",
    cursor: "not-allowed"
  },
  error: {
    textAlign: "center",
    color: "#dc2626",
    marginTop: "12px"
  },
  tableWrapper: {
    marginTop: "32px",
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
    padding: "14px",
    textAlign: "center",
    borderBottom: "1px solid #e2e8f0"
  },
  tr: {
    borderBottom: "1px solid #e5e7eb"
  },
  td: {
    padding: "14px",
    fontSize: "14px",
    textAlign: "center",
    color: "#475569"
  },
  grade: {
    padding: "14px",
    textAlign: "center",
    fontWeight: "600",
    color: "#16a34a"
  }
};

export default ExcelEvaluator;
