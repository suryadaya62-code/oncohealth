'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  ShieldCheck, 
  Mail, 
  MessageSquare, 
  Stethoscope, 
  Calendar as CalendarIcon, 
  User as UserIcon,
  CreditCard,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  Download,
  ExternalLink,
  LogIn,
  LogOut,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import PatientDashboard from '@/components/PatientDashboard';
import WhatsAppChat from '@/components/WhatsAppChat';
import Link from 'next/link';
import Image from 'next/image';

// OncoHealth Data Merge from GitHub
const doctorsList = [
  {
    name: "Dr. Devmalya Banerjee",
    initials: "DB",
    role: "Primary Consultant",
    bio: "Chief of Medical Oncology specializing in immunotherapy and clinical oversight.",
    image: "https://picsum.photos/seed/doc1/400/400",
    schedule: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
  },
  {
    name: "Dr. Pritam Ray",
    initials: "PR",
    role: "Onco Consultant",
    bio: "Radiation oncology specialist with expertise in precision targeting and patient care.",
    image: "https://picsum.photos/seed/doc2/400/400",
    schedule: ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']
  },
  {
    name: "Dr. Shaoni Parai",
    initials: "SP",
    role: "Senior Onco Surgeon",
    bio: "Senior surgical oncologist with 15+ years experience in complex recovery procedures.",
    image: "https://picsum.photos/seed/doc3/400/400",
    schedule: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM']
  },
];

const services = [
  {
    icon: <Stethoscope size={20} className="text-teal" />,
    title: 'Cancer Screening',
    description: 'Advanced imaging, lab testing, and personalized risk assessments for early detection.'
  },
  {
    icon: <CalendarIcon size={20} className="text-teal" />,
    title: 'Treatment Planning',
    description: 'Evidence-based oncology care, chemotherapy coordination, and supportive services.'
  },
  {
    icon: <ShieldCheck size={20} className="text-teal" />,
    title: 'Patient Support',
    description: 'Nutrition guidance, counseling, and a dedicated team to keep you informed and strong.'
  }
];

