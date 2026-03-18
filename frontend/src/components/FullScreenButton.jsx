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
      className="fixed bottom-6 right-6 z-[100] p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/20 text-white transition-all hover:scale-110 active:scale-95 group"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
    </button>
  );
}

export default FullScreenButton;
