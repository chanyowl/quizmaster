import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HostSetup from './pages/HostSetup';
import HostLobby from './pages/HostLobby';
import HostQuiz from './pages/HostQuiz';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantQuiz from './pages/ParticipantQuiz';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a1b3f] text-white font-body selection:bg-pink-500 selection:text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<HostSetup />} />
          <Route path="/host/lobby" element={<HostLobby />} />
           <Route path="/host/quiz/:roomCode" element={<HostQuiz />} />
          <Route path="/join" element={<ParticipantJoin />} />
          <Route path="/join/:roomCode" element={<ParticipantJoin />} />
          <Route path="/quiz" element={<ParticipantQuiz />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
