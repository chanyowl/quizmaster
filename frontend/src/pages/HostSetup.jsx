import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Users, BookOpen, Download } from 'lucide-react';
import { useEffect } from 'react';
import { socket } from '../socket';

function HostSetup() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctChoice: 'A' }
  ]);
  const [teamCount, setTeamCount] = useState(2);
  const [quizTitle, setQuizTitle] = useState('');
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/quizzes');
      const data = await res.json();
      setSavedQuizzes(data);
    } catch (e) {
      console.error('Failed to fetch quizzes:', e);
    }
  };

  const saveQuiz = async () => {
    if (!quizTitle) return alert('Please enter a title for your quiz.');
    try {
      const res = await fetch('http://localhost:3002/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quizTitle, questions, teamCount })
      });
      if (res.ok) {
        alert('Quiz saved successfully!');
        fetchQuizzes();
      }
    } catch (e) {
      console.error('Failed to save quiz:', e);
    }
  };

  const loadQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setQuestions(quiz.questions);
    setTeamCount(quiz.teamCount || 2);
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
    
    socket.emit('create_game', { questions, teamCount });
    socket.once('game_created', ({ roomCode }) => {
      sessionStorage.setItem('roomCode', roomCode);
      sessionStorage.setItem('quizData', JSON.stringify({ questions, teamCount }));
      navigate('/host/lobby');
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-4 bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-white/20 shadow-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-heading font-bold flex items-center text-[#ffeb3b] uppercase tracking-wide">
            <BookOpen className="mr-3 text-white" />
            Arena Setup
          </h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowLibrary(!showLibrary)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl font-bold flex items-center transition-colors"
            >
              <Download size={20} className="mr-2" /> Library ({savedQuizzes.length})
            </button>
            <div className="flex items-center bg-black/20 px-4 py-2 rounded-xl border border-white/10">
              <Users size={20} className="text-[#00d2d3] mr-2" />
              <span className="mr-2 font-bold text-white">Factions:</span>
              <input 
                type="number" 
                min="2" 
                max="10" 
                value={teamCount} 
                onChange={(e) => setTeamCount(e.target.value)}
                className="bg-transparent w-12 text-center font-bold text-[#ffeb3b] outline-none text-xl"
              />
            </div>
            <button 
              onClick={createQuiz}
              className="flex items-center bg-[#00d2d3] hover:bg-[#00b0b0] text-slate-900 px-6 py-2 rounded-xl font-heading font-bold uppercase tracking-wider transition-colors shadow-lg"
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
