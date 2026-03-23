import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Play, UserCheck } from 'lucide-react';
import { socket } from '../socket';

function HostLobby() {
  const navigate = useNavigate();
  const roomCode = sessionStorage.getItem('roomCode');
  const [participants, setParticipants] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const joinUrl = `${window.location.origin}/join/${roomCode}`;

  useEffect(() => {
    if (!socket.connected) {
      navigate('/host');
      return;
    }

    // Request room info to get teamCount
    socket.emit('request_game_data', { roomCode, isHost: true });

    socket.on('participant_joined', (newParticipants) => {
      setParticipants(newParticipants);
    });

    socket.on('room_info', ({ totalQuestions: tq, teamCount: tc }) => {
      console.log('Room info received in lobby:', { tq, tc });
      if (tc) setTeamCount(tc);
    });

    socket.on('game_started', ({ totalQuestions: tq, teamCount: tc }) => {
       if (tc) setTeamCount(tc);
    });

    const handleConnect = () => {
      console.log('Socket reconnected in lobby, forcing sync...');
      socket.emit('request_game_data', { roomCode, isHost: true });
    };
    socket.on('connect', handleConnect);

    return () => {
      socket.off('participant_joined');
      socket.off('room_info');
      socket.off('game_started');
      socket.off('connect', handleConnect);
    };
  }, [navigate]);

  const startGame = () => {
    socket.emit('start_game', { roomCode });
    navigate(`/host/quiz/${roomCode}`);
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-theme-pink/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-theme-cyan/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Left side: QR and Info */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 z-10 border-r border-white/10">
        <div className="backdrop-blur-xl bg-white/5 p-12 rounded-[3rem] border border-white/10 flex flex-col items-center space-y-8 shadow-2xl w-full max-w-lg">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-heading font-bold text-theme-yellow uppercase tracking-tight">Join the Quiz!</h1>
            <p className="text-white/70 font-body text-lg">Scan QR or go to <span className="text-theme-cyan font-bold underline">{window.location.origin}/join</span></p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 duration-300">
            <QRCodeSVG value={joinUrl} size={240} level="H" />
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-theme-cyan/80 uppercase tracking-[0.3em] font-bold text-sm">Room Code</p>
            <p className="text-7xl font-heading font-black text-white tracking-tighter drop-shadow-lg">{roomCode}</p>
          </div>
          
          <button 
            onClick={startGame}
            disabled={participants.length === 0}
            className="w-full flex items-center justify-center space-x-3 bg-theme-pink hover:bg-pink-500 disabled:bg-white/10 disabled:text-white/30 px-8 py-5 rounded-2xl font-heading font-bold text-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_8px_30px_rgba(255,42,133,0.3)] disabled:shadow-none"
          >
            <Play size={28} /> <span>Start Game</span>
          </button>
        </div>
      </div>

      {/* Right side: Participants */}
      <div className="w-1/2 p-12 z-10 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shrink-0 window-glass">
          <h2 className="text-3xl font-heading font-bold flex items-center uppercase tracking-wide">
            <UserCheck className="mr-4 text-theme-cyan" size={36} /> 
            Participants <span className="ml-4 bg-theme-yellow text-blue-900 px-4 py-1 rounded-full text-2xl">{participants.length}</span>
          </h2>
        </div>
        
        <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
          {Array.from({ length: teamCount }, (_, i) => i + 1).map(teamId => (
            <div key={teamId} className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
              <h3 className="text-xl font-heading font-bold text-theme-cyan uppercase tracking-widest flex items-center">
                <span className={`w-4 h-4 rounded-full mr-3 shadow-[0_0_10px_currentColor] ${
                  teamId % 4 === 1 ? 'bg-theme-pink text-theme-pink' : 
                  teamId % 4 === 2 ? 'bg-theme-cyan text-theme-cyan' : 
                  teamId % 4 === 3 ? 'bg-theme-yellow text-theme-yellow' : 'bg-green-400 text-green-400'
                }`}></span>
                Team {teamId}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {participants.filter(p => parseInt(p.teamId) === teamId).map((p) => (
                  <div key={p.id} className="bg-white/10 p-4 rounded-2xl border border-white/5 flex items-center space-x-4 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-theme-cyan to-blue-600 rounded-full flex items-center justify-center font-heading font-bold text-2xl text-white shadow-lg">
                      {p.name[0].toUpperCase()}
                    </div>
                    <p className="font-bold font-body text-lg truncate">{p.name}</p>
                  </div>
                ))}
                
                {participants.filter(p => parseInt(p.teamId) === teamId).length === 0 && (
                  <div className="col-span-2 py-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 italic font-body">
                    Waiting for players...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HostLobby;
