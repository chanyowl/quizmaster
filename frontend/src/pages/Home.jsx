import { Link } from 'react-router-dom';
import { Play, Users } from 'lucide-react';

function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen space-y-8 p-4 overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00d2d3]/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#e9008c]/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Curved Line Decoration */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#00d2d3" strokeWidth="2" />
        <path d="M0,80 Q30,110 70,80 T100,90" fill="none" stroke="#e9008c" strokeWidth="3" />
      </svg>

      <div className="z-10 text-center space-y-4">
        <h1 className="text-7xl font-heading font-bold text-[#ffeb3b] tracking-tight uppercase drop-shadow-lg leading-none">
          Ateneo IP <br/> Quiz Master
        </h1>
        <p className="text-white text-xl max-w-md mx-auto font-medium tracking-wide">
          IP AND SPORTS: READY, SET, INNOVATE
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10 mt-8">
        <Link 
          to="/host" 
          className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/20 hover:border-[#ffeb3b] transition-all hover:shadow-[0_0_40px_rgba(255,235,59,0.3)] hover:-translate-y-2"
        >
          <div className="w-20 h-20 rounded-full bg-[#ffeb3b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <Play size={40} className="text-[#0a1b3f] ml-2" />
          </div>
          <h2 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">Host Event</h2>
          <p className="text-blue-100 text-center mt-2 font-medium">Create and manage your quiz arena.</p>
        </Link>
        
        <Link 
          to="/join" 
          className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/20 hover:border-[#e9008c] transition-all hover:shadow-[0_0_40px_rgba(233,0,140,0.3)] hover:-translate-y-2"
        >
          <div className="w-20 h-20 rounded-full bg-[#e9008c] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            <Users size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-heading font-bold uppercase tracking-wider text-white">Join Arena</h2>
          <p className="text-blue-100 text-center mt-2 font-medium">Enter your code and start playing.</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
