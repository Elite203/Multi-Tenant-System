import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ useNavigate instead of next/router
import { supabase } from "../../lib/supabaseClient"; // ✅ adjust path if needed

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // ✅ useNavigate hook

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login failed: " + error.message);
    } else {
      // ✅ Navigate to admin home page
      navigate("/admin/home");
    }
    setIsLoading(false);
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "1rem",
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    width: "100%",
    maxWidth: "400px",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "1.5rem",
    textAlign: "center",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const inputStyle = {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "1rem",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const inputFocusStyle = {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  };

  const buttonStyle = {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: isLoading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    opacity: isLoading ? 0.7 : 1,
    width: "100%",
  };

  const buttonHoverStyle = {
    backgroundColor: "#2563eb",
    transform: "translateY(-1px)",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Admin Portal</h2>
        <form onSubmit={handleLogin} style={formStyle}>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputStyle)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputStyle)}
            required
          />
          <button
            type="submit"
            style={buttonStyle}
            disabled={isLoading}
            onMouseEnter={(e) =>
              !isLoading && Object.assign(e.target.style, buttonHoverStyle)
            }
            onMouseLeave={(e) =>
              !isLoading && Object.assign(e.target.style, buttonStyle)
            }
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
