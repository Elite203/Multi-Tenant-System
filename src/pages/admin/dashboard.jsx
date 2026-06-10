import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SchemaExplorer from "../../components/admin/SchemaExplorer";

export default function AdminDashboard({ adminUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminUser) {
      navigate("/admin"); // redirect if no adminUser
    }
  }, [adminUser, navigate]);

  if (!adminUser) {
    return null; // Prevent rendering until redirect happens
  }

  return <SchemaExplorer adminUser={adminUser} />;
}
