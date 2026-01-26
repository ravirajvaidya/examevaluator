import React, { useEffect, useState } from "react";
import "../styles/ProfilePage.css";
import { supabase } from "../supabaseClient";
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";

export default function ProfilePage(props) {

  const userData = JSON.parse(localStorage.getItem("user"));

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const loadProfile = async () => {
      // 1️⃣ Wait for session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No session yet");
        return;
      }

      // 2️⃣ Fetch user profile
      const { data, error } = await supabase
        .from("userdetails")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfileData(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (!profileData) return <p>No profile found</p>;

  console.log("INSIDE profileData " + JSON.stringify(profileData));

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {profileData.name.charAt(0)}
          </div>
          <h2>{profileData.name}</h2>
          <p className="role">{profileData.studentid}</p>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span>Email</span>
            <span>{profileData.email}</span>
          </div>

          {/* <div className="detail-row">
            <span>Phone</span>
            <span>{profileData[0].phone}</span>
          </div> */}

          <div className="detail-row">
            <span>Organization</span>
            <span>{profileData.academyid}</span>
          </div>

          <div className="detail-row">
            <span>Joined On</span>
            <span>{dayjs(profileData.createdat).format("D MMM YYYY")}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="logout-btn" onClick={async () => {
            await supabase.auth.signOut()
            navigate('/');
          }}>Logout</button>
        </div>
      </div>
    </div >
  );
}
