import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles//Headers.css";

export default function Headers() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user"));
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <header className="app-header">
            {/* CENTER TITLE */}
            <div className="header-content">
                <h1 className="header-title">AI Answer Evaluator</h1>
                <p className="header-subtitle">Professional grading powered by AI</p>
            </div>

            {/* PROFILE MENU */}
            <div className="profile-menu">
                <button
                    className="profile-btn"
                    onClick={() => setShowProfileMenu(prev => !prev)}
                >
                    {userData?.user?.email || userData?.email || "User"}
                    <span className="profile-caret">▾</span>
                </button>

                {showProfileMenu && (
                    <div className="profile-dropdown">
                        <button onClick={() => navigate("/profile")}>👤 My Profile</button>
                        <button onClick={() => navigate("/scores")}>📊 My Scores</button>
                        <button className="logout" onClick={handleLogout}>🚪 Logout</button>
                    </div>
                )}
            </div>
        </header>
    );
}
