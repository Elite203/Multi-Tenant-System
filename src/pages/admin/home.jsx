import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminPage from "./components/admin/AdminPage";

export default function AdminHome({ adminUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminUser) {
      navigate("/admin"); // redirect to login if no adminUser
    }
  }, [adminUser, navigate]);

  if (!adminUser) {
    return null; // Prevent rendering until redirect happens
  }

  return <AdminPage adminUser={adminUser} />;
}
