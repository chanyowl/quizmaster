import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timer, UserCheck, Trophy } from 'lucide-react';
import { socket } from '../socket';

function HostQuiz() {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timer, setTimer] = useState(60);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [results, setResults] = useState(null);
  
  const timerRef = useRef(null);
  const qIndexRef = useRef(-1); // To track if we've already started this question
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    // Join room just in case
    socket.emit('join_room', { roomCode });

    const syncState = () => {
      console.log('Syncing state for room:', roomCode);
      socket.emit('request_game_data', { roomCode });
    };

    socket.on('room_info', ({ totalQuestions: tq }) => {
      setTotalQuestions(tq);
    });

    socket.on('game_started', ({ question, totalQuestions, currentQuestionIndex }) => {
      console.log('Game started received', currentQuestionIndex);
      if (qIndexRef.current === currentQuestionIndex) return; // Already on this question
      
      qIndexRef.current = currentQuestionIndex;
      setCurrentQuestion(question);
      setTotalQuestions(totalQuestions);
      setQIndex(currentQuestionIndex);
      setTimer(60);
      setAnsweredCount(0);
      startTimer();
    });

    socket.on('next_question', ({ question, index }) => {
      console.log('Next question received:', index);
      if (qIndexRef.current === index) return; // Already on this question

      qIndexRef.current = index;
      setCurrentQuestion(question);
      setQIndex(index);
      setTimer(60);
      setAnsweredCount(0);
      isTransitioningRef.current = false; // Reset lock on new question
      startTimer();
    });

    // Initial sync
    syncState();

    // Persistent sync interval if no question yet
    const syncInterval = setInterval(() => {
      if (qIndexRef.current === -1) {
        syncState();
      }
    }, 2000);

    socket.on('answer_received', ({ totalAnswered, totalParticipants }) => {
      setAnsweredCount(totalAnswered);
      setTotalParticipants(totalParticipants);
    });

    socket.on('quiz_ended', () => {
      setQuizEnded(true);
      clearInterval(timerRef.current);
    });

    socket.on('game_over', (finalResults) => {
      setGameOver(true);
      setResults(finalResults);
      clearInterval(timerRef.current);
    });

    return () => {
      socket.off('game_started');
      socket.off('next_question');
      socket.off('answer_received');
      socket.off('game_over');
      socket.off('room_info');
      socket.off('quiz_ended');
      clearInterval(timerRef.current);
      clearInterval(syncInterval);
    };
  }, [navigate, roomCode]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    isTransitioningRef.current = false;
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Host manually controls flow via "Next Question" button when timer ends.

  const handleNext = () => {
    socket.emit('next_question', { roomCode });
  };

  const revealResults = () => {
    socket.emit('reveal_results', { roomCode });
  };

  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-theme-yellow/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-theme-pink/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="z-10 text-center space-y-8 mb-12">
          <Trophy size={120} className="mx-auto text-theme-yellow drop-shadow-[0_0_30px_rgba(255,221,0,0.5)] animate-bounce" />
          <h1 className="text-7xl font-heading font-black text-white uppercase tracking-tighter drop-shadow-lg">Quiz Over!</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl z-10">
          <div className="backdrop-blur-xl bg-white/10 p-10 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-heading font-bold mb-8 text-theme-cyan uppercase tracking-wider flex items-center">Team Scores</h2>
            <div className="space-y-4 text-left">
              {Object.entries(results.teamScores).sort((a,b) => b[1] - a[1]).map(([teamId, score], idx) => (
                <div key={teamId} className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <span className="font-heading font-bold text-2xl flex items-center">
                    {idx === 0 && <Trophy size={24} className="text-theme-yellow mr-3" />}
                    Team {teamId}
                  </span>
                  <span className="text-4xl font-heading font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{score} <span className="text-xl text-theme-cyan/70 ml-1">pts</span></span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="backdrop-blur-xl bg-white/10 p-10 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-heading font-bold mb-8 text-theme-pink uppercase tracking-wider">Top Participants</h2>
            <div className="space-y-4">
              {results.participants.sort((a,b) => b.score - a.score).slice(0, 5).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                   <div className="flex items-center space-x-4">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-heading font-bold text-xl ${
                      idx === 0 ? 'bg-theme-yellow text-[#0a1b3f] border-none' : 
                      idx === 1 ? 'bg-slate-300 text-[#0a1b3f] border-none' : 
                      idx === 2 ? 'bg-amber-600 text-white border-none' : 'bg-white/10 text-white/50 border border-white/10'
                    }`}>#{idx+1}</span>
                    <span className="font-heading font-bold text-xl">{p.name} <span className="text-sm text-theme-cyan/50 ml-2">(Team {p.teamId})</span></span>
                   </div>
                  <span className="text-3xl font-heading font-black text-theme-cyan">{p.score} <span className="text-sm text-white/50">pts</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="mt-12 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md px-10 py-4 rounded-2xl border border-white/20 font-heading font-bold text-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1b3f] to-blue-900" />
        <div className="z-10 w-24 h-24 border-8 border-theme-cyan/30 border-t-theme-pink rounded-full animate-spin shadow-[0_0_30px_rgba(255,42,133,0.5)]"></div>
        <div className="z-10 text-center space-y-4">
          <h1 className="text-5xl font-heading font-black text-white tracking-widest uppercase">Preparing Quiz...</h1>
          <p className="text-white/70 font-body text-xl">Syncing with server for Room: <span className="text-theme-yellow font-bold text-2xl ml-2">{roomCode}</span></p>
        </div>
      </div>
    );
  }

  if (quizEnded && !gameOver) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-12 relative overflow-hidden text-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1b3f] via-blue-800 to-purple-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />
        
        <Trophy size={140} className="text-theme-yellow drop-shadow-[0_0_50px_rgba(255,221,0,0.6)] animate-pulse z-10" />
        <div className="space-y-6 z-10">
          <h1 className="text-8xl font-heading font-black text-white uppercase tracking-tighter drop-shadow-2xl">All Done!</h1>
          <p className="text-3xl text-theme-cyan font-bold font-body">Ready to see the winners?</p>
        </div>
        <button 
          onClick={revealResults}
          className="z-10 mt-8 bg-theme-yellow hover:bg-yellow-400 text-[#0a1b3f] px-16 py-8 rounded-[3rem] font-heading font-black text-5xl uppercase tracking-tight shadow-[0_12px_30px_rgba(255,221,0,0.4),0_12px_0_rgba(180,130,0,1)] active:shadow-none active:translate-y-[12px] transition-all"
        >
          REVEAL RESULTS 🏆
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-theme-pink/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-theme-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 flex justify-between items-center mb-10">
        <div className={`flex items-center space-x-4 backdrop-blur-xl bg-white/10 px-6 py-4 rounded-3xl border ${timer < 10 ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-white/20'}`}>
          <Timer className={`${timer < 10 ? 'text-red-500 animate-pulse' : 'text-theme-cyan'}`} size={32} />
          <span className={`text-4xl font-heading font-black w-14 text-center ${timer < 10 ? 'text-red-500' : 'text-white'}`}>
            {timer}
          </span>
        </div>
        
        <div className="text-center bg-white/5 backdrop-blur-md px-10 py-4 rounded-3xl border border-white/10 shadow-lg">
          <p className="text-theme-cyan/80 uppercase tracking-[0.3em] font-bold text-sm mb-1">Question {qIndex + 1} of {totalQuestions}</p>
          <p className="text-5xl font-heading font-black text-theme-yellow tracking-widest drop-shadow-lg">{roomCode}</p>
        </div>

        <div className="flex items-center space-x-4 backdrop-blur-xl bg-white/10 px-6 py-4 rounded-3xl border border-white/20">
          <UserCheck className="text-theme-pink" size={32} />
          <span className="text-3xl font-heading font-bold">{answeredCount} <span className="text-white/50 text-xl font-body">/ {totalParticipants || '?'}</span></span>
        </div>
      </div>

      <div className="z-10 flex-1 flex flex-col items-center justify-center space-y-16">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-center leading-tight max-w-6xl drop-shadow-xl text-white">
          {currentQuestion.text}
        </h2>
        
        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
          {['A', 'B', 'C', 'D'].map((choice, idx) => (
            <div 
              key={choice}
              className={`flex items-center p-6 backdrop-blur-xl bg-white/5 border-2 rounded-[2rem] transition-all duration-300 ${
                timer === 0 && currentQuestion.correctChoice === choice ? 'border-theme-yellow bg-theme-yellow/10 scale-[1.03] shadow-[0_0_40px_rgba(255,221,0,0.3)]' : 'border-white/10 hover:bg-white/10 hover:scale-[1.02]'
              } ${timer === 0 && currentQuestion.correctChoice !== choice ? 'opacity-40 grayscale' : ''}`}
            >
              <div className={`w-16 h-16 shrink-0 flex items-center justify-center rounded-[1.25rem] font-heading font-black text-3xl mr-6 shadow-lg ${
                choice === 'A' ? 'bg-theme-pink text-white' : 
                choice === 'B' ? 'bg-theme-cyan text-[#0a1b3f]' : 
                choice === 'C' ? 'bg-theme-yellow text-[#0a1b3f]' : 'bg-green-400 text-[#0a1b3f]'
              }`}>
                {choice}
              </div>
              <span className="text-2xl font-body font-semibold break-words w-full text-white">{currentQuestion.options[idx]}</span>
            </div>
          ))}
        </div>
      </div>
      
      {timer === 0 && (
        <div className="z-10 flex justify-center mt-12 mb-4">
           <button 
            onClick={handleNext}
            className="group flex items-center space-x-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl px-12 py-5 rounded-[2rem] border border-white/30 font-heading font-black text-2xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <span>Next Question</span>
            <div className="w-8 h-8 rounded-full bg-white text-[#0a1b3f] flex items-center justify-center group-hover:translate-x-2 transition-transform">
              &rarr;
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default HostQuiz;
