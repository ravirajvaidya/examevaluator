import { useState } from "react";
import "../styles/StudentDashboard.css";

export default function StudentDashboard() {
    const questions = [
        {
            question: "What is the capital of India?",
            options: ["Mumbai", "New Delhi", "Chennai", "Kolkata"],
            correctAnswer: "New Delhi"
        },
        {
            question: "Which planet is known as the Red Planet?",
            options: ["Earth", "Venus", "Mars", "Jupiter"],
            correctAnswer: "Mars"
        },
        {
            question: "What is H2O commonly known as?",
            options: ["Oxygen", "Hydrogen", "Salt", "Water"],
            correctAnswer: "Water"
        }
    ];

    const [currentIndex] = useState(0); // locked to first question for now
    const [selectedOption, setSelectedOption] = useState("");
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleSubmit = () => {
        if (!selectedOption) {
            alert("Please select an option");
            return;
        }
        setShowResult(true);
    };

    return (
        <div className="quiz-page">
            <div className="quiz-card">
                <h1 className="quiz-title">SIMPLE QUIZ</h1>

                <div className="question-box">
                    {currentQuestion.question}
                </div>

                <div className="options-grid">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            className={`option-btn ${selectedOption === option ? "selected" : ""
                                }`}
                            onClick={() => {
                                setSelectedOption(option);
                                setShowResult(false);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <button className="submit-btn" onClick={handleSubmit}>
                    Submit
                </button>

                {showResult && (
                    <p className="result-text">
                        {selectedOption === currentQuestion.correctAnswer
                            ? "✅ Correct Answer!"
                            : `❌ Wrong Answer. Correct: ${currentQuestion.correctAnswer}`}
                    </p>
                )}
            </div>
        </div>
    );
}
