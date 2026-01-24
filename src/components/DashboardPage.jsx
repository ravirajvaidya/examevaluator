import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));

  const isSubmitted =
    localStorage.getItem("ibps_test_submitted") === "true";

  const tests = [
    {
      id: 1,
      title: "IBPS Descriptive Mock Test",
      duration: "30 Minutes"
    }
  ];

  /* ================= PROFILE DROPDOWN ================= */
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleViewEvaluation = (testId) => {
    localStorage.setItem("selected_test_id", testId);
    navigate("/scores");
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Dashboard</h2>
          <p style={styles.subHeading}>
            Welcome, {userData?.user?.email || "Student"}
          </p>
        </div>

        {/* PROFILE DROPDOWN */}
        <div style={styles.profileWrapper} ref={menuRef}>
          <button
            style={styles.profileButton}
            onClick={() => setShowMenu((prev) => !prev)}
          >
            👤 {userData?.user?.email || "Profile"} ▾
          </button>

          {showMenu && (
            <div style={styles.dropdown}>
              <button
                style={styles.dropdownItem}
                onClick={() => navigate("/profile")}
              >
                👤 My Profile
              </button>
              <button
                style={styles.dropdownItem}
                onClick={() => navigate("/scores")}
              >
                📊 My Scores
              </button>
              <div style={styles.divider}></div>
              <button
                style={{ ...styles.dropdownItem, color: "#dc2626" }}
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SELF EVALUATION */}
      <div style={styles.actionRow}>
        <button
          style={styles.secondaryButton}
          onClick={() => navigate("/manual-evaluation")}
        >
          ✍️ Evaluate Your Own Answers
        </button>
      </div>

      {/* TEST LIST */}
      <h3 style={styles.sectionTitle}>Available Exams</h3>

      {tests.map((test) => (
        <div key={test.id} style={styles.testCard}>
          <div>
            <h4
              style={{
                ...styles.testTitle,
                ...(isSubmitted ? styles.lockedText : styles.clickableText)
              }}
              onClick={() => {
                if (!isSubmitted) navigate("/tests");
              }}
            >
              {test.title}
            </h4>
            <p style={styles.testMeta}>⏱ {test.duration}</p>
          </div>

          <div style={styles.rightActions}>
            <span
              style={{
                ...styles.statusBadge,
                ...(isSubmitted ? styles.submittedBadge : {})
              }}
            >
              {isSubmitted ? "Submitted" : "Not Started"}
            </span>

            {isSubmitted && (
              <button
                style={styles.viewBtn}
                onClick={() => handleViewEvaluation(test.id)}
              >
                View Evaluation →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f9fafb",
    padding: 30,
    fontFamily: "Segoe UI, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 30
  },
  heading: { margin: 0, fontSize: 26 },
  subHeading: { marginTop: 6, color: "#475569" },

  /* PROFILE */
  profileWrapper: {
    position: "relative"
  },
  profileButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: 20,
    fontWeight: 600,
    cursor: "pointer"
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "120%",
    background: "white",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    minWidth: 180,
    overflow: "hidden",
    zIndex: 1000
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500
  },
  divider: {
    height: 1,
    background: "#e5e7eb"
  },

  actionRow: { marginBottom: 30 },
  secondaryButton: {
    background: "#e5e7eb",
    padding: "14px 24px",
    borderRadius: 10,
    fontWeight: 600,
    border: "none",
    cursor: "pointer"
  },
  sectionTitle: { marginBottom: 16, fontSize: 20 },

  testCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    padding: 20,
    borderRadius: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  testTitle: { margin: 0, fontSize: 18 },
  clickableText: {
    color: "#1e40af",
    textDecoration: "underline",
    cursor: "pointer"
  },
  lockedText: { color: "#6b7280" },
  testMeta: { marginTop: 6, color: "#64748b" },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  statusBadge: {
    background: "#e5e7eb",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600
  },
  submittedBadge: {
    background: "#dcfce7",
    color: "#166534"
  },
  viewBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer"
  }
};
