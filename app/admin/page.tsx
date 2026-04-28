'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Pill, 
  FileText, 
  Settings, 
  Trash2, 
  Edit2, 
  Plus, 
  Search,
  Check,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  getDocs,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { format } from 'date-fns';
import Link from 'next/link';

type CollectionType = 'appointments' | 'users' | 'prescriptions' | 'medicalRecords' | 'messages';

export default function AdminPage() {
  const { user, profile, loading: authLoading, logout, login, loginLoading, authError } = useAuth();
  const [activeCollection, setActiveCollection] = useState<CollectionType>('appointments');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const orderByField = activeCollection === 'messages' ? 'timestamp' : 'createdAt';
    const q = query(collection(db, activeCollection), orderBy(orderByField, 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, activeCollection);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, activeCollection]);

  const handleCollectionChange = (coll: CollectionType) => {
    setLoading(true);
    setActiveCollection(coll);
    setEditingId(null);
    setShowAddForm(false);
  };

  // Security Check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-teal/10 text-teal rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            Clinical management gateway. Access restricted to authorized oncology personnel.
          </p>
          
          <div className="space-y-6">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium flex items-start gap-3 text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              onClick={() => login()}
              disabled={loginLoading}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200
                ${loginLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-95'}
              `}
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{loginLoading ? 'Please wait...' : 'Sign in to Admin Dashboard'}</span>
            </button>
            
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Credentials Management</p>
              <p className="text-slate-400 text-[11px] px-6">
                Your registered email address <span className="text-slate-600">suryadaya62@gmail.com</span> is the primary administrator ID.
              </p>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100">
             <Link href="/" className="text-teal font-bold text-sm hover:underline">
               Return to Public Site
             </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            The account <b>{user.email}</b> does not have administrative privileges. 
            If this is an error, please ensure you are using the correct account.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={logout} 
              className="bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Sign Out & Switch Account
            </button>
            <Link href="/" className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all text-center">
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, activeCollection, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${activeCollection}/${id}`);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const { id, ...updateData } = editForm;
      await updateDoc(doc(db, activeCollection, editingId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${activeCollection}/${editingId}`);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isMessage = activeCollection === 'messages';
      await addDoc(collection(db, activeCollection), {
        ...editForm,
        ...(isMessage 
          ? { timestamp: serverTimestamp() } 
          : { createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      });
      setShowAddForm(false);
      setEditForm({});
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, activeCollection);
    }
  };

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Admin Console</h1>
            <p className="text-[10px] text-teal uppercase tracking-widest font-bold">OncoHealth System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'appointments', label: 'Appointments', icon: <Calendar size={18} /> },
            { id: 'users', label: 'Patients (Users)', icon: <Users size={18} /> },
            { id: 'prescriptions', label: 'Prescriptions', icon: <Pill size={18} /> },
            { id: 'medicalRecords', label: 'Medical History', icon: <FileText size={18} /> },
            { id: 'messages', label: 'WhatsApp Messages', icon: <MessageSquare size={18} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleCollectionChange(item.id as CollectionType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${activeCollection === item.id ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {item.icon}
              {item.label}
              {activeCollection === item.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
               {profile?.displayName?.charAt(0) || 'A'}
             </div>
             <div>
               <p className="text-xs font-bold truncate max-w-[100px]">{profile?.displayName || 'Admin'}</p>
               <p className="text-[9px] text-slate-500">Super Administrator</p>
             </div>
          </div>
          <button onClick={logout} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize mb-1">{activeCollection} Management</h2>
            <p className="text-sm text-slate-500">View, edit, and maintain clinical and administrative records.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal/20 outline-none w-full md:w-64"
              />
            </div>
            <button 
              onClick={() => {
                setEditingId(null);
                setEditForm({});
                setShowAddForm(!showAddForm);
              }}
              className="px-4 py-2 bg-teal text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal/20 hover:scale-105 transition-transform"
            >
              <Plus size={16} />
              <span>Add New</span>
            </button>
          </div>
        </header>

        {/* Dynamic Form for Adding/Editing */}
        {(editingId || showAddForm) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">{editingId ? 'Edit' : 'Create New'} {activeCollection.slice(0, -1)}</h3>
              <button 
                onClick={() => { setEditingId(null); setShowAddForm(false); }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingId ? handleUpdate : handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Render dynamic inputs based on collection structure */}
              {activeCollection === 'appointments' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Patient Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.patientName || ''} onChange={(e) => setEditForm({...editForm, patientName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Doctor</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.doctor || ''} onChange={(e) => setEditForm({...editForm, doctor: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.date || ''} onChange={(e) => setEditForm({...editForm, date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none"
                      value={editForm.status || 'pending'} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  {/* ... other fields */}
                </>
              )}

              {activeCollection === 'users' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Display Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.displayName || ''} onChange={(e) => setEditForm({...editForm, displayName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Role</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none"
                      value={editForm.role || 'patient'} onChange={(e) => setEditForm({...editForm, role: e.target.value})}>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}

              {activeCollection === 'prescriptions' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">User UID</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.userId || ''} onChange={(e) => setEditForm({...editForm, userId: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Medication</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.medication || ''} onChange={(e) => setEditForm({...editForm, medication: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Dosage</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.dosage || ''} onChange={(e) => setEditForm({...editForm, dosage: e.target.value})} />
                  </div>
                </>
              )}

              {activeCollection === 'messages' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">To/From User UID</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.receiverId || ''} onChange={(e) => setEditForm({...editForm, receiverId: e.target.value, participants: [user?.uid, e.target.value], senderId: user?.uid})} required placeholder="Enter Patient UID to reply" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Message Content</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal/20 outline-none" 
                      value={editForm.content || ''} onChange={(e) => setEditForm({...editForm, content: e.target.value})} required />
                  </div>
                </>
              )}

              <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => { setEditingId(null); setShowAddForm(false); }}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-teal text-white rounded-xl text-sm font-bold shadow-lg shadow-teal/20 hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID / Name</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date / Created</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status / Role</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-6">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 italic">No records found.</td>
                  </tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-900 mb-0.5">{item.patientName || item.displayName || item.title || item.medication || (item.content ? item.content.slice(0, 30) + '...' : '')}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {item.id.slice(0, 8)}...</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-600">{item.doctor || item.email || item.type || item.dosage || (item.senderId ? `From: ${item.senderId}` : '')}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-600">{item.date || ((item.createdAt || item.timestamp) ? format((item.createdAt || item.timestamp).toDate(), 'MMM dd, yyyy - HH:mm') : 'N/A')}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest
                        ${item.status === 'confirmed' || item.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {item.status || item.role || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <p>Showing {filteredData.length} records</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
