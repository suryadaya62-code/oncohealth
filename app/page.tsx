'use client';

import React, { useState, useEffect } from 'react';
import { 
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

import Link from 'next/link';
import Image from 'next/image';

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
    description: 'Advanced imaging, lab testing, and personalized risk assessments.'
  },
  {
    icon: <CalendarIcon size={20} className="text-teal" />,
    title: 'Treatment Planning',
    description: 'Evidence-based oncology care and chemotherapy coordination.'
  },
  {
    icon: <ShieldCheck size={20} className="text-teal" />,
    title: 'Patient Support',
    description: 'Nutrition guidance, counseling, and a dedicated team.'
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
  const [bookingStep, setBookingStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setViewDate(new Date());
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
      await addDoc(collection(db, 'appointments'), appointmentData);
      setBookingStep(3);
      
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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
    const text = encodeURIComponent(`OncoHealth: ${selectedDoctor.name}`);
    const dateStr = format(selectedDate, 'yyyyMMdd');
    return `${base}&text=${text}&dates=${dateStr}T143000Z/${dateStr}T153000Z`;
  };

  const downloadICSFile = () => {
    if (!selectedDate || !selectedSlot) return;
    const dateStr = format(selectedDate, 'yyyyMMdd');
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Consultation with ${selectedDoctor.name}\nDTSTART:${dateStr}T143000Z\nDTEND:${dateStr}T153000Z\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appointment.ics';
    link.click();
  };

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const calendarDays = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(viewDate)), 
    end: endOfWeek(endOfMonth(viewDate)) 
  });

  return (
    <div className="flex flex-col min-h-screen selection:bg-teal selection:text-white">
      {/* Premium Header */}
      <header className="h-20 bg-white/70 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 font-bold text-slate text-xl group cursor-pointer" onClick={() => { setActiveMode('booking'); setBookingStep(1); }}>
          <div className="w-9 h-9 flex items-center justify-center border-2 border-teal rounded-xl bg-teal/5 text-teal animate-float shadow-lg shadow-teal/10">
            <Stethoscope size={22} />
          </div>
          <span className="tracking-tight uppercase font-black italic">Onco<span className="text-teal">Health</span></span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Open Now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-8">
          <nav className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setActiveMode('booking')} className={`transition-all hover:text-teal ${activeMode === 'booking' ? 'text-teal border-b-2 border-teal pb-1' : ''}`}>Consultations</button>
            <button onClick={() => setActiveMode('portal')} className={`transition-all hover:text-teal ${activeMode === 'portal' ? 'text-teal border-b-2 border-teal pb-1' : ''}`}>Patient Portal</button>
          </nav>

          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3 bg-slate-50 p-1 pr-3 rounded-full border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-full border border-teal p-0.5 overflow-hidden relative shadow-inner">
                  <Image src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" fill className="rounded-full object-cover" />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-bold text-slate truncate max-w-[80px]">{user.displayName || user.email}</p>
                  <button onClick={logout} className="text-[8px] font-bold text-teal uppercase tracking-widest hover:underline block">Sign Out</button>
                </div>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={login} className="flex items-center gap-2 px-5 py-2 bg-slate text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate/20 transition-all hover:bg-slate-800">
                <LogIn size={14} />
                <span>Login</span>
              </motion.button>
            )}
            

          </div>
        </div>
      </header>

      <main className="flex-1 bg-bg p-4 lg:p-10 relative overflow-hidden">
        {/* High-end Mesh Gradient & Blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-lavender/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] -z-10" />
        
        <AnimatePresence mode="wait">
          {activeMode === 'portal' ? (
            <motion.div key="patient-dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto h-[calc(100vh-220px)] flex flex-col">
              {!user ? (
                <div className="flex-1 theme-card glass-panel flex flex-col items-center justify-center text-center p-12">
                   <div className="w-20 h-20 bg-teal/10 rounded-3xl flex items-center justify-center text-teal mb-8 shadow-inner">
                     <Lock size={40} />
                   </div>
                   <h2 className="text-2xl font-black text-slate mb-4">Secure Access Required</h2>
                   <p className="text-sm text-text-muted max-w-sm mb-10 leading-relaxed">Sign in to your verified patient portal to access clinical records and prescriptions.</p>
                   <button onClick={login} className="theme-btn-primary px-10 py-4 shadow-2xl shadow-slate/30">Access Verified Portal</button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate tracking-tight italic">Welcome, <span className="text-teal">{user.displayName?.split(' ')[0] || 'Patient'}</span></h1>
                        <p className="text-xs text-text-muted mt-1 font-bold uppercase tracking-widest opacity-60">Verified Clinical Records Port</p>
                    </div>
                    <button onClick={() => setActiveMode('booking')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate uppercase tracking-[0.2em] shadow-lg hover:shadow-teal/10 hover:border-teal/30 transition-all"><Plus size={16} className="text-teal" /> New Appointment</button>
                  </div>
                  <div className="flex-1 min-h-0 shadow-2xl rounded-3xl overflow-hidden border border-white/50"><PatientDashboard /></div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="booking-portal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr_340px] gap-8">
              
              {/* Left Sidebar: Specialists */}
              <motion.aside initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="theme-card glass-panel p-8">
                <div className="section-label mb-8"><UserIcon size={14} /> Leading Specialists</div>
                <div className="space-y-3">
                  {doctorsList.map((doc) => (
                    <button key={doc.name} onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }} className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${selectedDoctor.name === doc.name ? 'bg-white border-teal shadow-xl shadow-teal/5' : 'border-transparent hover:bg-white/40'}`}>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl border-2 border-slate-100 overflow-hidden relative shrink-0 shadow-sm">
                          <Image src={doc.image} alt={doc.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate leading-none mb-1">{doc.name}</h3>
                          <p className="text-[9px] text-teal font-black uppercase tracking-widest">{doc.role}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10 pt-10 border-t border-slate-100">
                  <div className="section-label mb-6"><ShieldCheck size={14} /> Core Services</div>
                  <div className="space-y-5">
                    {services.map((service) => (
                      <div key={service.title} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-teal/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">{service.icon}</div>
                        <div>
                          <h4 className="text-xs font-black text-slate leading-none mb-1">{service.title}</h4>
                          <p className="text-[10px] text-text-muted leading-tight opacity-70">{service.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.aside>

              {/* Center: Booking Core */}
              <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="theme-card glass-panel p-10 min-h-[700px] flex flex-col relative overflow-hidden border-teal/10 shadow-2xl">
                {isSyncing && (
                  <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal animate-pulse">Syncing Secure Record...</p>
                  </div>
                )}
                
                <div className="section-label mb-8"><CalendarIcon size={14} /> Clinical Schedule</div>
                
                <AnimatePresence mode="wait">
                  {bookingStep === 1 ? (
                    <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                      <div className="mb-10">
                        <h2 className="text-2xl font-black text-slate italic">Booking for <span className="text-teal underline decoration-teal/20 underline-offset-4">{selectedDoctor.name}</span></h2>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-2 opacity-60">Step 1: Choose your slot</p>
                      </div>

                      <div className="flex justify-between items-center mb-6 px-2">
                        <span className="capitalize font-black text-slate text-sm tracking-tight">{format(viewDate, 'MMMM yyyy')}</span>
                        <div className="flex gap-3">
                          <button onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-teal hover:text-white transition-all shadow-sm">←</button>
                          <button onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-teal hover:text-white transition-all shadow-sm">→</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mb-10">
                        {['S','M','T','W','T','F','S'].map((d, i) => (<div key={i} className="h-10 flex items-center justify-center text-slate-300 text-[10px] font-black uppercase">{d}</div>))}
                        {calendarDays.map((day, i) => {
                          const isCurrentMonth = isSameMonth(day, viewDate);
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          return (
                            <button key={i} onClick={() => setSelectedDate(day)} className={`h-12 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${!isCurrentMonth ? 'opacity-10 grayscale pointer-events-none' : ''} ${isSelected ? 'bg-teal text-white shadow-xl shadow-teal/30 scale-110' : 'hover:bg-teal/10 hover:text-teal'}`}>
                              {format(day, 'd')}
                              {isToday(day) && !isSelected && <div className="w-1 h-1 bg-teal rounded-full" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="section-label mb-5">Available Time Slots</div>
                      <div className="grid grid-cols-4 gap-3 mb-8">
                        {selectedDoctor.schedule.map((slot) => (
                          <button 
                            key={slot} 
                            onClick={() => setSelectedSlot(slot)} 
                            className={`py-4 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest flex items-center justify-center gap-2 ${selectedSlot === slot ? 'bg-teal border-teal text-white shadow-xl shadow-teal/20 scale-105' : 'bg-white/50 border-slate-100 hover:border-teal/30 text-slate-500'}`}
                          >
                            {selectedSlot === slot && <CheckCircle2 size={10} />}
                            {slot}
                          </button>
                        ))}
                      </div>

                      <div className="mt-auto bg-slate-50/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 flex gap-4 items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                          <MapPin size={20} className="text-teal" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate uppercase tracking-widest mb-1">Memorial Research Center</h4>
                          <p className="text-[10px] text-text-muted leading-relaxed opacity-70">Wing B, Suite 402. Memorial Cancer Research Center, Sector V, Salt Lake.</p>
                        </div>
                      </div>

                      {selectedDate && selectedSlot && (
                        <button onClick={() => setBookingStep(2)} className="theme-btn-primary py-5 shadow-2xl shadow-slate/20 mt-auto flex items-center justify-center gap-3">
                          Continue to Registration <Plus size={16} />
                        </button>
                      )}
                    </motion.div>
                  ) : bookingStep === 2 ? (
                    <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                      <div className="grid md:grid-cols-[1fr_260px] gap-10 h-full">
                        <div className="space-y-6">
                          <div className="section-label">Patient Verification</div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input type="text" placeholder="Patient Name" className="theme-input py-5 px-6 bg-white/50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">WhatsApp Port</label>
                            <input type="tel" placeholder="+91" className="theme-input py-5 px-6 bg-white/50" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Secure Email</label>
                            <input type="email" placeholder="name@domain.com" className="theme-input py-5 px-6 bg-white/50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Clinical Notes</label>
                            <textarea placeholder="Briefly describe symptoms..." className="theme-input py-5 px-6 bg-white/50 min-h-[120px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                          </div>
                        </div>

                        <div className="bg-white/90 p-8 rounded-[2rem] border border-slate-100 flex flex-col items-center relative overflow-hidden h-full shadow-2xl">
                          <div className="absolute inset-0 bg-teal/[0.02] animate-pulse pointer-events-none" />
                          <div className="section-label mb-8">Checkout Guard</div>
                          <div className="w-full flex justify-between mb-8 font-black text-xs tracking-tighter">
                            <span className="text-slate/40 uppercase tracking-widest text-[9px] mt-1">Consultation</span>
                            <span className="text-slate text-2xl italic">₹1,500</span>
                          </div>
                          <div className="relative group mb-10">
                            <div className="absolute -inset-8 bg-teal/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                            <div className="w-40 h-56 bg-white border border-slate-100 p-2 rounded-2xl flex items-center justify-center relative shadow-xl transition-all hover:scale-105 hover:rotate-1">
                              <Image src="/samsung-qr.jpg" alt="UPI QR" fill className="object-contain p-2 rounded-xl" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-teal text-white p-1.5 rounded-lg shadow-lg rotate-12">
                              <Lock size={12} />
                            </div>
                          </div>
                          <p className="text-[9px] font-black text-slate/40 uppercase tracking-[0.3em] mb-10">Scan to Verify Payment</p>
                          <button onClick={handleBookingSuccess} className="mt-auto theme-btn-primary w-full py-5 shadow-2xl shadow-teal/20 group relative overflow-hidden">
                            <span className="relative z-10">Confirm via UPI</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                          </button>
                          <button onClick={() => setBookingStep(1)} className="mt-4 text-[9px] font-black text-slate/30 uppercase tracking-widest hover:text-teal transition-colors">Back to Schedule</button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="step-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full items-center justify-center text-center p-10">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 bg-teal/5 rounded-[2.5rem] flex items-center justify-center shadow-inner animate-float">
                          <CheckCircle2 size={48} className="text-teal" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl border-4 border-white overflow-hidden shadow-xl">
                          <Image src={selectedDoctor.image} alt={selectedDoctor.name} fill className="object-cover" />
                        </div>
                      </div>
                      <h2 className="text-4xl font-black text-slate italic tracking-tighter mb-4">Confirmed!</h2>
                      <p className="text-text-muted text-sm font-bold max-w-sm mb-12 leading-relaxed">Your oncology consultation record has been encrypted and synced with <span className="text-teal underline underline-offset-4 decoration-2">{formData.email}</span>.</p>
                      
                      <div className="w-full max-w-md space-y-4 mb-12">
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal/5 border border-teal/10 group hover:bg-teal/10 transition-colors">
                          <Mail size={20} className="text-teal" />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate">Email Record Delivered</p>
                            <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Resend Verified</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal/5 border border-teal/10">
                          <ShieldCheck size={20} className="text-teal" />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate">AES-256 Database Sync</p>
                            <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Firestore Immutable</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-4">
                        <a href={generateGoogleCalendarLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all"><ExternalLink size={14} className="text-teal" /> Google</a>
                        <button onClick={downloadICSFile} className="flex items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all"><Download size={14} className="text-teal" /> Apple/ICS</button>
                      </div>
                      <button onClick={() => { setBookingStep(1); setSelectedSlot(null); setSelectedDate(null); }} className="theme-btn-primary w-full max-w-md py-5 shadow-2xl shadow-slate/20">Book Another Specialist</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Fixed bottom FAQ for trust */}
                <div className="mt-auto pt-10 border-t border-slate-100 px-2">
                  <div className="section-label mb-6"><Clock size={14} /> Knowledge Port</div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[11px] font-black text-slate uppercase tracking-tight mb-2">First Visit?</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed opacity-70">Arrive 15m early with imaging discs and pathology history.</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate uppercase tracking-tight mb-2">Data Policy</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed opacity-70">HIPAA compliant AES-256 encryption across all ports.</p>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Right Sidebar: Security Stats */}
              <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="theme-card glass-panel p-8 flex flex-col">
                <div className="section-label mb-8"><ShieldCheck size={14} /> Trust Architecture</div>
                <div className="space-y-8">
                  <div className="flex gap-5 items-start group">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-teal/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"><Lock size={24} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-black text-slate mb-1">E2E Encryption</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed opacity-70">Clinical records are accessible only to your selected consultant.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start group">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-teal/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"><ShieldCheck size={24} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-black text-slate mb-1">Enterprise Guard</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed opacity-70">Stored using Firebase Enterprise compliance with zero downtime.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start group">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-teal/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform"><Clock size={24} className="text-teal" /></div>
                    <div>
                      <h4 className="text-xs font-black text-slate mb-1">Sub-100ms Sync</h4>
                      <p className="text-[10px] text-text-muted leading-relaxed opacity-70">Instant scheduling across all clinic dashboards and medical ports.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col items-center">
                  <div className="grid grid-cols-2 gap-4 w-full mb-10">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-xl font-black text-slate tracking-tighter">15k+</p>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Patients</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-xl font-black text-teal tracking-tighter">98%</p>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Success</p>
                    </div>
                  </div>
                   <div className="relative w-32 h-32 mb-6">
                    <div className="absolute inset-0 bg-teal/10 rounded-full animate-ping opacity-20" />
                    <div className="absolute inset-4 bg-teal/10 rounded-full animate-pulse opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck size={40} className="text-teal/40 animate-float" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate uppercase tracking-[0.3em] mb-1">Verified Port</p>
                    <p className="text-[9px] text-text-muted font-bold">Active Shield: AES-256</p>
                  </div>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-16 bg-white border-t border-slate-100 flex items-center justify-center gap-10 text-[9px] font-black text-slate/30 uppercase tracking-[0.2em] px-6 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-teal/40" /> HIPAA Compliant</div>
        <div className="flex items-center gap-2"><Lock size={14} className="text-teal/40" /> AES-256 Encryption</div>
        <div className="flex items-center gap-2"><Clock size={14} className="text-teal/40" /> Real-time Sync</div>
        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal/40" /> Verified Portal</div>
      </footer>


    </div>
  );
}
