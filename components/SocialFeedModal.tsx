import React, { useState, useEffect, useRef } from 'react';
import { SocialPost, SocialComment } from '../types';
import { GoogleGenAI } from '@google/genai';
import DirectMessageModal from './DirectMessageModal';

interface Props {
  onClose: () => void;
  posts: SocialPost[];
  onOpenDM: (handle: string, author: string, avatar: string) => void;
  // DM Props
  activeDM: string | null;
  dmConversations: { [handle: string]: any };
  onSendMessage: (handle: string, text: string) => void;
  onCall: (handle: string) => Promise<{ status: string; message?: string }>;
  onSelectConversation: (handle: string) => void;
  onDeleteMessage: (handle: string, msgId: string) => void;
  onDeleteConversation: (handle: string) => void;
}

interface CommentInputProps {
  postId: string;
  isGenerating: boolean;
  onPost: (text: string) => void;
  placeholder?: string;
  replyToHandle?: string;
  onCancelReply?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ postId, isGenerating, onPost, placeholder = "Add a comment...", replyToHandle, onCancelReply }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text || text.trim() === '' || isGenerating) return;
    onPost(text);
    setText('');
  };

  return (
    <div className="flex flex-col w-full gap-2">
      {replyToHandle && (
        <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded text-[10px] text-[#b1c6fc]">
          <span>Replying to {replyToHandle}</span>
          <button onClick={onCancelReply} className="material-symbols-outlined text-xs">close</button>
        </div>
      )}
      <div className="flex items-center gap-3 w-full">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img alt="User profile avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJQpLGsGR-pJBK5_4_p8OMiJkJkuKbiwn-IN8Upm3PZebmlxffd6fsnAmWQsbkrJ6q__RXICxkgUA2NlVK6ASiu4F8D-SBFaupDQc93d5rQrRR2s37cqGVxlfDdyxWVOXWNnecHxVRQlY85oWIG2jYAqnS4XEUfWp93ghF7glMKDqr-TcBx-SzDghdl_cYWwSgh1fHSAfaOyGXBApsksRbFgZDk8JXhz-wmVUtaAlSihj48FdumjYqfjfPueCQ8UVfcNB2fSa89oU"/>
        </div>
        <div className="flex-grow relative">
          <input 
            className="w-full bg-transparent border-none focus:ring-0 text-sm text-[#dae3f6] placeholder-[#c5c6d0]/50 px-0" 
            placeholder={placeholder} 
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!text || text.trim() === '' || isGenerating}
          className="text-[#b1c6fc] text-xs font-bold disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  );
};

