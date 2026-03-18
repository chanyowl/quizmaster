import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const getParticipantFontSize = (text) => {
  if (!text) return "text-xl md:text-2xl";
  const len = text.length;
  if (len < 60) return "text-xl md:text-2xl";
  if (len < 120) return "text-lg md:text-xl";
  return "text-base md:text-lg";
};

function ParticipantQuiz() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('waiting'); // waiting, questioning, answered, over
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    const storedRoomCode = sessionStorage.getItem('roomCode');
    setRoomCode(storedRoomCode);

    if (!socket.connected) {
      navigate('/join');
      return;
    }

    socket.on('game_started', ({ question }) => {
      setCurrentQuestion(question);
      setGameState('questioning');
    });

    socket.on('next_question', ({ question }) => {
      setCurrentQuestion(question);
      setGameState('questioning');
      setIsCorrect(null);
    });

    // Sync on mount
    socket.emit('request_game_data', { roomCode: storedRoomCode });

    socket.on('answer_confirmed', ({ isCorrect, score }) => {
      setIsCorrect(isCorrect);
      setScore(score);
      setGameState('answered');
    });

    socket.on('waiting_for_results', () => {
      setGameState('waiting_results');
    });

    socket.on('game_over', () => {
      setGameState('over');
    });

    return () => {
      socket.off('game_started');
      socket.off('next_question');
      socket.off('answer_confirmed');
      socket.off('game_over');
      socket.off('waiting_for_results');
    };
  }, [navigate]);

  const submitAnswer = (choice) => {
    socket.emit('submit_answer', { roomCode, answer: choice });
  };

  if (gameState === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] space-y-8 p-12 text-center bg-[#0a1b3f] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-theme-cyan/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-theme-pink/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="z-10 w-32 h-32 border-8 border-theme-yellow/30 border-t-theme-yellow rounded-full animate-spin shadow-[0_0_30px_rgba(255,221,0,0.5)]"></div>
        <h1 className="z-10 text-3xl md:text-4xl font-heading font-black uppercase tracking-wider drop-shadow-lg">Waiting for host...</h1>
        <p className="z-10 text-white/70 font-body text-lg md:text-xl">Room: <span className="text-theme-cyan font-bold text-2xl md:text-3xl tracking-widest font-heading ml-2 block mt-2">{roomCode}</span></p>
      </div>
    );
  }

  if (gameState === 'answered') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] space-y-8 p-12 text-center bg-[#0a1b3f] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-theme-cyan/10 backdrop-blur-3xl"></div>
        <div className="z-10 bg-white/10 p-12 rounded-[3rem] border border-white/20 shadow-2xl backdrop-blur-xl">
          <h1 className="text-4xl md:text-6xl font-heading font-black text-theme-cyan drop-shadow-[0_0_20px_rgba(0,245,255,0.5)] mb-4 md:mb-6">ANSWER SENT!</h1>
          <p className="text-white font-body text-xl md:text-2xl font-bold animate-pulse">Wait for the next question...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting_results') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] space-y-10 p-12 text-center bg-[#0a1b3f] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-theme-pink/10 backdrop-blur-3xl"></div>
        <div className="z-10 w-24 h-24 border-8 border-theme-cyan/30 border-t-theme-cyan rounded-full animate-spin shadow-[0_0_30px_rgba(0,245,255,0.5)]"></div>
        <div className="z-10 space-y-4">
          <h1 className="text-5xl font-heading font-black uppercase text-theme-yellow drop-shadow-xl">Quiz Finished!</h1>
          <p className="text-white/90 font-body text-xl">Waiting for Host to reveal final results...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'over') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] space-y-12 p-8 md:p-12 text-center bg-[#0a1b3f] text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-[#0a1b3f] via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />
        
        <div className="z-10 space-y-6">
          <h1 className="text-5xl md:text-7xl font-heading font-black text-theme-yellow drop-shadow-[0_0_40px_rgba(255,221,0,0.6)] animate-pulse">GAME OVER!</h1>
          <div className="bg-white/10 p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-xl inline-block mt-6 md:mt-8">
            <p className="text-xl md:text-2xl font-body text-white/80 mb-2">Final Score</p>
            <p className="text-5xl md:text-6xl font-heading font-black text-theme-cyan">{score}</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="z-10 mt-12 bg-white/10 hover:bg-white/20 px-10 py-5 rounded-2xl border border-white/20 font-heading font-bold text-2xl uppercase tracking-widest transition-all active:scale-95 shadow-xl"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a1b3f] text-white overflow-hidden relative">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-theme-pink/20 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-theme-cyan/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>
      </div>

      {/* Header Info */}
      <div className="relative z-10 px-4 pt-6 pb-4 md:px-6 md:pt-10 md:pb-6 flex justify-between items-end backdrop-blur-md bg-white/5 border-b border-white/10 shrink-0">
        <div>
          <p className="text-theme-cyan text-[11px] font-heading font-black uppercase tracking-[0.2em] mb-1 drop-shadow-md">Room Code</p>
          <h2 className="text-3xl font-heading font-black tracking-widest">{roomCode}</h2>
        </div>
        <div className="text-right">
          <p className="text-theme-pink text-[11px] font-heading font-black uppercase tracking-[0.2em] mb-1 drop-shadow-md">Status</p>
          <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full flex items-center space-x-2 shadow-inner">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping shadow-[0_0_10px_rgba(74,222,128,1)]"></div>
            <span className="text-[11px] font-heading font-bold tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="relative z-10 px-4 py-4 md:px-6 md:py-8 shrink-0">
        <div className="bg-white/10 p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-2 h-full bg-theme-yellow"></div>
          <p className="text-theme-yellow text-xs md:text-sm font-heading font-bold uppercase tracking-widest mb-2 opacity-90 drop-shadow-md">Current Question</p>
          <h1 className={`font-bold font-body leading-snug text-white ${getParticipantFontSize(currentQuestion?.text)}`}>
            {currentQuestion?.text || "Waiting for question..."}
          </h1>
        </div>
      </div>

      {/* Choices Grid */}
      <div className="relative z-10 flex-1 px-4 pb-6 md:px-6 md:pb-12 grid grid-cols-1 gap-3 md:gap-5 overflow-y-auto custom-scrollbar">
        {['A', 'B', 'C', 'D'].map((choice, idx) => (
          <button 
            key={choice}
            onClick={() => submitAnswer(choice)}
            className={`group relative overflow-hidden transition-all duration-200 rounded-3xl flex items-center p-3 md:p-6 text-left shadow-lg border-2 active:scale-95 ${
              choice === 'A' ? 'border-theme-pink bg-theme-pink/10 hover:bg-theme-pink/20 text-white' : 
              choice === 'B' ? 'border-theme-cyan bg-theme-cyan/10 hover:bg-theme-cyan/20 text-white' : 
              choice === 'C' ? 'border-theme-yellow bg-theme-yellow/10 hover:bg-theme-yellow/20 text-white' : 
              'border-green-400 bg-green-400/10 hover:bg-green-400/20 text-white'
            }`}
          >
            {/* Visual Choice Indicator */}
            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-[1rem] flex items-center justify-center text-xl md:text-3xl font-heading font-black mr-4 md:mr-6 shrink-0 group-active:scale-95 transition-transform shadow-md ${
              choice === 'A' ? 'bg-theme-pink text-white' : 
              choice === 'B' ? 'bg-theme-cyan text-[#0a1b3f]' : 
              choice === 'C' ? 'bg-theme-yellow text-[#0a1b3f]' : 'bg-green-400 text-[#0a1b3f]'
            }`}>
              {choice}
            </div>

            {/* Answer Text */}
            <div className="flex-1">
              <span className="text-lg md:text-xl font-body font-bold leading-snug block drop-shadow-sm">
                {currentQuestion?.options[idx] || "..."}
              </span>
            </div>

            {/* Subtle Overlay Effect */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ParticipantQuiz;
