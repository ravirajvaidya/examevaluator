import React from "react";
import { jsPDF } from "jspdf";
import "../styles/ScoresPage.css";

export default function ScoresPage({ evaluations }) {

  // Temporary fallback data while editing UI
  const data = evaluations || [
    {
      id: 1,
      subject: "DBMS",
      question: "What is Normalization?",
      answer: "Normalization is the process of organizing data to reduce redundancy.",
      feedback: "Good explanation, add examples next time.",
      score: 6,
      maxScore: 10,
      evaluatedOn: "22 Jan 2026",
    },
    {
      id: 2,
      subject: "DSA",
      question: "Explain Stack and Queue",
      answer: "Stack follows LIFO and Queue follows FIFO principle.",
      feedback: "Clear and concise answer.",
      score: 8,
      maxScore: 10,
      evaluatedOn: "20 Jan 2026",
    },
  ];

  // 📄 PDF download
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Scores Report", 14, y);
    y += 10;

    doc.setFontSize(11);

    data.forEach((item) => {

      const addBlock = (label, text) => {
        const lines = doc.splitTextToSize(`${label}: ${text}`, 180);
        if (y + lines.length * 7 > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, 14, y);
        y += lines.length * 7 + 4;
      };

      addBlock("Question", item.question);
      addBlock("Answer", item.answer);
      addBlock("Feedback", item.feedback);
      addBlock("Score", `${item.score} / ${item.maxScore}`);

      y += 4;
      doc.line(14, y, 196, y);
      y += 8;
    });

    doc.save("scores_report.pdf");
  };

  return (
    <div className="scores-container">
      <div className="scores-header">
        <h2 className="page-title">Scores</h2>
        <button className="download-btn" onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {data.map((item) => (
        <div className="score-card" key={item.id}>
          <div className="score-card-header">
            <h4>{item.subject}</h4>
            <span className="score">
              {item.score}/{item.maxScore}
            </span>
          </div>

          <p><strong>Question:</strong> {item.question}</p>
          <p><strong>Answer:</strong> {item.answer}</p>
          <p><strong>Feedback:</strong> {item.feedback}</p>

          <div className="score-footer">
            <span>{item.evaluatedOn}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
