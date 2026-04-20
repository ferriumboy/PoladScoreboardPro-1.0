import React, { useState, useRef, useEffect } from 'react';

interface Props {
  scorerName: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
  onReRecord?: () => void;
  fullScreen?: boolean;
  initialBlob?: Blob | null;
  reRecordLabel?: string;
}

const VideoRecorderModal: React.FC<Props> = ({ 
  scorerName, 
  onSave, 
  onClose, 
  onReRecord,
  fullScreen = false,
  initialBlob = null,
  reRecordLabel = "Yenidən çək"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(initialBlob);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecordedBlob(initialBlob);
  }, [initialBlob]);

  useEffect(() => {
    let url: string | null = null;
    
    if (recordedBlob && videoRef.current) {
      if (recordedBlob.type === 'application/pdf') return;
      
      const videoElement = videoRef.current;
      videoElement.srcObject = null;
      url = URL.createObjectURL(recordedBlob);
      videoElement.src = url;
      
      // Force reload and play
      videoElement.load();
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Preview play error:", e);
          }
        });
      }
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [recordedBlob]);

  useEffect(() => {
    if (!recordedBlob) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Kamera xətası:", err);
          setError("Kameraya daxil olmaq mümkün olmadı. İcazələri yoxlayın.");
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordedBlob]);

  const startRecording = () => {
    if (!stream) return;
    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
        videoRef.current.play();
      }
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  return (
    <div className={`fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm ${fullScreen ? 'p-0' : 'p-4'}`}>
      <div className={`w-full max-w-md bg-[#131c2a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col ${fullScreen ? 'max-w-none h-full rounded-none' : ''}`}>
        <div className={`p-4 flex justify-between items-center border-b border-white/10 ${fullScreen ? 'absolute top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent' : ''}`}>
          <h3 className="text-white font-headline font-bold text-lg">
            <span className="text-rose-500 mr-2">🎥</span>
            {scorerName} - Qolunu Çək
          </h3>
          {!isRecording && !recordedBlob && (
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        
        <div className={`relative aspect-[9/16] bg-black flex items-center justify-center ${fullScreen ? 'aspect-auto h-full' : ''}`}>
          {error ? (
            <div className="text-rose-400 text-center p-6">{error}</div>
          ) : recordedBlob && recordedBlob.type === 'application/pdf' ? (
            <div className="flex flex-col items-center justify-center text-white p-6">
              <span className="material-symbols-outlined text-6xl text-rose-500 mb-4">picture_as_pdf</span>
              <p className="text-lg font-bold">{(recordedBlob as File).name || 'PDF Faylı'}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              controls={!!recordedBlob && recordedBlob.type !== 'application/pdf'}
              muted={!recordedBlob}
              className="w-full h-full object-cover"
            />
          )}
          
          {isRecording && (
            <div className="absolute top-20 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 bg-rose-600 px-4 py-2 rounded-full shadow-lg">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                <span className="text-white text-sm font-bold tracking-widest uppercase">Qeyd Gedir</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex justify-center items-center bg-[#0d131f] min-h-[120px]">
          {!error && !recordedBlob && !isRecording && (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 hover:scale-105 shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all duration-300"
            >
              <span className="material-symbols-outlined text-white text-4xl">videocam</span>
            </button>
          )}
          
          {isRecording && (
            <button 
              onClick={stopRecording} 
              className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-gray-200 transition-colors"
            >
              Videonun Çəkilişini Tamamla
            </button>
          )}
          
          {recordedBlob && (
            <div className="flex justify-end gap-3 w-full">
              <button
                onClick={() => onSave(recordedBlob)}
                className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20"
              >
                Göndər
              </button>
              <button
                onClick={onReRecord || resetRecording}
                className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors"
              >
                {reRecordLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorderModal;
