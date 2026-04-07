
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isActive: boolean;
  isMuted: boolean;
  onComplete: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const IntroVideo: React.FC<Props> = ({ isActive, isMuted, onComplete }) => {
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    // YouTube IFrame API-ni yükləyirik
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else {
      setIsApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (isApiReady && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: 'yUiBNDa0Q_4',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          mute: 1, // Start muted to bypass browser autoplay restrictions, then unmute
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            event.target.setPlaybackQuality('hd720');
            if (isActive && playerRef.current) {
              if (isMuted) {
                playerRef.current.mute();
                playerRef.current.playVideo();
              } else {
                playerRef.current.playVideo();
                setTimeout(() => {
                  if (playerRef.current && playerRef.current.unMute) {
                    playerRef.current.unMute();
                    playerRef.current.setVolume(100);
                  }
                }, 150);
              }
            }
          },
          onStateChange: (event: any) => {
            // Video bitdikdə (State 0 - Ended)
            if (event.data === 0) {
              onComplete();
            }
          }
        }
      });
    }
  }, [isApiReady, onComplete]);

  useEffect(() => {
    if (isActive && isPlayerReady && playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      
      if (isMuted) {
        playerRef.current.mute();
      } else {
        setTimeout(() => {
          if (playerRef.current && playerRef.current.unMute) {
            playerRef.current.unMute();
            playerRef.current.setVolume(100);
          }
        }, 150);
      }
    } else if (!isActive && isPlayerReady && playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, [isActive, isPlayerReady]); // Only run when isActive or isPlayerReady changes

  // Handle mute toggle separately
  useEffect(() => {
    if (isActive && isPlayerReady && playerRef.current) {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
      }
    }
  }, [isMuted, isActive, isPlayerReady]);

  return (
    <div className={`fixed inset-0 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${isActive ? 'z-[100] bg-black opacity-100' : 'z-[-1] opacity-0 pointer-events-none'}`}>
      
      {/* YouTube Player Container */}
      <div className="absolute inset-0 w-full h-full pointer-events-none scale-125 md:scale-110 flex items-center justify-center">
        <div id="youtube-player" className="w-full h-full"></div>
      </div>

      {/* Overlays */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-black/20 pointer-events-none z-[110]"></div>

          {/* Skip Button */}
          <button
            onClick={() => {
              if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo();
              }
              onComplete();
            }}
            className="absolute bottom-12 right-8 md:bottom-16 md:right-16 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full border border-white/50 flex items-center gap-3 transition-all duration-300 group z-[999999] font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 pointer-events-auto cursor-pointer"
          >
            KEÇMƏK
            <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">fast_forward</span>
          </button>
        </>
      )}
    </div>
  );
};

export default IntroVideo;
