
import React, { useState, useRef, useEffect } from 'react';
import { DMConversation, DirectMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  conversation: DMConversation;
  conversations: DMConversation[];
  onSendMessage: (text: string) => void;
  onCall: () => Promise<{ status: string; message?: string }>;
  onClose: () => void;
  onSelectConversation: (handle: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onDeleteConversation: (handle: string) => void;
}

const DirectMessageModal: React.FC<Props> = ({ 
  conversation, 
  conversations, 
  onSendMessage, 
  onCall, 
  onClose, 
  onSelectConversation,
  onDeleteMessage,
  onDeleteConversation
}) => {
  const [inputText, setInputText] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'rejected' | 'busy' | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  useEffect(() => {
    if (callStatus === 'accepted') {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!inputText.trim() || conversation.isBlocked) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    setCallStatus('ringing');
    
    setTimeout(async () => {
      const result = await onCall();
      if (result.status === 'accepted') {
        setCallStatus('accepted');
      } else {
        setCallStatus(result.status as any);
        setTimeout(() => {
          setIsCalling(false);
          setCallStatus(null);
        }, 3000);
      }
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === 'image') {
        onSendMessage(`[IMAGE]${content}`);
      } else if (type === 'video') {
        onSendMessage(`[VIDEO]${content}`);
      } else {
        onSendMessage(`[FILE]${file.name}`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceStart = () => {
    if (conversation.isBlocked) return;
    setIsRecording(true);
  };

  const handleVoiceEnd = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordingTime > 0) {
      onSendMessage(`[VOICE]${recordingTime}s`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex bg-[#0a1421] animate-in fade-in duration-300 font-['Inter']">
      {/* Sidebar - Conversations */}
      <nav className="hidden md:flex flex-col w-80 border-r border-[#17202e] bg-[#0a1421]">
        <div className="p-6 border-b border-[#17202e] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#f5fff2]">Mesajlar</h2>
          <button onClick={onClose} className="material-symbols-outlined text-[#6386be] hover:text-white">close</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv) => (
            <div 
              key={conv.handle}
              onClick={() => onSelectConversation(conv.handle)}
              className={`group px-6 py-4 flex items-center gap-4 cursor-pointer transition-all ${conv.handle === conversation.handle ? 'bg-[#17202e] border-l-4 border-[#00e476]' : 'hover:bg-[#17202e]/50'}`}
            >
              <div className="relative flex-shrink-0">
                <img src={conv.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00e476] rounded-full border-2 border-[#0a1421]"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="text-[#f5fff2] font-bold truncate">{conv.author}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (conv.toxicityLevel || 0) > 70 ? 'bg-red-500' : 
                            (conv.toxicityLevel || 0) > 40 ? 'bg-orange-500' : 'bg-[#00e476]'
                          }`}
                          style={{ width: `${conv.toxicityLevel || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-white/30 mt-0.5">Toxicity</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.handle); }}
                      className="opacity-0 group-hover:opacity-100 material-symbols-outlined text-xs text-red-400 hover:text-red-500"
                    >
                      delete
                    </button>
                  </div>
                </div>
                <p className="text-[#6386be] text-sm truncate">
                  {conv.messages[conv.messages.length - 1]?.text || "Söhbətə başla..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#050e1c]">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#b1c6fc]/5 via-transparent to-[#00e476]/5 pointer-events-none"></div>

        {/* Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-6 bg-[#0a1421]/60 backdrop-blur-xl border-b border-[#17202e] z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="md:hidden material-symbols-outlined text-white">arrow_back</button>
            <div className="relative">
              <img src={conversation.avatar} className="w-10 h-10 rounded-full border-2 border-[#00e476]" alt="" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00e476] rounded-full border-2 border-[#0a1421]"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[#f5fff2] text-lg font-bold leading-tight">{conversation.author}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[#00e476] text-[10px] font-black uppercase tracking-widest">Onlayn</span>
                <span className="text-white/20 text-[10px]">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (conversation.toxicityLevel || 0) > 70 ? 'bg-red-500' : 
                        (conversation.toxicityLevel || 0) > 40 ? 'bg-orange-500' : 'bg-[#00e476]'
                      }`}
                      style={{ width: `${conversation.toxicityLevel || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tighter text-white/40">Toxicity: {conversation.toxicityLevel || 0}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[#6386be]">
            <button onClick={() => startCall('voice')} className="hover:text-[#f5fff2] transition-colors">
              <span className="material-symbols-outlined">call</span>
            </button>
            <button onClick={() => startCall('video')} className="hover:text-[#f5fff2] transition-colors">
              <span className="material-symbols-outlined">videocam</span>
            </button>
            <button className="hover:text-[#f5fff2] transition-colors">
              <span className="material-symbols-outlined">info</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 relative z-10 custom-scrollbar"
        >
          <div className="flex justify-center">
            <span className="px-3 py-1 bg-[#2c3544]/40 backdrop-blur-md rounded-full text-[10px] font-bold text-[#8f909a] tracking-widest uppercase">Bugün</span>
          </div>

          {conversation.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`group flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${msg.senderId === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {msg.senderId !== 'user' && <img src={conversation.avatar} className="w-8 h-8 rounded-full" alt="" />}
              <div className="relative">
                <div className={`px-5 py-3 rounded-2xl shadow-xl border-t border-white/5 ${
                  msg.senderId === 'user' 
                    ? 'bg-gradient-to-tr from-[#b1c6fc] to-[#6386be] text-[#001944] rounded-br-none' 
                    : 'bg-[#212a39] text-[#dae3f6] rounded-bl-none'
                }`}>
                  {msg.text.startsWith('[IMAGE]') ? (
                    <img src={msg.text.replace('[IMAGE]', '')} className="max-w-full rounded-lg" alt="Sent image" referrerPolicy="no-referrer" />
                  ) : msg.text.startsWith('[VIDEO]') ? (
                    <video src={msg.text.replace('[VIDEO]', '')} controls className="max-w-full rounded-lg" />
                  ) : msg.text.startsWith('[VOICE]') ? (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">mic</span>
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-1/2 animate-pulse"></div>
                      </div>
                      <span className="text-xs font-bold">{msg.text.replace('[VOICE]', '')}</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                  <span className={`text-[10px] mt-1 block text-right ${msg.senderId === 'user' ? 'text-[#001944]/70' : 'text-[#8f909a]'}`}>
                    {msg.timestamp}
                  </span>
                </div>
                <button 
                  onClick={() => onDeleteMessage(msg.id)}
                  className={`absolute top-0 ${msg.senderId === 'user' ? '-left-8' : '-right-8'} opacity-50 group-hover:opacity-100 material-symbols-outlined text-xs text-red-400 hover:text-red-500 transition-all`}
                >
                  delete
                </button>
              </div>
            </div>
          ))}

          {conversation.isBlocked && (
            <div className="flex justify-center py-8">
              <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl text-center max-w-xs">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Bloklanıb</p>
                <p className="text-[10px] text-red-400/60">Bu istifadəçi bloklanıb və ya sizi bloklayıb.</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <footer className="p-6 relative z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#212a39]/60 backdrop-blur-2xl rounded-full p-2 border border-white/5 shadow-2xl">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
            
            <button onClick={() => onSendMessage('[Stiker göndərildi]')} className="w-10 h-10 flex items-center justify-center text-[#8f909a] hover:text-[#00e476] transition-colors" title="Stiker göndər">
              <span className="material-symbols-outlined">sentiment_satisfied</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-[#8f909a] hover:text-[#00e476] transition-colors" title="Fayl göndər">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <button onClick={() => imageInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-[#8f909a] hover:text-[#00e476] transition-colors" title="Şəkil göndər">
              <span className="material-symbols-outlined">image</span>
            </button>
            <button onClick={() => videoInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-[#8f909a] hover:text-[#00e476] transition-colors" title="Video göndər">
              <span className="material-symbols-outlined">videocam</span>
            </button>
            
            <div className="flex-1 flex items-center bg-black/20 rounded-full px-4 py-1">
              {isRecording ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-red-400">Yazılır... {formatTime(recordingTime)}</span>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={conversation.isBlocked}
                  placeholder="Mesaj yazın..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[#dae3f6] text-sm placeholder-[#8f909a] px-0"
                />
              )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onMouseDown={handleVoiceStart}
                onMouseUp={handleVoiceEnd}
                onMouseLeave={handleVoiceEnd}
                onTouchStart={handleVoiceStart}
                onTouchEnd={handleVoiceEnd}
                className={`w-10 h-10 flex items-center justify-center transition-colors ${isRecording ? 'text-red-500 scale-125' : 'text-[#8f909a] hover:text-[#00e476]'}`} 
                title="Səs mesajı göndər (Sıxıb saxla)"
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || conversation.isBlocked}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-[#b1c6fc] to-[#6386be] text-[#001944] rounded-full shadow-lg hover:shadow-[#b1c6fc]/20 transition-all active:scale-95 disabled:opacity-30"
              >
                <span className="material-symbols-outlined font-black">send</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Call Screen Overlay */}
        <AnimatePresence>
          {isCalling && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#0a1421] flex flex-col items-center justify-between py-20 px-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-[#00e476] to-[#b1c6fc] mb-8 animate-pulse">
                  <div className="w-full h-full rounded-full border-4 border-[#0a1421] overflow-hidden">
                    <img src={conversation.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-2 uppercase italic">{conversation.author}</h2>
                <p className="text-sm md:text-base font-bold text-[#00e476] tracking-[0.3em] uppercase">
                  {callStatus === 'ringing' ? 'Zəng olunur...' : 
                   callStatus === 'accepted' ? formatTime(callTimer) : 
                   callStatus === 'rejected' ? 'Zəng rədd edildi' : 
                   callStatus === 'busy' ? 'Məşğuldur' : ''}
                </p>
              </div>

              {callStatus === 'accepted' && (
                <div className="flex-1 w-full max-w-md flex flex-col justify-center gap-6">
                   <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full bg-[#00e476] animate-ping"></div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Gemini Live 3.1 Aktivdir</span>
                      </div>
                      <p className="text-sm md:text-base text-white/80 italic leading-relaxed">
                        "Salam! Eşidirəm səni. Futbol haqqında danışaq, yoxsa başqa bir mövzu var? Mən hər şeyə hazıram!"
                      </p>
                   </div>
                </div>
              )}

              <div className="flex items-center gap-8 md:gap-12">
                <button className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">mic_off</span>
                </button>
                <button 
                  onClick={() => {
                    setIsCalling(false);
                    setCallStatus(null);
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full bg-red-500 text-white shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-3xl md:text-4xl">call_end</span>
                </button>
                <button className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">volume_up</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default DirectMessageModal;
