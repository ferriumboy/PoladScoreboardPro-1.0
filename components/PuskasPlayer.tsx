import React, { useState, useEffect, useRef } from 'react';
import { GoalVideo } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface Props {
  videos: GoalVideo[];
  onClose: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const PuskasPlayer: React.FC<Props> = ({ videos, onClose }) => {
  const [rankedVideos, setRankedVideos] = useState<GoalVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const rankVideos = async () => {
      try {
        if (videos.length === 0) {
          setError("Heç bir qol videosu tapılmadı.");
          setIsLoading(false);
          return;
        }

        if (videos.length === 1) {
          setRankedVideos(videos);
          setIsLoading(false);
          return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        
        const videoParts = await Promise.all(videos.map(async (v, index) => {
          if (!v.videoBlob) return null;
          const base64 = await blobToBase64(v.videoBlob);
          return {
            inlineData: {
              data: base64,
              mimeType: v.videoBlob.type || 'video/webm'
            }
          };
        }));

        const validParts = videoParts.filter(p => p !== null);
        
        if (validParts.length === 0) {
          setRankedVideos(videos);
          setIsLoading(false);
          return;
        }

        const prompt = `Burada ${validParts.length} ədəd qol videosu var. Sən bir futbol ekspertisən. Bu qolları vizual olaraq analiz et və ən pisdən ən yaxşıya (Puskas qalibi ən sonda olacaq) doğru sırala.
        
        Videoların sırası:
        ${videos.map((v, i) => `Video ${i + 1}: ${v.scorerName} (${v.homeTeam} vs ${v.awayTeam})`).join('\n')}
        
        Sıralamanı yalnız video indeksləri (1-dən başlayaraq) şəklində ver. Məsələn, əgər 3 video varsa və ən yaxşısı 2-cidirsə, cavab belə olmalıdır: [3, 1, 2] (ən pisdən ən yaxşıya).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...validParts as any[]
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER }
            }
          }
        });

        const ranking = JSON.parse(response.text || '[]');
        
        if (Array.isArray(ranking) && ranking.length === videos.length) {
          const sorted = ranking.map(idx => videos[idx - 1]).filter(Boolean);
          if (sorted.length === videos.length) {
            setRankedVideos(sorted);
          } else {
            setRankedVideos(videos);
          }
        } else {
          setRankedVideos(videos);
        }
      } catch (err) {
        console.error("Error ranking videos:", err);
        // Fallback to original order if AI fails
        setRankedVideos(videos);
      } finally {
        setIsLoading(false);
      }
    };

    rankVideos();
  }, [videos]);

  useEffect(() => {
    if (!isLoading && rankedVideos.length > 0 && videoRef.current) {
      const currentVideo = rankedVideos[currentIndex];
      if (currentVideo.videoBlob) {
        const url = URL.createObjectURL(currentVideo.videoBlob);
        videoRef.current.src = url;
        videoRef.current.play().catch(e => console.error("Video play error:", e));
        
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [currentIndex, isLoading, rankedVideos]);

  const handleVideoEnded = () => {
    if (currentIndex < rankedVideos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (!isLoading && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Anthem play error:", e));
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-white font-headline text-2xl animate-pulse">Gemini 3.0 Flash Qolları Analiz Edir...</h2>
      </div>
    );
  }

  if (error || rankedVideos.length === 0) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center">
        <h2 className="text-white font-headline text-2xl mb-4">{error || "Göstəriləcək qol yoxdur."}</h2>
        <button onClick={onClose} className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Bağla</button>
      </div>
    );
  }

  const currentVideo = rankedVideos[currentIndex];
  const isWinner = currentIndex === rankedVideos.length - 1;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center overflow-hidden">
      <audio ref={audioRef} src="https://archive.org/download/uefa-champions-league-anthem/UEFA%20Champions%20League%20Anthem.mp3" autoPlay loop className="hidden" />
      
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain transition-opacity duration-1000"
          controls={false}
          playsInline
        />
        
        {/* Overlay Info */}
        <div className="absolute bottom-10 left-10 z-10 bg-black/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <div className="text-rose-500 font-black text-4xl mb-2">
            #{rankedVideos.length - currentIndex}
          </div>
          <h2 className="text-white font-headline text-3xl font-bold uppercase">{currentVideo.scorerName}</h2>
          <p className="text-white/70 text-lg">{currentVideo.homeTeam} vs {currentVideo.awayTeam}</p>
          <p className="text-white/50 text-sm">{currentVideo.stageName}</p>
        </div>

        {isWinner && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
              PUSKAS QALİBİ!
            </h1>
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default PuskasPlayer;