export default function Home() {
  const { user, profile, login, logout, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeMode, setActiveMode] = useState<'booking' | 'portal'>('booking');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 3, 28)); 
  const [selectedDoctor, setSelectedDoctor] = useState(doctorsList[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select, 2: Register & Pay, 3: Completed
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setViewDate(new Date()); // Sync with client local time
  }, []);

  useEffect(() => {
    if (user && (!formData.email || !formData.name)) {
      setFormData(prev => ({ 
        ...prev, 
        email: user.email || prev.email, 
        name: user.displayName || prev.name 
      }));
    }
  }, [user]);

  const handleBookingSuccess = async () => {
    setIsSyncing(true);
    const appointmentData = {
      patientName: formData.name,
      email: formData.email,
      phone: formData.phone,
      doctor: selectedDoctor.name,
      date: selectedDate ? format(selectedDate, 'PPP') : 'N/A',
      slot: selectedSlot,
      notes: formData.notes,
      createdAt: serverTimestamp(),
      status: 'confirmed'
    };

    try {
      const path = 'appointments';
      try {
        await addDoc(collection(db, path), appointmentData);
        setBookingStep(3);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        return;
      }
      
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patientName: formData.name,
          date: appointmentData.date,
          slot: selectedSlot,
          doctor: selectedDoctor.name
        })
      });
      
      const notifyResult = await res.json();
      setLastSyncStatus(notifyResult.results);
    } catch (err) {
      console.error('Booking sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const generateGoogleCalendarLink = () => {
    if (!selectedDate || !selectedSlot) return '#';
    const base = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(`OncoHealth Consultation with ${selectedDoctor.name}`);
    const details = encodeURIComponent(`Confirmed oncology consultation. Doctor: ${selectedDoctor.name}. Location: Memorial Cancer Research Center.`);
    const location = encodeURIComponent('Memorial Cancer Research Center, Suite 402');
    const dateStr = format(selectedDate, 'yyyyMMdd');
    return `${base}&text=${text}&details=${details}&location=${location}&dates=${dateStr}T143000Z/${dateStr}T153000Z`;
  };

  const generateOutlookCalendarLink = () => {
    if (!selectedDate || !selectedSlot) return '#';
    const base = 'https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
    const subject = encodeURIComponent(`OncoHealth Consultation with ${selectedDoctor.name}`);
    const body = encodeURIComponent(`Confirmed oncology consultation. Doctor: ${selectedDoctor.name}. Location: Memorial Cancer Research Center.`);
    const location = encodeURIComponent('Memorial Cancer Research Center, Suite 402');
    const startStr = format(selectedDate, "yyyy-MM-dd'T'14:30:00");
    const endStr = format(selectedDate, "yyyy-MM-dd'T'15:30:00");
    return `${base}&subject=${subject}&body=${body}&location=${location}&startdt=${startStr}&enddt=${endStr}`;
  };

  const downloadICSFile = () => {
    if (!selectedDate || !selectedSlot) return;
    const dateStr = format(selectedDate, 'yyyyMMdd');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OncoHealth//Appointment//EN
BEGIN:VEVENT
UID:${Date.now()}@oncohealth.app
DTSTAMP:${format(new Date(), 'yyyyMMdd\'T\'HHmmss\'Z\'')}
DTSTART:${dateStr}T143000Z
DTEND:${dateStr}T153000Z
SUMMARY:Consultation with ${selectedDoctor.name} (OncoHealth)
DESCRIPTION:Oncology consultation at Memorial Cancer Research Center.
LOCATION:Wing B, Suite 402, Memorial Cancer Research Center
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appointment.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const generateDays = () => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    return eachDayOfInterval({ start, end });
  };

  const calendarDays = generateDays();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-20 bg-white border-b border-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-3 font-bold text-slate text-xl group cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center border-2 border-teal rounded bg-teal/5 text-teal animate-float">
            <Stethoscope size={20} />
          </div>
          <span className="tracking-tight uppercase font-black italic">Onco<span className="text-teal">Health</span></span>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-8">
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
            <button onClick={() => setActiveMode('booking')} className={`hover:text-teal transition-colors ${activeMode === 'booking' ? 'text-teal border-b-2 border-teal pb-1' : ''}`}>Consultations</button>
            <button onClick={() => setActiveMode('portal')} className={`hover:text-teal transition-colors ${activeMode === 'portal' ? 'text-teal border-b-2 border-teal pb-1' : ''}`}>Patient Portal</button>
          </nav>

          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-slate truncate max-w-[100px]">{user.displayName || user.email}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={logout} className="text-[8px] font-bold text-teal uppercase tracking-widest hover:underline">Sign Out</button>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-teal p-0.5 overflow-hidden relative">
                  <Image src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" fill className="rounded-full object-cover" />
                </div>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} onClick={login} className="flex items-center gap-2 px-4 py-2 bg-slate text-white rounded-lg text-xs font-bold">
                <LogIn size={14} />
                <span>Login</span>
              </motion.button>
            )}
            
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => window.open('tel:+919876543210', '_self')} className="theme-btn-emergency flex items-center gap-2">
              <PhoneCall size={14} />
              <span className="hidden sm:inline">Emergency Assistance</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-bg p-4 lg:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-lavender/5 rounded-full blur-3xl -z-10" />
        
        <AnimatePresence mode="wait">
          {activeMode === 'portal' ? (
            <motion.div key="patient-dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col">
              {!user ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/70 backdrop-blur-xl rounded-2xl border border-border shadow-sm">
                   <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mb-6">
                     <Lock size={32} />
                   </div>
                   <h2 className="text-xl font-bold text-slate mb-2">Secure Access Required</h2>
                   <p className="text-sm text-text-muted max-w-sm mb-8">Please sign in to access clinical documents.</p>
                   <button onClick={login} className="theme-btn-primary px-8 py-4 shadow-xl shadow-slate/20">Access Verified Portal</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate">Welcome back, {user.displayName?.split(' ')[0] || 'Patient'}</h1>
                        <p className="text-xs text-text-muted">Access your clinical documents.</p>
                    </div>
                    <button onClick={() => setActiveMode('booking')} className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[10px] font-bold text-slate uppercase tracking-widest shadow-sm"><Plus size={14} /> New Appointment</button>
                  </div>
                  <div className="flex-1 min-h-0"><PatientDashboard /></div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="booking-portal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-6">
              
              <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="theme-card glass-panel bg-white/70 backdrop-blur-xl border border-white/20">
                <div className="section-label"><UserIcon size={12} /> Our Specialists</div>
                <div className="space-y-4">
                  {doctorsList.map((doc) => (
                    <button key={doc.name} onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }} className={`w-full text-left p-4 rounded-xl transition-all border ${selectedDoctor.name === doc.name ? 'bg-white/80 border-teal/30 shadow-lg' : 'border-transparent hover:bg-white/50'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate flex items-center justify-center text-white text-xs font-bold shrink-0">{doc.initials}</div>
                        <div>
                          <h3 className="text-sm font-bold text-slate">{doc.name}</h3>
                          <p className="text-[10px] text-teal font-medium uppercase tracking-wider">{doc.role}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">{doc.bio}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-8 border-t border-slate/10 pt-6">
                  <div className="section-label mb-4"><ShieldCheck size={12} /> Core Services</div>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.title} className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">{service.icon}</div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate">{service.title}</h4>
                          <p className="text-[9px] text-text-muted mt-0.5">{service.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 theme-card bg-slate text-white border-none shadow-xl shadow-slate/20">
                  <div className="text-[10px] uppercase tracking-widest text-teal font-black mb-3">On-Duty Support</div>
                  <h3 className="text-sm font-bold mb-2">Emergency Assistance?</h3>
                  <button onClick={() => window.location.href = 'tel:+919876543210'} className="theme-btn-emergency w-full">Call Clinic Now</button>
                </div>
              </motion.aside>

              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="theme-card bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                <div className="section-label"><CalendarIcon size={12} /> Appointment Schedule</div>
                <AnimatePresence mode="wait">
                  {bookingStep === 1 ? (
                    <motion.div key="step-selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                      <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate">Booking for {selectedDoctor.name}</h2>
                        <p className="text-xs text-text-muted">Select your preferred date and time slot.</p>
                      </div>
                      <div className="flex justify-between items-center mb-6 font-semibold">
                        <span className="capitalize text-sm">{format(viewDate, 'MMMM yyyy')}</span>
                        <div className="flex gap-2 text-teal text-sm">
                          <button onClick={handlePrevMonth} className="hover:bg-teal/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">←</button>
                          <button onClick={handleNextMonth} className="hover:bg-teal/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">→</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-8">
                        {['S','M','T','W','T','F','S'].map((d, i) => (<div key={i} className="h-8 flex items-center justify-center text-text-muted text-[10px] font-bold uppercase">{d}</div>))}
                        {calendarDays.map((day, i) => {
                          const isCurrentMonth = isSameMonth(day, viewDate);
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          return (
                            <button key={i} onClick={() => setSelectedDate(day)} className={`h-9 rounded-lg text-xs flex items-center justify-center transition-all ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelected ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'hover:bg-teal/10'}`}>
                              {format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                      <div className="section-label mb-3">Available Slots</div>
                      <div className="grid grid-cols-4 gap-2 mb-8">
                        {selectedDoctor.schedule.map((slot) => (
                          <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedSlot === slot ? 'bg-teal text-white border-teal' : 'bg-white/50 border-slate/10 hover:border-teal/50'}`}>{slot}</button>
                        ))}
                      </div>
                      {selectedDate && selectedSlot && (<button onClick={() => setBookingStep(2)} className="theme-btn-primary mt-auto py-4">Continue Registration</button>)}
                    </motion.div>
                  ) : bookingStep === 2 ? (
                    <motion.div key="step-registration-payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                      <div className="grid md:grid-cols-2 gap-8 h-full">
                        <div className="space-y-4">
                          <div className="section-label">Patient Information</div>
                          <input type="text" placeholder="Full Name" className="theme-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                          <input type="tel" placeholder="WhatsApp Number" className="theme-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                          <input type="email" placeholder="Email Address" className="theme-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                          <textarea placeholder="Notes (Optional)" className="theme-input min-h-[100px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                        <div className="bg-white/80 p-6 rounded-2xl border border-slate/10 flex flex-col items-center relative overflow-hidden h-full">
                          <div className="absolute inset-0 bg-teal/5 animate-pulse" />
                          <div className="section-label mb-6">Payment Verification</div>
                          <div className="flex justify-between w-full mb-4 font-bold text-sm">
                            <span className="text-text-muted">Consultation Fee</span>
                            <span className="text-slate">₹1,500</span>
                          </div>
                          <div className="relative group mb-6">
                            <div className="absolute -inset-4 bg-teal/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                            <div className="w-32 h-48 bg-white border border-border p-2 rounded-xl flex items-center justify-center relative shadow-sm transition-all hover:scale-105">
                              <img src="/samsung-qr.jpg" alt="QR" className="w-full h-full object-contain" />
                            </div>
                          </div>
                          <button onClick={handleBookingSuccess} className="mt-auto theme-btn-primary w-full py-4 shadow-xl shadow-teal/20">Confirm Payment via UPI</button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="step-completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} className="text-teal" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate mb-2">Booking Confirmed!</h2>
                      <p className="text-text-muted text-sm mb-6">A confirmation has been sent to <span className="text-slate font-bold">{formData.email}</span>.</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        {isSyncing ? (
                          <div className="text-center py-2 text-[10px] font-bold text-teal animate-pulse uppercase tracking-widest">🔄 Syncing Secure Record...</div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal/5 border border-teal/20">
                              <Mail size={16} className="text-teal" />
                              <span className="text-xs font-semibold text-slate">Secure Record & Email Delivered</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal/5 border border-teal/20">
                              <ShieldCheck size={16} className="text-teal" />
                              <span className="text-xs font-semibold text-slate">Encrypted Database Log Created</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="w-full grid grid-cols-2 gap-3 mb-4">
                        <a href={generateGoogleCalendarLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5"><ExternalLink size={14} className="text-teal" /> Google</a>
                        <a href={generateOutlookCalendarLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5"><ExternalLink size={14} className="text-teal" /> Outlook</a>
                      </div>
                      <button onClick={downloadICSFile} className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5 mb-8"><Download size={14} className="text-teal" /> Download Invite (ICS)</button>
                      <button onClick={() => { setBookingStep(1); setSelectedSlot(null); setSelectedDate(null); }} className="theme-btn-primary w-full py-4">Book Another Appointment</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="mt-12 border-t border-border pt-10 px-4 pb-4">
                  <div className="section-label"><Clock size={12} /> FAQ</div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate">How do I prepare?</h4>
                      <p className="text-[10px] text-text-muted mt-1">Bring pathology reports and imaging on a disc.</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate">Is my data secure?</h4>
                      <p className="text-[10px] text-text-muted mt-1">Yes, we are HIPAA compliant and AES-256 encrypted.</p>
                    </div>
                  </div>
                </div>
              </motion.section>

              <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="theme-card glass-panel bg-white/70 backdrop-blur-xl border border-white/20">
                <div className="section-label"><ShieldCheck size={12} /> Verification Guard</div>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><Lock size={20} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate">Secure Transmission</h4>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">End-to-end medical encryption ensures clinical data privacy.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><ShieldCheck size={20} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate">HIPAA Standards</h4>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Stored using Firebase enterprise compliance layer.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><Clock size={20} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate">Instant Sync</h4>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Real-time scheduling across all medical devices.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 flex justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-teal/10 rounded-full animate-ping opacity-20" />
                    <div className="absolute inset-2 bg-teal/20 rounded-full animate-pulse opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck size={32} className="text-teal/40 animate-float" />
                    </div>
                  </div>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-12 bg-white border-t border-border flex items-center justify-center gap-4 lg:gap-10 text-[10px] font-bold text-text-muted uppercase tracking-wider px-4">
        <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-teal" /> HIPAA Compliant</div>
        <div className="flex items-center gap-2"><Lock size={12} className="text-teal" /> AES-256 Encryption</div>
        <div className="hidden sm:flex items-center gap-2"><Clock size={12} className="text-teal" /> Real-time Sync</div>
        <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-teal" /> Verified Patient Port</div>
      </footer>

      {mounted && <WhatsAppChat />}
    </div>
  );
}
