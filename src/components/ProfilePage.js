import React from "react";
import "../styles/ProfilePage.css";

export default function ProfilePage(props) {

  // fallback data if props not passed
  const profile = props.user || {
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
        <div className="profile-header">
          <div className="avatar">
            {profile.name.charAt(0)}
          </div>
          <h2>{profile.name}</h2>
          <p className="role">{profile.role}</p>
        </div>

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

        <div className="profile-actions">
          <button className="logout-btn">Logout</button>
        </div>
      </div>
    </div>
  );
}
