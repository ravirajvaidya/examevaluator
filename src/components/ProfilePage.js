import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

export default function ProfilePage({ user }) {
  const navigate = useNavigate();

  // Fallback profile data (if props not passed)
  const profile = user || {
    name: "Saurabh Kumar",
    email: "saurabh@example.com",
    role: "Student",
    phone: "+91 9XXXXXXXXX",
    organization: "ABC Institute",
    joinedOn: "15 Jan 2025",
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        
        {/* Header */}
        <div className="profile-header">
          <div className="avatar">
            {profile.name.charAt(0)}
          </div>
          <h2>{profile.name}</h2>
          <p className="role">{profile.role}</p>
        </div>

        {/* Details */}
        <div className="profile-details">
          <div className="detail-row">
            <span>Email</span>
            <span>{profile.email}</span>
          </div>

          <div className="detail-row">
            <span>Phone</span>
            <span>{profile.phone}</span>
          </div>

          <div className="detail-row">
            <span>Organization</span>
            <span>{profile.organization}</span>
          </div>

          <div className="detail-row">
            <span>Joined On</span>
            <span>{profile.joinedOn}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button
            className="logout-btn"
            onClick={() => navigate("/dashboard")}
          >
            ⬅ Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
