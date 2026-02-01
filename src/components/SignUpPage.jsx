import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

export default function SignUpPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        academyid: "",
        studentid: ""
    });

    const [lstAcademies, setLstAcademies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAcademies();
    }, []);

    const fetchAcademies = async () => {
        try {
            const res = await axios.get(
                `${SUPABASE_URL}/rest/v1/academydetails?select=academyid,academyname`,
                { headers: { apikey: SUPABASE_ANON_KEY } }
            );
            setLstAcademies(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load academies");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // STEP 1: Create the User in Supabase Auth
            const signupRes = await axios.post(
                `${SUPABASE_URL}/auth/v1/signup`,
                {
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            // Use multiple keys to ensure the dashboard picks one up
                            full_name: formData.name,   // Often required for the 'Display name' column
                            phone: formData.phone,       // User metadata phone
                            name: formData.name,
                            academyid: formData.academyid,
                            studentid: formData.studentid,
                            mobileno: formData.phone
                        }
                    }
                },
                {
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log("signupRes.data.id : " + JSON.stringify(signupRes.data));
            // FIX: Supabase returns the user object inside the data property
            // If "Confirm Email" is OFF, the ID is in signupRes.data.id
            // If using certain versions/configs, it might be in signupRes.data.user.id
            const user = signupRes.data.user || signupRes.data;
            const userId = user?.id;

            console.log("Captured User ID:", userId)


            if (userId) {
                // STEP 2: Post directly to the 'userdetails' table
                await axios.post(
                    `${SUPABASE_URL}/rest/v1/userdetails`,
                    {
                        auth_user_id: userId,
                        name: formData.name,
                        email: formData.email,
                        academyid: formData.academyid,
                        studentid: formData.studentid
                    },
                    {
                        headers: {
                            apikey: SUPABASE_ANON_KEY,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        }
                    }
                );

                alert("Account created successfully!");
                navigate("/");
            }
        } catch (err) {
            console.error("Signup error:", err.response?.data || err.message);
            setError(
                err.response?.data?.msg ||
                err.response?.data?.error_description ||
                "Signup failed. Check console for details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleSubmit} className="auth-form" >
                <input type="text" name="name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
                <input type="text" name="phone" placeholder="Phone No" value={formData.phone} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />

                <select name="academyid" value={formData.academyid} onChange={handleChange} required>
                    <option value="">Select Academy</option>
                    {lstAcademies.map(a => (
                        <option key={a.academyid} value={a.academyid}>{a.academyname}</option>
                    ))}
                </select>

                <input type="text" name="studentid" placeholder="Student ID" value={formData.studentid} onChange={handleChange} />

                <button className="auth-btn" type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Create Account"}
                </button>
            </form>

            <button
                className="auth-btn auth-btn-secondary"
                onClick={() => navigate("/")}
            >
                Back
            </button>
        </div>
    );
}
