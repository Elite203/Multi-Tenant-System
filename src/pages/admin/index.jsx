import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogin from "./components/admin/AdminLogin";

export default function AdminIndex({ adminUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (adminUser) {
      navigate("/admin/home"); // redirect to admin home if logged in
    }
  }, [adminUser, navigate]);

  if (adminUser) {
    return null; // Prevent rendering until redirect happens
  }

  return <AdminLogin />;
}
