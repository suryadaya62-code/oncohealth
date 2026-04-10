import { useState } from "react";

function App() {
  const [form, setForm] = useState({ name: "", email: "", date: "" });
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.date) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setAppointments([...appointments, form]);
    setForm({ name: "", email: "", date: "" });
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "#f0f6ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "2rem",
    fontFamily: "Arial, sans-serif",
  };

  const containerStyle = {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2 style={{ marginTop: 0 }}>Oncology Clinic</h2>

        <input
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: "12px", padding: "8px", boxSizing: "border-box" }}
        />
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: "12px", padding: "8px", boxSizing: "border-box" }}
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: "12px", padding: "8px", boxSizing: "border-box" }}
        />

        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

        <button onClick={handleSubmit} style={{ width: "100%", padding: "10px", cursor: "pointer" }}>
          Book appointment
        </button>

        {appointments.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <h3>Appointments</h3>
            {appointments.map((a, i) => (
              <p key={i}>{a.name} — {a.email} — {a.date}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;