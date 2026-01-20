import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage(props) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        academyId: "",
        studentId: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Signup Data:", formData);

        // TODO: Call Supabase / API here
    };

    return (
        <div style={{ maxWidth: "400px", margin: "auto" }}>
            <h2>Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="academyId"
                    placeholder="Academy ID"
                    value={formData.academyId}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="studentId"
                    placeholder="Student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                />

                <button type="submit">Create Account</button>
            </form>
            <button type="button" onClick={() => navigate("/")}>Back</button>
        </div>
    );
}
