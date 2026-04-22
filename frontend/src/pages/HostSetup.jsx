import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Users, BookOpen, Download, Timer } from 'lucide-react';
import { useEffect } from 'react';
import { socket, API_URL } from '../socket';
import { HARDCODED_QUIZ } from '../data/hardcoded_quiz';
import { AIPO_QUIZ_BEE } from '../data/aipo_quiz_bee';

function HostSetup() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctChoice: 'A' }
  ]);
  const [teamCount, setTeamCount] = useState(2);
  const [timeLimit, setTimeLimit] = useState(60);
  const [quizTitle, setQuizTitle] = useState('');
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = () => {
    try {
      const data = localStorage.getItem('quizLibrary');
      let library = [];
      if (data) {
        library = JSON.parse(data);
      }
      
      // Inject Hardcoded Quiz from the PDF
      if (!library.find(q => q.title === HARDCODED_QUIZ.title)) {
        library.push(HARDCODED_QUIZ);
        localStorage.setItem('quizLibrary', JSON.stringify(library));
      }
      
      // Inject AIPO Quiz Bee
      if (!library.find(q => q.title === AIPO_QUIZ_BEE.title)) {
        library.push(AIPO_QUIZ_BEE);
        localStorage.setItem('quizLibrary', JSON.stringify(library));
      }
      
      setSavedQuizzes(library);
    } catch (e) {
      console.error('Failed to fetch quizzes from localStorage:', e);
    }
  };

  const saveQuiz = () => {
    if (!quizTitle) return alert('Please enter a title for your arena.');
    try {
      const newQuiz = { title: quizTitle, questions, teamCount, timeLimit: parseInt(timeLimit) };
      
      const existingData = localStorage.getItem('quizLibrary');
      let library = [];
      if (existingData) {
        library = JSON.parse(existingData);
        // Update existing quiz by title if it exists
        const existingIndex = library.findIndex(q => q.title === quizTitle);
        if (existingIndex >= 0) {
          library[existingIndex] = newQuiz;
        } else {
          library.push(newQuiz);
        }
      } else {
        library.push(newQuiz);
      }

      localStorage.setItem('quizLibrary', JSON.stringify(library));
      alert('Arena saved successfully to your Local Library!');
      fetchQuizzes();
    } catch (e) {
      console.error('Failed to save quiz to localStorage:', e);
    }
  };

  const loadQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setQuestions(quiz.questions);
    setTeamCount(quiz.teamCount || 2);
    setTimeLimit(quiz.timeLimit || 60);
    setShowLibrary(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctChoice: 'A' }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectChoice = (qIndex, choice) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctChoice = choice;
    setQuestions(newQuestions);
  };

  const createQuiz = () => {
    if (!socket.connected) socket.connect();
    
    socket.emit('create_game', { questions, teamCount, timeLimit: parseInt(timeLimit) });
    socket.once('game_created', ({ roomCode }) => {
      sessionStorage.setItem('roomCode', roomCode);
      sessionStorage.setItem('quizData', JSON.stringify({ questions, teamCount, timeLimit: parseInt(timeLimit) }));
      navigate('/host/lobby');
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8 relative z-10 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-4 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-3xl border-2 border-white/20 shadow-xl">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <h1 className="text-4xl font-heading font-bold flex items-center text-[#ffeb3b] uppercase tracking-wide whitespace-nowrap shrink-0">
            <BookOpen className="mr-3 text-white shrink-0" />
            Arena Setup
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button 
              onClick={() => setShowLibrary(!showLibrary)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl font-bold flex shrink-0 items-center transition-colors whitespace-nowrap"
            >
              <Download size={20} className="mr-2" /> Library ({savedQuizzes.length})
            </button>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center bg-black/20 px-3 md:px-4 py-2 rounded-xl border border-white/10">
                <Users size={20} className="text-[#00d2d3] md:mr-2" />
                <span className="mr-2 font-bold text-white hidden md:inline">Factions:</span>
                <input 
                  type="number" 
                  min="2" 
                  max="10" 
                  value={teamCount} 
                  onChange={(e) => setTeamCount(e.target.value)}
                  className="bg-transparent w-8 md:w-10 text-center font-bold text-[#ffeb3b] outline-none text-xl"
                />
              </div>
              <div className="flex items-center bg-black/20 px-3 md:px-4 py-2 rounded-xl border border-white/10">
                <Timer size={20} className="text-[#e9008c] md:mr-2" />
                <span className="mr-2 font-bold text-white hidden md:inline">Seconds:</span>
                <input 
                  type="number" 
                  min="5" 
                  max="300"
                  step="5"
                  value={timeLimit} 
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="bg-transparent w-10 md:w-12 text-center font-bold text-[#ffeb3b] outline-none text-xl"
                />
              </div>
            </div>
            <button 
              onClick={createQuiz}
              className="flex shrink-0 items-center bg-[#00d2d3] hover:bg-[#00b0b0] text-slate-900 px-6 py-2 rounded-xl font-heading font-bold uppercase tracking-wider transition-colors shadow-lg whitespace-nowrap"
            >
              <Plus size={20} className="mr-2" /> Start Arena
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 border-t border-white/10 pt-4 mt-4">
          <input 
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Arena Name (e.g., Ultimate Trivia)"
            className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ffeb3b] font-bold text-lg placeholder:text-white/40"
          />
          <button 
            onClick={saveQuiz}
            className="bg-[#e9008c] hover:bg-[#c9007a] shadow-lg shadow-[#e9008c]/20 px-6 py-3 rounded-xl font-bold flex items-center transition-all uppercase tracking-wider text-sm"
          >
            <Save size={20} className="mr-2" /> Save Draft
          </button>
        </div>
      </div>

      {showLibrary && (
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-[#00d2d3]/50 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-2xl font-heading font-bold flex items-center text-[#00d2d3] uppercase tracking-wide">
            <Download className="mr-2 text-white" /> Saved Arenas
          </h2>
          {savedQuizzes.length === 0 ? (
            <p className="text-white/50 italic font-medium">No saved arenas yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedQuizzes.map((q, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/10 flex justify-between items-center group hover:border-[#ffeb3b] transition-colors">
                  <div>
                    <h3 className="font-bold text-xl text-white">{q.title}</h3>
                    <p className="text-sm text-white/60 font-medium">{q.questions.length} Questions • {q.teamCount} Factions</p>
                  </div>
                  <button 
                    onClick={() => loadQuiz(q)}
                    className="bg-[#ffeb3b] text-slate-900 hover:bg-yellow-400 px-5 py-2 rounded-xl font-heading font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/20 relative group hover:border-white/40 transition-colors shadow-lg">
            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-6 right-6 text-white/40 hover:text-[#e9008c] opacity-0 group-hover:opacity-100 transition-all hover:rotate-12 hover:scale-110"
            >
              <Trash2 size={24} />
            </button>
            
            <div className="space-y-5">
              <label className="block text-[#00d2d3] font-heading uppercase text-lg font-bold tracking-widest">Question {qIndex + 1}</label>
              <input 
                value={q.text}
                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                placeholder="Enter your question here..."
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-xl outline-none focus:border-[#ffeb3b] placeholder:text-white/30 font-medium"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((choice, oIndex) => (
                  <div key={choice} className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleCorrectChoice(qIndex, choice)}
                      className={`w-12 h-12 rounded-xl font-heading font-bold text-xl transition-all ${
                        q.correctChoice === choice 
                        ? 'bg-[#00d2d3] text-slate-900 shadow-[0_0_15px_rgba(0,210,211,0.5)] scale-110' 
                        : 'bg-black/30 border-2 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {choice}
                    </button>
                    <input 
                      value={q.options[oIndex]}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${choice}`}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 outline-none focus:border-[#00d2d3] placeholder:text-white/30 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-white/30 bg-white/5 p-6 rounded-3xl text-white/50 hover:text-[#ffeb3b] hover:border-[#ffeb3b] hover:bg-white/10 transition-all flex items-center justify-center space-x-3 text-2xl font-heading font-bold uppercase tracking-widest"
        >
          <Plus size={28} /> <span>Add Question</span>
        </button>
      </div>
    </div>
  );
}

export default HostSetup;
