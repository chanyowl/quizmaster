import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Hash, Grid3X3, ArrowRight } from 'lucide-react';
import { socket } from '../socket';

function ParticipantJoin() {
  const navigate = useNavigate();
  const { roomCode: paramRoomCode } = useParams();
  const [roomCode, setRoomCode] = useState(paramRoomCode || '');
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on('joined_successfully', ({ roomCode, name, teamId }) => {
      sessionStorage.setItem('roomCode', roomCode);
      sessionStorage.setItem('name', name);
      sessionStorage.setItem('teamId', teamId);
      navigate('/quiz');
    });

    socket.on('error', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('joined_successfully');
      socket.off('error');
    };
  }, [navigate]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode || !name) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request failed or was denied by the browser:', err);
    }

    socket.emit('join_game', { roomCode, name, teamId });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-hidden bg-[#0a1b3f] text-white">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-theme-pink/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-theme-cyan/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.1]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-4">
            <span className="text-xs font-heading font-black uppercase tracking-[0.3em] text-theme-cyan">Quiz Arena</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter leading-none italic uppercase drop-shadow-lg text-white">
            READY TO <span className="text-theme-yellow">PLAY?</span>
          </h1>
          <p className="text-white/80 font-body font-medium text-base md:text-lg">Connect and prove your skills</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl space-y-6">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-theme-cyan ml-2 drop-shadow-md">Room Entry</label>
              <div className="group relative transition-all">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-theme-cyan transition-colors" size={24} />
                <input 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="6-DIGIT CODE"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 md:py-5 pl-14 md:pl-16 pr-4 md:pr-6 text-xl md:text-2xl font-heading font-black tracking-[0.2em] outline-none focus:border-theme-cyan focus:ring-4 focus:ring-theme-cyan/20 transition-all uppercase placeholder:text-white/30 text-white shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-theme-pink ml-2 drop-shadow-md">Player Identity</label>
              <div className="group relative transition-all">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-theme-pink transition-colors" size={24} />
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 md:py-5 pl-14 md:pl-16 pr-4 md:pr-6 text-lg md:text-xl font-heading font-bold tracking-widest outline-none focus:border-theme-pink focus:ring-4 focus:ring-theme-pink/20 transition-all placeholder:text-white/30 uppercase text-white shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-theme-yellow ml-2 drop-shadow-md">Choose Your Faction</label>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTeamId(id.toString())}
                    className={`h-12 md:h-14 rounded-xl md:rounded-2xl border flex items-center justify-center font-heading font-black text-xl md:text-2xl transition-all active:scale-90 ${
                      teamId === id.toString() 
                      ? 'bg-theme-yellow border-theme-yellow text-[#0a1b3f] shadow-[0_0_20px_rgba(255,221,0,0.5)] scale-110 z-10 shadow-theme-yellow/50' 
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/50 hover:bg-white/20 hover:text-white hover:scale-105'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500 p-4 rounded-2xl text-white font-bold text-center animate-shake backdrop-blur-md shadow-lg">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-theme-pink hover:bg-pink-500 py-6 rounded-2xl font-heading font-black text-3xl tracking-widest uppercase shadow-[0_8px_30px_rgba(255,42,133,0.4)] transition-all active:scale-95 flex items-center justify-center space-x-4 group overflow-hidden relative text-white"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">ENTER ARENA</span>
              <ArrowRight className="relative z-10 group-hover:translate-x-2 transition-transform" size={32} />
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs font-heading font-bold uppercase tracking-[0.5em] text-white/50">
          Powered by Antigravity
        </p>
      </div>
    </div>
  );
}

export default ParticipantJoin;
