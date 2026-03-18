import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function FullScreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err);
    }
  };

  // Only show on host screens explicitly (not participants)
  if (!location.pathname.startsWith('/host')) {
    return null;
  }

  return (
    <button
      onClick={toggleFullScreen}
      className="fixed bottom-4 right-4 z-[100] p-2 bg-transparent hover:bg-white/10 rounded-full text-white/30 hover:text-white/80 transition-all hover:scale-110 active:scale-95 group opacity-40 hover:opacity-100"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  );
}

export default FullScreenButton;
