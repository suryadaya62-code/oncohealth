'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Search, 
  Smile, 
  Mic, 
  Phone, 
  Video,
  Check,
  CheckCheck
} from 'lucide-react';
import Image from 'next/image';

// Simulated WhatsApp Web colors
// Background: #EFEAE2
// Sent Bubble: #D9FDD3
// Received Bubble: #FFFFFF
// Header: #F0F2F5
// Subtitles/Icons: #54656F
// Text: #111B21

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  participants: string[];
  content: string;
  timestamp: any;
  read: boolean;
}

export default function WhatsAppChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const receiverId = 'clinic_support_id'; // Placeholder for the clinic

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message)));
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: receiverId,
        participants: [user.uid, receiverId],
        content: messageText,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#EFEAE2] relative overflow-hidden rounded-xl border border-slate-200 font-sans shadow-sm">
      {/* Background Pattern Match */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'url("https://w7.pngwing.com/pngs/351/36/png-transparent-whatsapp-background-pattern-texture-art-design-thumbnail.png")',
          backgroundSize: '400px'
        }}
      />

      {/* WhatsApp Header */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-[#D1D7DB] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center overflow-hidden">
            <Image 
              src="https://ui-avatars.com/api/?name=Oncology+Clinic&background=128C7E&color=fff" 
              alt="Clinic Profile" 
              width={40} height={40} 
            />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[16px] font-medium text-[#111B21] leading-tight mb-0.5">Memorial Clinic Support</h3>
            <p className="text-[13px] text-[#54656F] leading-tight">online</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[#54656F]">
          <Video size={20} className="cursor-pointer hover:text-[#111B21] transition-colors" />
          <Phone size={18} className="cursor-pointer hover:text-[#111B21] transition-colors" />
          <div className="w-[1px] h-6 bg-[#D1D7DB] mx-1"></div>
          <Search size={20} className="cursor-pointer hover:text-[#111B21] transition-colors" />
          <MoreVertical size={20} className="cursor-pointer hover:text-[#111B21] transition-colors" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-[5%] py-4 scrollbar-thin space-y-2 z-10 relative">
        <div className="flex justify-center mb-4">
          <div className="bg-[#FFEECD] text-[#54656F] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm">
            🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="text-[#54656F] text-sm flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin"></span>
              Loading messages...
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.uid;
            // Check if this is the first message in a sequence to add a tail
            const isFirstInSequence = index === 0 || messages[index - 1].senderId !== msg.senderId;

            return (
              <div 
                key={msg.id} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInSequence ? 'mt-2' : 'mt-[2px]'}`}
              >
                <div 
                  className={`
                    relative max-w-[85%] sm:max-w-[70%] px-2.5 pt-1.5 pb-2 rounded-lg text-[#111B21] text-[14.5px] shadow-sm
                    ${isMe ? 'bg-[#D9FDD3]' : 'bg-white'} 
                    ${isFirstInSequence && isMe ? 'rounded-tr-none' : ''}
                    ${isFirstInSequence && !isMe ? 'rounded-tl-none' : ''}
                  `}
                >
                  {/* CSS Tail using pseudo-elements directly via style for ease, or SVG in Tailwind */}
                  {isFirstInSequence && (
                    <svg
                      viewBox="0 0 8 13"
                      width="8"
                      height="13"
                      className={`absolute top-0 ${isMe ? '-right-[8px] text-[#D9FDD3]' : '-left-[8px] text-white -scale-x-100'}`}
                    >
                      <path opacity=".13" fill="#0000000" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                      <path fill="currentColor" d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path>
                    </svg>
                  )}
                  
                  <span className="break-words leading-relaxed">{msg.content}</span>
                  
                  <span className="float-right inline-flex items-center gap-1 mt-1 pl-3 text-[11px] text-[#667781] translate-y-[2px]">
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                    {isMe && (
                      msg.read ? <CheckCheck size={14} className="text-[#53bdeb]" /> : <Check size={14} />
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Input Footer */}
      <form onSubmit={sendMessage} className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-3 z-10 w-full relative">
        <button type="button" className="text-[#54656F] hover:text-[#111B21] transition-colors p-1">
          <Smile size={24} />
        </button>
        <button type="button" className="text-[#54656F] hover:text-[#111B21] transition-colors p-1 mr-1">
          <Paperclip size={24} />
        </button>
        
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-white border-0 rounded-lg px-4 py-[10px] text-[15px] focus:outline-none focus:ring-0 shadow-sm text-[#111B21] placeholder-[#8696a0]"
        />
        
        {newMessage.trim() ? (
          <button type="submit" className="text-[#54656F] hover:text-[#111B21] transition-colors p-1">
            <Send size={24} />
          </button>
        ) : (
          <button type="button" className="text-[#54656F] hover:text-[#111B21] transition-colors p-1">
            <Mic size={24} />
          </button>
        )}
      </form>
    </div>
  );
}
