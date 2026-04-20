import React from 'react';

interface Props {
  onClose: () => void;
  onSelect: (type: 'camera' | 'upload') => void;
}

const VideoSelectionModal: React.FC<Props> = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#131c2a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6">
        <h3 className="text-white font-headline font-bold text-xl mb-6 text-center">Video Mənbəyi</h3>
        
        <div className="space-y-4">
          <button 
            onClick={() => onSelect('upload')}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Qol Təkrarını Göndər
          </button>
        </div>
        
        <button onClick={onClose} className="w-full mt-6 text-white/50 hover:text-white transition-colors">
          Bağla
        </button>
      </div>
    </div>
  );
};

export default VideoSelectionModal;