const SocialFeedModal: React.FC<Props> = ({ 
  onClose, 
  posts, 
  onOpenDM,
  activeDM,
  dmConversations,
  onSendMessage,
  onCall,
  onSelectConversation,
  onDeleteMessage,
  onDeleteConversation
}) => {
  const [localPosts, setLocalPosts] = useState<SocialPost[]>(posts);
  const [isGeneratingReply, setIsGeneratingReply] = useState<{ [postId: string]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<{ [postId: string]: { id: string, handle: string } | null }>({});
  const [activeTab, setActiveTab] = useState<'feed' | 'messages'>('feed');
  const commentsEndRef = useRef<{ [postId: string]: HTMLDivElement | null }>({});

  // Import DirectMessageModal inside the component or at the top
  // For now, let's assume it's available or we'll import it.

  // ... (rest of the logic)

  // Initialize local posts with default comments if empty
  useEffect(() => {
    if (posts.length > 0 && localPosts.length === 0) {
      setLocalPosts(posts);
    }
  }, [posts]);

  const handlePostComment = async (postId: string, text: string) => {
    const replyContext = replyingTo[postId];
    const finalCommentText = replyContext ? `@${replyContext.handle} ${text}` : text;

    const newCommentObj: SocialComment = {
      id: Math.random().toString(36).substr(2, 9),
      author: "Sən",
      handle: "menim_profilim",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJQpLGsGR-pJBK5_4_p8OMiJkJkuKbiwn-IN8Upm3PZebmlxffd6fsnAmWQsbkrJ6q__RXICxkgUA2NlVK6ASiu4F8D-SBFaupDQc93d5rQrRR2s37cqGVxlfDdyxWVOXWNnecHxVRQlY85oWIG2jYAqnS4XEUfWp93ghF7glMKDqr-TcBx-SzDghdl_cYWwSgh1fHSAfaOyGXBApsksRbFgZDk8JXhz-wmVUtaAlSihj48FdumjYqfjfPueCQ8UVfcNB2fSa89oU",
      content: finalCommentText,
      likes: "0"
    };

    setLocalPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...(p.comments || []), newCommentObj] };
      }
      return p;
    }));

    setReplyingTo(prev => ({ ...prev, [postId]: null }));
    setIsGeneratingReply(prev => ({ ...prev, [postId]: true }));

    // Only scroll if we are not replying to a specific person, or if we want to see the new comment
    // But the user requested NOT to jump/scroll automatically in a way that feels like "switching to next game"
    // So we will make the scroll optional or more subtle.
    const shouldScroll = !replyContext; 

    if (shouldScroll) {
      setTimeout(() => {
        commentsEndRef.current[postId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const post = localPosts.find(p => p.id === postId);
      const recentComments = post?.comments.slice(-8).map(c => `${c.handle}: ${c.content}`).join('\n') || '';

      const numReplies = replyContext ? 1 : 2;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Sən İnstagramda aktiv olan futbol azarkeşlərisən. 
        Mövzu: ${post?.matchTitle} (${post?.matchScore}).
        
        Mövcud söhbət:
        ${recentComments}
        
        İstifadəçi "menim_profilim" bu şərhi yazdı: "${finalCommentText}".
        ${replyContext ? `Bu şərh xüsusi olaraq @${replyContext.handle} tərəfindən yazılmış "${post?.comments.find(c => c.id === replyContext.id)?.content}" şərhinə cavabdır. Sən @${replyContext.handle} olaraq bu söhbəti davam etdirməlisən.` : ''}
        
        Sən bu şərhə ${numReplies} fərqli, çox qısa (maksimum 10 söz), emosional, zarafatcıl və ya reaksiyalı cavab yaz. 
        ${replyContext ? `Mütləq istifadəçiyə (@menim_profilim) xitab et və onunla deyiş (mübahisə, zarafat və ya dəstək).` : `Hər cavab mütləq istifadəçiyə (@menim_profilim) xitab etsin.`}
        Azərbaycanca yaz. Cavabı yalnız JSON formatında, ${numReplies} string-dən ibarət array kimi qaytar. 
        Məsələn: ["@menim_profilim sən nə danışırsan? Oyun elə deyildi!", "@menim_profilim buna bax hələ, sən get futbol öyrən 😂"]`,
        config: {
          responseMimeType: "application/json",
        }
      });

      let replies: string[] = replyContext ? ["@menim_profilim Razıyam!"] : ["@menim_profilim Razıyam!", "@menim_profilim Düz deyirsən."];
      try {
        const parsed = JSON.parse(response.text || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          replies = parsed.slice(0, numReplies);
        }
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
      
      const aiComments = replies.map((replyText, index) => ({
        id: Math.random().toString(36).substr(2, 9) + index,
        author: replyContext ? replyContext.author : `Fan ${Math.floor(Math.random() * 1000)}`,
        handle: replyContext ? replyContext.handle : "futbol_delisi_" + Math.floor(Math.random() * 1000),
        avatar: replyContext ? replyContext.avatar : "https://lh3.googleusercontent.com/aida-public/AB6AXuDgyOY8R4YddvO0RAAoaNcydm4rAEKr37Tska0tHqxgxlWDeqV1JUXrV6t7AKmdfwesIu-JBOfw5ezAmKMePhkYWrPh9IzHrVbahfkicn6H-cAcLJcRH4YEODCFcXlhObQRqwIPnngbtavivAhNZbY5Ek6OMx0a5Mly-kxSYkepfWl7DVBj6-nAlT-VEkAjBV8nNNeDeOwevFP9lLHsOVMILCV10EM5dG-Fa6h_O0HqYQ0u27tcH33zPsNaugkzigiZ1ErCKuMJ4Bw",
        content: replyText,
        likes: Math.floor(Math.random() * 50).toString()
      }));

      setLocalPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...(p.comments || []), ...aiComments] };
        }
        return p;
      }));

      // Removed automatic scroll after AI reply to prevent jumping as per user request

    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReply(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    setLocalPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const currentLikes = parseInt(c.likes) || 0;
              return { ...c, likes: (currentLikes + 1).toString() };
            }
            return c;
          })
        };
      }
      return p;
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-300 overflow-hidden font-['Inter']">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center p-[2px]">
            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">sports_soccer</span>
            </div>
          </div>
          <span className="text-xl font-black italic tracking-tighter text-white font-['Manrope']">ARENA</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-white">favorite</button>
          <button onClick={() => setActiveTab('messages')} className="material-symbols-outlined text-white">chat_bubble</button>
          <button onClick={onClose} className="material-symbols-outlined text-white bg-red-500/20 hover:bg-red-500/40 rounded-full p-1 transition-all">close</button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'feed' ? (
          <div className="w-full max-w-[600px] mx-auto flex flex-col gap-8 py-10 px-4">
            {localPosts.length === 0 ? (
              <div className="bg-black border border-[#44464f]/20 rounded-lg p-8 text-center text-[#dae3f6]">
                Hələ heç bir paylaşım yoxdur.
              </div>
            ) : (
              localPosts.map(post => {
                const [homeName, awayName] = (post.matchTitle || '').split(' vs ');
                const homeAbbr = homeName ? homeName.substring(0, 3).toUpperCase() : 'HOM';
                const awayAbbr = awayName ? awayName.substring(0, 3).toUpperCase() : 'AWA';
                const [homeScore, awayScore] = (post.matchScore || '').split(' - ');

                return (
                  <main key={post.id} className="w-full bg-black border border-[#44464f]/20 rounded-lg overflow-hidden shadow-2xl font-['Inter'] text-[#dae3f6]">
                    {/* Post Header */}
                    <header className="flex items-center justify-between p-3 border-b border-[#44464f]/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#61ff97]">
                          <img alt="CL Arena Logo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJQpLGsGR-pJBK5_4_p8OMiJkJkuKbiwn-IN8Upm3PZebmlxffd6fsnAmWQsbkrJ6q__RXICxkgUA2NlVK6ASiu4F8D-SBFaupDQc93d5rQrRR2s37cqGVxlfDdyxWVOXWNnecHxVRQlY85oWIG2jYAqnS4XEUfWp93ghF7glMKDqr-TcBx-SzDghdl_cYWwSgh1fHSAfaOyGXBApsksRbFgZDk8JXhz-wmVUtaAlSihj48FdumjYqfjfPueCQ8UVfcNB2fSa89oU"/>
                        </div>
                        <div>
                          <span className="text-sm font-bold font-['Manrope'] tracking-tight text-[#dae3f6]">cl_arena</span>
                          <span className="block text-[10px] text-[#c5c6d0]/60 uppercase font-bold tracking-widest leading-none">Official</span>
                        </div>
                      </div>
                      <button className="material-symbols-outlined text-[#c5c6d0]">more_horiz</button>
                    </header>

                    {/* Main Visual: Match Result Card */}
                    <section className="aspect-square relative flex flex-col items-center justify-center p-8 overflow-hidden" style={{ background: 'radial-gradient(circle at center, #1f477b 0%, #050e1c 100%)' }}>
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <img alt="stadium background" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt8yXicC3ujgZ7qRAood9NBckYGjbiHRUVxVsApbJJPwi3aEen-SoNDZtYa81yj-1cWlbi5tkK-qqk5GjgoaBmOAt_wXyl02QyWeEgfihyDLZJPLrpdgEVeL5ygK8CncfOTW1kmngYxEuNsWsjlp2mckHmFe_1A-Ce7IXvvf7G6h_cXZJQmn2k9UlXhkg6Cp4CaLTl_Brvk23SR2u4roiNwb8Y52umYMayv19VSpZMJzO1dY0_-whLLQsqqKCQF47xM1KxcoVIESU"/>
                      </div>
                      <div className="relative z-10 w-full flex flex-col items-center gap-8">
                        <div className="text-center">
                          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#b1c6fc] mb-2 block">Matchday Result</span>
                          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase font-['Manrope']">Champions League</h2>
                        </div>
                        <div className="flex items-center justify-around w-full">
                          <div className="text-center flex flex-col items-center gap-2">
                            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-[#17202e] flex items-center justify-center shadow-lg border border-[#44464f]/20 overflow-hidden">
                              {post.homeLogo ? <img src={post.homeLogo} alt={homeName} className="w-full h-full object-cover p-2" /> : <span className="text-2xl font-black italic text-[#dae3f6]">{homeAbbr}</span>}
                            </div>
                            <span className="text-xs font-bold text-[#c5c6d0] uppercase">{homeName}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-6xl font-black italic text-white flex items-center gap-4">
                              <span className="drop-shadow-[0_0_15px_rgba(177,198,252,0.5)]">{homeScore}</span>
                              <span className="text-2xl text-[#7085b7]">-</span>
                              <span className="drop-shadow-[0_0_15px_rgba(177,198,252,0.5)] text-[#c5c6d0]/40">{awayScore}</span>
                            </div>
                            <span className="bg-[#36ff8b] text-[#003919] px-2 py-0.5 rounded text-[10px] font-black mt-2">FT</span>
                          </div>
                          <div className="text-center flex flex-col items-center gap-2">
                            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-[#17202e] flex items-center justify-center shadow-lg border border-[#44464f]/20 overflow-hidden">
                              {post.awayLogo ? <img src={post.awayLogo} alt={awayName} className="w-full h-full object-cover p-2" /> : <span className="text-2xl font-black italic text-[#dae3f6]">{awayAbbr}</span>}
                            </div>
                            <span className="text-xs font-bold text-[#c5c6d0] uppercase">{awayName}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#c5c6d0]/80 font-medium">{post.stadium || 'Tofiq Bəhramov Stadionu'}, {post.country || 'Baku'}</p>
                        </div>
                      </div>
                    </section>

                    {/* Post Actions */}
                    <section className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <button className="material-symbols-outlined text-2xl text-[#dae3f6] hover:text-[#ffb4ab] transition-colors">favorite</button>
                          <button className="material-symbols-outlined text-2xl text-[#dae3f6]">chat_bubble</button>
                          <button className="material-symbols-outlined text-2xl text-[#dae3f6] hover:text-[#f5fff2] transition-colors">repeat</button>
                        </div>
                        <button className="material-symbols-outlined text-2xl text-[#dae3f6]">bookmark</button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#dae3f6]">{post.likes ? post.likes.toLocaleString() : '124,562'} likes</p>
                        <p className="text-sm">
                          <span className="font-bold mr-1">cl_arena</span> 
                          {post.matchDetails}
                          <span className="text-[#b1c6fc] ml-1">#UCL #BakuScenes</span>
                        </p>
                      </div>
                    </section>

                    {/* Instagram-style Comments */}
                    <section className="px-3 pb-4 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <button className="text-xs text-[#c5c6d0] font-medium mb-2">View all comments</button>
                      
                      {post.comments?.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div 
                            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              onOpenDM(comment.handle, comment.author, comment.avatar);
                              setActiveTab('messages');
                            }}
                          >
                            <img alt={comment.handle} className="w-full h-full object-cover" src={comment.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCCR1eU8q4tnc84oxD2nh30bCjwh60zUc_fwBtWAPjOv0yCbyFSqunxpSUm3b70kt9dMZpI_UjjvM-m8b5szuSWDRgNGY3mkm34a73KnJDt4lxWccsKmIVTzClrlD49OTC2GDH7o3-Ggf4yHfLLX3ptjL6wj8nVyuIA0L2qdHcPhAL0XJGUSzkdY95XAgnXzTso4kWrvMO5AI3nqfVYs-Y8L9QtuobPzM-D50riYVdUX1qw1Jz9JteFJrNOLYK-lGD4As7RSQue6Uo"}/>
                          </div>
                          <div className="flex-grow">
                            <p className="text-xs">
                              <span 
                                className="font-bold text-[#dae3f6] mr-1 cursor-pointer hover:underline"
                                onClick={() => {
                                  onOpenDM(comment.handle, comment.author, comment.avatar);
                                  setActiveTab('messages');
                                }}
                              >
                                {comment.handle}
                              </span> 
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[#c5c6d0] font-bold">
                              <span>İndi</span>
                              <span>{comment.likes} likes</span>
                              <button 
                                onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: { id: comment.id, handle: comment.handle } }))}
                                className="hover:text-[#dae3f6]"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleLikeComment(post.id, comment.id)}
                            className="material-symbols-outlined text-[14px] text-[#c5c6d0] hover:text-[#ffb4ab] transition-colors"
                          >
                            favorite
                          </button>
                        </div>
                      ))}

                      {isGeneratingReply[post.id] && (
                        <div className="flex gap-3 items-center opacity-70">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#17202e] animate-pulse"></div>
                          <div className="flex-grow">
                            <div className="h-3 bg-[#17202e] rounded w-1/2 animate-pulse"></div>
                          </div>
                        </div>
                      )}
                      <div ref={el => commentsEndRef.current[post.id] = el} />
                    </section>

                    {/* Comment Input Placeholder */}
                    <footer className="p-3 border-t border-[#44464f]/10 flex items-center gap-3">
                      <CommentInput 
                        postId={post.id}
                        isGenerating={isGeneratingReply[post.id]}
                        onPost={(text) => handlePostComment(post.id, text)}
                        replyToHandle={replyingTo[post.id]?.handle}
                        onCancelReply={() => setReplyingTo(prev => ({ ...prev, [post.id]: null }))}
                      />
                    </footer>
                  </main>
                );
              })
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            {activeDM && dmConversations[activeDM] ? (
              <DirectMessageModal 
                conversation={dmConversations[activeDM]}
                conversations={Object.values(dmConversations)}
                onSendMessage={(text) => onSendMessage(activeDM, text)}
                onCall={() => onCall(activeDM)}
                onClose={() => setActiveTab('feed')}
                onSelectConversation={onSelectConversation}
                onDeleteMessage={(msgId) => onDeleteMessage(activeDM, msgId)}
                onDeleteConversation={onDeleteConversation}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 bg-[#050e1c]">
                <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
                <p className="text-lg font-bold">Söhbət seçin</p>
                <p className="text-sm">Mesajlaşmağa başlamaq üçün soldan bir nəfəri seçin.</p>
                
                {/* Fallback list for mobile if activeDM is null */}
                <div className="mt-8 w-full max-w-sm px-6 md:hidden">
                   {Object.values(dmConversations).map((conv: any) => (
                     <div 
                       key={conv.handle}
                       onClick={() => onSelectConversation(conv.handle)}
                       className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl mb-3 cursor-pointer"
                     >
                       <img src={conv.avatar} className="w-12 h-12 rounded-full" alt="" />
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center">
                           <p className="text-white font-bold truncate">{conv.author}</p>
                           <div className="flex flex-col items-end">
                             <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-500 ${
                                   (conv.toxicityLevel || 0) > 70 ? 'bg-red-500' : 
                                   (conv.toxicityLevel || 0) > 40 ? 'bg-orange-500' : 'bg-[#00e476]'
                                 }`}
                                 style={{ width: `${conv.toxicityLevel || 0}%` }}
                               ></div>
                             </div>
                             <span className="text-[7px] font-black uppercase tracking-tighter text-white/30 mt-0.5">Toxicity</span>
                           </div>
                         </div>
                         <p className="text-white/40 text-xs truncate">{conv.messages[conv.messages.length-1]?.text}</p>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="h-16 border-t border-white/10 bg-black flex items-center justify-around px-4">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? 'text-white' : 'text-white/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ev</span>
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'messages' ? 'text-white' : 'text-white/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Mesaj</span>
        </button>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #44464f;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default SocialFeedModal;
