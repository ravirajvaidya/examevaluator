import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/ScoresPage.css";

const PAGE_SIZE = 10;

export default function ScoresPage() {
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedEval, setSelectedEval] = useState(null);
  const [modalType, setModalType] = useState(""); // 'answer' | 'feedback'

  useEffect(() => {
    fetchEvaluations();
  }, [page]);

  const fetchEvaluations = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await supabase
      .from("manual_evaluations")
      .select(
        "eval_id, question, answer, score, feedback, evaluated_at",
        { count: "exact" }
      )
      .eq("evaluation_status", "EVALUATED")
      .order("evaluated_at", { ascending: false })
      .range(from, to);

    if (!error) {
      setEvaluations(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openModal = (item, type) => {
    setSelectedEval(item);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedEval(null);
    setModalType("");
  };

  // SIMPLE PDF (no circles / fancy graphics)
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Scores Report", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")} | Total: ${totalCount}`,
      14,
      y
    );
    y += 10;

    doc.setFontSize(11);

    evaluations.forEach((item, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const addBlock = (label, text) => {
        const lines = doc.splitTextToSize(`${label}: ${text}`, 180);
        if (y + lines.length * 6 > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, 14, y);
        y += lines.length * 6 + 3;
      };

      doc.text(`Evaluation #${idx + 1}`, 14, y);
      y += 6;

      addBlock(
        "Date",
        item.evaluated_at
          ? new Date(item.evaluated_at).toLocaleString("en-IN")
          : ""
      );
      addBlock("Question", item.question);
      addBlock("Answer", item.answer);
      addBlock("Feedback", item.feedback || "No feedback");
      addBlock("Score", `${item.score} / 10`);

      y += 4;
      doc.line(14, y, 196, y);
      y += 6;
    });

    doc.save("scores_report.pdf");
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading scores...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        {/* Simple header like your old page */}
        <div className="page-header">
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ⬅ Back to Dashboard
          </button>

          <h1 className="page-title">Scores</h1>

          <button className="download-btn" onClick={downloadPDF}>
            📄 Download PDF
          </button>
        </div>

        {/* Simple stats row (optional) */}
        {totalCount > 0 && (
          <div className="stats-bar">
            <span>
              Total Evaluations: <strong>{totalCount}</strong>
            </span>
            <span>
              Avg Score:{" "}
              <strong>
                {Math.round(
                  (evaluations.reduce((s, e) => s + e.score, 0) /
                    evaluations.length) *
                    10
                ) / 10}
              </strong>
            </span>
          </div>
        )}

        {/* TABLE VIEW */}
        <div className="table-container">
          {evaluations.length === 0 ? (
            <div className="empty-state">
              <h3>No Evaluations</h3>
              <p>No evaluated answers found.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Score</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((item) => (
                      <tr key={item.eval_id}>
                        <td className="date-cell">
                          {item.evaluated_at
                            ? new Date(item.evaluated_at).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </td>
                        <td className="question-cell" title={item.question}>
                          {item.question.length > 80
                            ? item.question.substring(0, 80) + "..."
                            : item.question}
                        </td>
                        <td
                          className="answer-cell clickable"
                          onClick={() => openModal(item, "answer")}
                        >
                          <span className="click-text">View Answer</span>
                        </td>
                        <td className="score-cell">
                          {item.score}/10
                        </td>
                        <td
                          className="feedback-cell clickable"
                          onClick={() => openModal(item, "feedback")}
                        >
                          <span className="click-text">
                            {item.feedback
                              ? item.feedback.length > 40
                                ? item.feedback.substring(0, 40) + "..."
                                : item.feedback
                              : "No feedback"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ◀ Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages} ({totalCount} total)
                  </span>
                  <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* POPUP MODAL WITH FULL DETAILS */}
      {selectedEval && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === "answer" ? "Full Answer" : "Detailed Feedback"}
              </h3>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-section">
              <strong>Question:</strong>
              <div className="modal-text">{selectedEval.question}</div>
            </div>

            <div className="modal-section">
              <strong>Score:</strong> {selectedEval.score}/10
            </div>

            <div className="modal-section">
              <strong>
                {modalType === "answer" ? "Student Answer:" : "Evaluator Feedback:"}
              </strong>
              <div className="modal-text">
                {modalType === "answer"
                  ? selectedEval.answer
                  : selectedEval.feedback || "No feedback provided"}
              </div>
            </div>

            <div className="modal-section small-text">
              Evaluated on:{" "}
              {selectedEval.evaluated_at
                ? new Date(selectedEval.evaluated_at).toLocaleString("en-IN")
                : ""}
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
