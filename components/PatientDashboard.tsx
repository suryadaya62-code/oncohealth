'use client';

import React, { useState, useEffect } from 'react';
import {
  Pill,
  FileText,
  Calendar,
  ChevronRight,
  Download,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

type Tab = 'appointments' | 'prescriptions' | 'history';

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const path = activeTab === 'history' ? 'medicalRecords' : activeTab === 'prescriptions' ? 'prescriptions' : 'appointments';
    const q = activeTab === 'appointments'
      ? query(collection(db, path), where('email', '==', user.email), orderBy('createdAt', 'desc'))
      : query(collection(db, path), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const handleTabChange = (tab: Tab) => {
    setLoading(true);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {/* Dashboard Sidebar/Header */}
      <div className="flex border-b border-slate-200 bg-white">
        {[
          { id: 'appointments', icon: <Calendar size={18} />, label: 'Appointments' },
          { id: 'prescriptions', icon: <Pill size={18} />, label: 'Prescriptions' },
          { id: 'history', icon: <FileText size={18} />, label: 'History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all
              ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-600/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64 text-slate-400"
            >
              <div className="animate-spin mr-2">🔄</div> Loading records...
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {data.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="mb-4 opacity-20 flex justify-center">
                    {activeTab === 'appointments' && <Calendar size={48} />}
                    {activeTab === 'prescriptions' && <Pill size={48} />}
                    {activeTab === 'history' && <FileText size={48} />}
                  </div>
                  <h3 className="text-slate-800 font-bold">No {activeTab} found</h3>
                  <p className="text-slate-500 text-xs">Your medical data will appear here once updated by our team.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'appointments' && data.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{item.doctor}</h4>
                          <p className="text-xs text-slate-500">{item.date} • {item.slot}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  ))}

                  {activeTab === 'prescriptions' && data.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-600/10 flex items-center justify-center text-teal-600">
                            <Pill size={16} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{item.medication}</h4>
                        </div>
                        <button className="text-teal-600 hover:bg-teal-600/5 p-2 rounded-lg transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Dosage</p>
                          <p className="text-slate-600">{item.dosage}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Frequency</p>
                          <p className="text-slate-600">{item.frequency}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Doctor</p>
                          <p className="text-slate-600">{item.doctorName}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeTab === 'history' && data.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                          <p className="text-xs text-slate-500">{item.type} • {item.date}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Profile Footer */}
      <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{profile?.displayName || 'Patient'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Verified Portal</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-teal-600 flex items-center gap-1 justify-end">
            <Clock size={10} /> Online
          </p>
          <p className="text-[9px] text-slate-400">Memorial Health ID: #ON-98231</p>
        </div>
      </div>
    </div>
  );
}
