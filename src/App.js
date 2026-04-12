import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Team from "./Team";
import doctors from "./data/doctors";

const services = [
  {
    title: "Cancer screening",
    description: "Advanced imaging, lab testing, and personalized risk assessments for early detection.",
  },
  {
    title: "Treatment planning",
    description: "Evidence-based oncology care, chemotherapy coordination, and supportive services.",
  },
  {
    title: "Patient support",
    description: "Nutrition guidance, counseling, and a dedicated care team to keep you informed and strong.",
  },
];

const testimonials = [
  {
    name: "Maria T.",
    quote: "The team made me feel supported every step of the way. Their care gave me confidence and hope.",
  },
  {
    name: "James R.",
    quote: "Fast, compassionate, and professional. I felt safe in the hands of experienced specialists.",
  },
];

function App() {
  const [form, setForm] = useState({ name: "", email: "", date: "", message: "" });
  const [appointments, setAppointments] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.date) {
      setError("Please fill in all required fields.");
      setSubmitted(false);
      return;
    }
    setError("");
    setAppointments([...appointments, form]);
    setSubmitted(true);
    setForm({ name: "", email: "", date: "", message: "" });
  };

  return (
    <div className="App">
      <nav className="site-nav">
        <Link to="/" className="nav-logo">Oncology Clinic</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/team">Team</Link>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              doctors={doctors}
              services={services}
              testimonials={testimonials}
              form={form}
              setForm={setForm}
              handleSubmit={handleSubmit}
              error={error}
              submitted={submitted}
              appointments={appointments}
            />
          }
        />
        <Route path="/team" element={<Team doctors={doctors} />} />
      </Routes>
    </div>
  );
}

function HomePage({ doctors, services, testimonials, form, setForm, handleSubmit, error, submitted, appointments }) {
  return (
    <>
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Oncology Clinic</p>
          <h1>Compassionate cancer care designed for your recovery.</h1>
          <p className="hero-copy">
            We combine modern oncology treatment with patient-centered support to guide you and your family through every stage.
          </p>
          <div className="hero-actions">
            <a href="#appointment" className="btn btn-primary">Book an appointment</a>
            <Link to="/team" className="btn btn-secondary">Meet the team</Link>
          </div>
        </div>
        <div className="hero-image" />
      </header>

      <main>
        <section id="about" className="section about-section">
          <div className="section-content">
            <h2>Trusted care for every patient</h2>
            <p>
              Our clinic provides coordinated oncology services in a warm, welcoming environment.
              From early screening to treatment and recovery planning, our specialists are here to support you.
            </p>
          </div>
        </section>

        <section id="doctors" className="section doctors-section">
          <div className="section-header">
            <h2>Our lead doctors</h2>
            <p>Meet the specialists who guide every patient journey.</p>
          </div>
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <article key={doctor.name} className="card doctor-card">
                <div className="portrait">{doctor.initials}</div>
                <h3>
                  {doctor.highlight ? (
                    <span className="doctor-name-highlight">{doctor.name}</span>
                  ) : (
                    doctor.name
                  )}
                </h3>
                <p className="doctor-role">{doctor.role}</p>
                <p>{doctor.bio}</p>
              </article>
            ))}
          </div>
          <div className="section-actions">
            <Link to="/team" className="btn btn-secondary">View full team</Link>
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="section-header">
            <h2>What we offer</h2>
            <p>Comprehensive care designed around your needs.</p>
          </div>
          <div className="card-grid">
            {services.map((service) => (
              <article key={service.title} className="card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section testimonials-section">
          <div className="section-header">
            <h2>Patient stories</h2>
            <p>Confidence, comfort, and successful outcomes from families like yours.</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="testimonial-card">
                <p>“{item.quote}”</p>
                <footer>- {item.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="appointment" className="section appointment-section">
          <div className="section-content appointment-grid">
            <div>
              <h2>Schedule your visit</h2>
              <p>Request an appointment and our care team will reach out to confirm your preferred time.</p>
              <ul>
                <li>Expert oncologists and nursing staff</li>
                <li>Easy appointment booking</li>
                <li>Support with insurance and referrals</li>
              </ul>
            </div>

            <form className="appointment-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </label>
              <label>
                Preferred date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label>
                Notes (optional)
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your needs"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn-primary">Submit request</button>
              {submitted && <p className="form-success">Thank you! We will contact you shortly.</p>}
            </form>
          </div>

          {appointments.length > 0 && (
            <div className="appointments-list">
              <h3>Requested appointments</h3>
              {appointments.map((appointment, index) => (
                <div key={index} className="appointment-card">
                  <strong>{appointment.name}</strong>
                  <span>{appointment.email}</span>
                  <span>{appointment.date}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div>
          <h2>Oncology Clinic</h2>
          <p>Delivering thoughtful cancer care with every patient journey.</p>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#appointment">Appointment</a>
        </div>
      </footer>
    </>
  );
}

export default App;
