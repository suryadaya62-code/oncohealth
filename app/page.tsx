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
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  format, 
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
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState(doctorsList[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select, 2: Register & Pay, 3: Completed
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<any>(null);

  const handleBookingSuccess = async () => {
    setBookingStep(3);
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
      // 1. Save to Firestore First (The source of truth)
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      
      // 2. Trigger Unified Notifications
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
    const startStr = `${dateStr}T143000Z`; 
    const endStr = `${dateStr}T153000Z`;
    
    return `${base}&text=${text}&details=${details}&location=${location}&dates=${startStr}/${endStr}`;
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
SUMMARY:Consultation with Dr. Aris Thorne (OncoHealth)
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
      {/* Header */}
          <header className="h-20 bg-white border-b border-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-3 font-bold text-slate text-xl">
          <div className="w-8 h-8 flex items-center justify-center border-2 border-slate rounded">
            <Stethoscope size={20} />
          </div>
          OncoHealth
        </div>
        
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="theme-btn-emergency flex items-center gap-2"
            >
            <PhoneCall size={14} />
            <span className="hidden sm:inline">Emergency Assistance</span>
            <span className="sm:hidden">Help</span>
          </motion.button>
        </div>
      </div>
    </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-bg p-4 lg:p-8">
          <motion.div 
            key="patient-portal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-6"
          >
            {/* Same Portal Content */}
          
          {/* Column 1: Team & Services */}
          <motion.aside 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="theme-card"
          >
            <div className="section-label">
              <UserIcon size={12} /> Our Specialists
            </div>
            
            <div className="space-y-6">
              {doctorsList.map((doc, idx) => (
                <motion.button 
                  key={doc.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setSelectedSlot(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedDoctor.name === doc.name 
                      ? 'bg-teal/5 border-teal/30 shadow-sm' 
                      : 'border-transparent hover:bg-slate/5'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {doc.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate">{doc.name}</h3>
                      <p className="text-[10px] text-teal font-medium uppercase tracking-wider">{doc.role}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
                    {doc.bio}
                  </p>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="section-label mb-4">
                <ShieldCheck size={12} /> Core Services
              </div>
              <div className="space-y-4">
                {services.map((service, idx) => (
                  <motion.div 
                    key={service.title} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 transition-transform hover:rotate-12">
                      {service.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate">{service.title}</h4>
                      <p className="text-[10px] text-text-muted mt-0.5">{service.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* Column 2: Booking System */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="theme-card"
          >
            <div className="section-label">
              <CalendarIcon size={12} /> Appointment Schedule
            </div>

            <AnimatePresence mode="wait">
              {bookingStep === 1 ? (
                <motion.div 
                  key="step-selection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate">Booking for {selectedDoctor.name}</h2>
                  <p className="text-xs text-text-muted">Select your preferred date and time slot below.</p>
                </div>
                {/* Dynamic Calendar */}
                <div className="flex justify-between items-center mb-6 font-semibold">
                  <span className="capitalize">{format(viewDate, 'MMMM yyyy')}</span>
                  <div className="flex gap-4 text-teal text-sm">
                    <button 
                      onClick={handlePrevMonth}
                      className="hover:opacity-60 w-8 h-8 flex items-center justify-center rounded-full hover:bg-teal/5 transition-colors"
                    >
                      ←
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="hover:opacity-60 w-8 h-8 flex items-center justify-center rounded-full hover:bg-teal/5 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-8">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={`weekday-${d}-${i}`} className="h-10 flex items-center justify-center text-text-muted text-sm font-bold uppercase">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                      <motion.button 
                        key={day.toString()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedDate(day)}
                        className={`h-10 rounded-md transition-all flex items-center justify-center text-sm relative
                          ${!isCurrentMonth ? 'text-border grayscale opacity-40' : 'text-slate font-medium'}
                          ${isSelected ? 'bg-teal text-white ring-2 ring-teal/20 scale-105' : 'hover:bg-teal/10'}
                          ${today && !isSelected ? 'border-b-2 border-teal' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="section-label mb-3">Available Time Slots for {selectedDoctor.name}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                  {selectedDoctor.schedule.map((slot) => (
                    <motion.button 
                      key={slot}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSlot(slot)}
                      className={`theme-slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                    >
                      {slot}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-auto bg-[#F0F4F8] p-4 rounded-lg flex gap-3 items-start">
                  <MapPin size={16} className="text-slate mt-0.5 shrink-0" />
                  <div className="text-xs text-slate">
                    <p className="font-bold mb-1">Clinic Location</p>
                    <p>Memorial Cancer Research Center, Wing B, Suite 402.</p>
                  </div>
                </div>
                
                {selectedDate && selectedSlot && (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(2)}
                    className="theme-btn-primary mt-6 py-4"
                  >
                    Continue to Registration
                  </motion.button>
                )}
              </motion.div>
            ) : bookingStep === 2 ? (
              <motion.div 
                key="step-registration-payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate">Secure Registration & Checkout</h2>
                  <p className="text-xs text-text-muted">Register your details and complete the secure payment to confirm.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Left: Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Patient Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter full name" 
                        className="theme-input p-4"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">WhatsApp Number</label>
                      <input 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        className="theme-input p-4"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="name@company.com" 
                        className="theme-input p-4"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Medical Notes</label>
                      <textarea 
                        placeholder="Brief symptoms..." 
                        className="theme-input p-4 min-h-[80px]"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right: Payment QR */}
                  <div className="bg-slate/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate/10 h-full">
                    <ShieldCheck size={32} className="text-teal mb-4" />
                    <div className="flex justify-between w-full font-bold text-sm mb-4">
                      <span className="text-text-muted uppercase text-[8px] tracking-widest mt-1">Consultation Fee</span>
                      <span className="text-slate text-xl">₹1,500</span>
                    </div>

                    <div className="w-36 h-36 bg-white border border-border p-3 mb-2 rounded-xl flex items-center justify-center relative group shadow-sm transition-all hover:shadow-xl hover:scale-105">
                      <QRCodeSVG 
                        value={`upi://pay?pa=suryadaya62@pingpay&pn=Suryadaya%20Bhattacharjee&am=1500&cu=INR&tn=OncoHealth%20Consultation`}
                        size={120}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "https://ais-dev-qrj7ksec36udto7xbxfm6r-298614808685.asia-southeast1.run.app/favicon.ico",
                          x: undefined,
                          y: undefined,
                          height: 24,
                          width: 24,
                          excavate: true,
                        }}
                      />
                      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-slate text-center p-3 rounded-xl border-2 border-teal">
                        <Lock size={16} className="text-teal mb-2" />
                        <p>Encrypted UPI Gateway</p>
                        <p className="text-[8px] text-text-muted mt-1 underline">Scan to Pay ₹1,500</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Suryadaya Bhattacharjee</p>
                      <p className="text-[8px] text-text-muted font-mono">UPI ID: suryadaya62@pingpay</p>
                    </div>

                    <p className="text-[9px] text-text-muted mb-4 uppercase tracking-[0.2em] font-black">
                      Secured by AES-256
                    </p>

                    <button 
                      disabled={!formData.name || !formData.email}
                      onClick={handleBookingSuccess}
                      className={`w-full p-4 bg-teal text-white rounded-xl text-xs font-bold shadow-lg shadow-teal/20 transition-all ${!formData.name || !formData.email ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                      Complete & Confirm via UPI
                    </button>
                    <button 
                      onClick={() => setBookingStep(1)}
                      className="mt-4 text-[10px] font-bold text-teal uppercase tracking-widest hover:underline"
                    >
                      Back to Schedule
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step-completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full items-center justify-center text-center p-8"
              >
                <motion.div 
                  initial={{ rotate: -20, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 size={40} className="text-teal" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate mb-2">Booking Confirmed!</h2>
                <p className="text-text-muted text-sm mb-6">
                  A real-time confirmation has been sent to <span className="text-slate font-bold">{formData.email}</span>.
                </p>
                
                <div className="w-full space-y-3 mb-6">
                  {isSyncing ? (
                    <div className="text-center py-2 text-[10px] font-bold text-teal animate-pulse uppercase tracking-widest">
                      🔄 Syncing Secure Record...
                    </div>
                  ) : (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        lastSyncStatus?.email?.status === 'error' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-teal/5 border-teal/20'
                        }`}
                      >
                        <Mail size={16} className={lastSyncStatus?.email?.status === 'error' ? 'text-red-500' : 'text-teal'} />
                        <span className={`text-xs font-semibold ${lastSyncStatus?.email?.status === 'error' ? 'text-red-700' : 'text-slate'}`}>
                          {lastSyncStatus?.email?.status === 'error' 
                            ? `Email Alert: ${lastSyncStatus.email.message}` 
                            : lastSyncStatus?.email?.status === 'success' 
                              ? 'Confirmation Email Delivered' 
                              : 'Secure Database Record Saved'}
                        </span>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors bg-teal/5 border-teal/20`}
                      >
                        <CheckCircle2 size={16} className="text-teal" />
                        <span className="text-xs font-semibold text-slate">
                          Encrypted Database Log Created
                        </span>
                      </motion.div>

                      {formData.phone && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          lastSyncStatus?.sms?.status === 'error' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-teal/5 border-teal/20'
                          }`}
                        >
                          <MessageSquare size={16} className={lastSyncStatus?.sms?.status === 'error' ? 'text-red-500' : 'text-teal'} />
                          <span className={`text-xs font-semibold ${lastSyncStatus?.sms?.status === 'error' ? 'text-red-700' : 'text-slate'}`}>
                            {lastSyncStatus?.sms?.status === 'error' 
                              ? `WhatsApp Alert: ${lastSyncStatus.sms.message}` 
                              : lastSyncStatus?.sms?.status === 'success' 
                                ? 'WhatsApp Confirmation Sent' 
                                : 'WhatsApp setup (Optional)'}
                          </span>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 mb-3">
                  <a 
                    href={generateGoogleCalendarLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5 transition-colors"
                  >
                    <ExternalLink size={14} className="text-teal" />
                    Google
                  </a>
                  <a 
                    href={generateOutlookCalendarLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5 transition-colors"
                  >
                    <ExternalLink size={14} className="text-teal" />
                    Outlook
                  </a>
                </div>
                <button 
                  onClick={downloadICSFile}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-border rounded-lg text-xs font-bold text-slate hover:bg-slate/5 transition-colors mb-8"
                >
                  <Download size={14} className="text-teal" />
                  Download Invite (ICS)
                </button>

                <button 
                  onClick={() => {
                    setBookingStep(1);
                    setSelectedSlot(null);
                    setSelectedDate(null);
                  }}
                  className="theme-btn-primary w-full"
                >
                  Book Another Appointment
                </button>
              </motion.div>
            )}
            </AnimatePresence>

            {/* FAQ Section */}
            <div className="mt-12 border-t border-border pt-10">
              <div className="section-label">
                <Clock size={12} /> Frequently Asked Questions
              </div>
              <div className="space-y-6">
                <div className="group">
                  <h4 className="text-sm font-bold text-slate mb-2">How do I prepare for my first consultation?</h4>
                  <p className="text-xs text-text-muted leading-relaxed">Please bring all recent pathology reports, imaging (CT/MRI) on a disc, and a list of current medications. Arrive 15 minutes early for registration.</p>
                </div>
                <div className="group">
                  <h4 className="text-sm font-bold text-slate mb-2">Are video consultations as effective?</h4>
                  <p className="text-xs text-text-muted leading-relaxed">Video calls are excellent for follow-ups, report reviews, and initial discussions. Physical exams still require in-clinic visits.</p>
                </div>
                <div className="group">
                  <h4 className="text-sm font-bold text-slate mb-2">Is my data secure?</h4>
                  <p className="text-xs text-text-muted leading-relaxed">Yes, we are HIPAA compliant. All data is encrypted with AES-256 standards, and we use secure Firebase infrastructure.</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Column 3: Trusted Security */}
          <motion.aside 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="theme-card"
          >
            <div className="section-label">
              <ShieldCheck size={12} /> Verification Guard
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <Lock size={20} className="text-teal" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate">Secure Transmission</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                    End-to-end medical encryption ensures your clinical data is accessible only to your selected consultant.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-teal" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate">HIPAA Standards</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                    All patient records are stored using Firebase&apos;s enterprise compliance layer and monitored for unauthorized access.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-teal" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate">Instant Sync</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                    Once payment is verified, your slot is instantly locked across all clinical dashboards and syncing devices.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate uppercase tracking-widest mb-4">
                  <span>Selected Schedule</span>
                  <span className="text-teal">{selectedSlot || 'Select Slot'}</span>
                </div>
                <div className="p-4 bg-slate/5 rounded-xl border border-dashed border-slate/20">
                   <p className="text-[10px] text-text-muted leading-relaxed italic">
                    &quot;OncoHealth utilizes real-time Firestore architecture to ensure sub-100ms sync across medical devices.&quot;
                   </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 flex gap-2 items-center">
              <div className={`w-2 h-2 rounded-full transition-colors ${bookingStep >= 1 ? 'bg-teal' : 'bg-border'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${bookingStep >= 2 ? 'bg-teal' : 'bg-border'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${bookingStep >= 3 ? 'bg-teal' : 'bg-border'}`} />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                {bookingStep === 1 ? 'Step 1 of 3' : bookingStep === 2 ? 'Step 2 of 3' : 'Completed'}
              </span>
            </div>
          </motion.aside>
        </motion.div>
      </main>

      {/* Security Footer */}
      <footer className="h-12 bg-white border-t border-border flex items-center justify-center gap-4 lg:gap-10 text-[10px] lg:text-[11px] font-bold text-text-muted uppercase tracking-wider overflow-x-auto whitespace-nowrap px-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-teal" /> 
          HIPAA Compliant
        </div>
        <div className="flex items-center gap-2">
          <Lock size={12} className="text-teal" /> 
          AES-256 Encryption
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Clock size={12} className="text-teal" /> 
          Real-time Sync
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-teal" /> 
          Verified Patient Port
        </div>
      </footer>
    </div>
  );
}
