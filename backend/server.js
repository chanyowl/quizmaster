const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

console.log('Server starting...');

const app = express();
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');
const QUIZ_DIR = path.join(__dirname, 'quizzes');

// Ensure quiz directory exists
if (!fs.existsSync(QUIZ_DIR)) {
  fs.mkdirSync(QUIZ_DIR);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state
const rooms = {};

// Helper to generate a room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// REST API for Quiz Persistence
app.post('/api/quizzes', (req, res) => {
  const { title, questions, teamCount } = req.body;
  if (!title || !questions) {
    return res.status(400).json({ error: 'Title and questions are required' });
  }

  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  const filePath = path.join(QUIZ_DIR, filename);

  const quizData = { title, questions, teamCount };
  fs.writeFile(filePath, JSON.stringify(quizData, null, 2), (err) => {
    if (err) {
      console.error('Error saving quiz:', err);
      return res.status(500).json({ error: 'Failed to save quiz' });
    }
    res.json({ message: 'Quiz saved successfully', filename });
  });
});

app.get('/api/quizzes', (req, res) => {
  fs.readdir(QUIZ_DIR, (err, files) => {
    if (err) {
      console.error('Error reading quizzes:', err);
      return res.status(500).json({ error: 'Failed to list quizzes' });
    }

    const quizzes = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const content = fs.readFileSync(path.join(QUIZ_DIR, f), 'utf8');
          return JSON.parse(content);
        } catch (e) {
          return null;
        }
      })
      .filter(q => q !== null);

    res.json(quizzes);
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Host creates a game
  socket.on('create_game', ({ questions, teamCount }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      hostId: socket.id,
      questions,
      teamCount: parseInt(teamCount),
      participants: [],
      currentQuestionIndex: -1,
      isStarted: false,
      teamScores: {}, // teamId -> score
    };
    
    // Initialize team scores
    for (let i = 1; i <= teamCount; i++) {
      rooms[roomCode].teamScores[i] = 0;
    }

    socket.join(roomCode);
    socket.emit('game_created', { roomCode });
    console.log(`Room created: ${roomCode} with ${teamCount} teams`);
  });

  // Participant joins a game
  socket.on('join_game', ({ roomCode, name, teamId }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.isStarted) {
      socket.emit('error', 'Game already started');
      return;
    }

    const participant = {
      id: socket.id,
      name,
      teamId: parseInt(teamId),
      score: 0,
      hasAnswered: false
    };
    
    room.participants.push(participant);
    socket.join(roomCode);
    
    // Notify host about new participant
    io.to(room.hostId).emit('participant_joined', room.participants);
    
    socket.emit('joined_successfully', { roomCode, name, teamId });
    console.log(`User ${name} joined room ${roomCode} on team ${teamId}`);
  });

  // Join room manually if needed
  socket.on('join_room', ({ roomCode }) => {
    console.log(`Socket ${socket.id} joining room ${roomCode}`);
    socket.join(roomCode);
  });

  // Host starts the game
  socket.on('start_game', ({ roomCode }) => {
    console.log(`Start game requested for room: ${roomCode}`);
    const room = rooms[roomCode];
    if (room) {
      // Re-claim host if necessary
      if (!room.hostId || room.hostId !== socket.id) {
        room.hostId = socket.id;
        socket.join(roomCode);
      }
      
      room.isStarted = true;
      room.currentQuestionIndex = 0;
      room.participants.forEach(p => p.hasAnswered = false);
      
      // We broadcast to everyone, including host
      io.to(roomCode).emit('game_started', {
        question: room.questions[0],
        totalQuestions: room.questions.length,
        currentQuestionIndex: 0,
        roomCode
      });
    }
  });

  // Re-sync game data (to fix race conditions or rejoins)
  socket.on('request_game_data', ({ roomCode, isHost }) => {
    console.log(`Sync requested for room ${roomCode} by ${socket.id}, isHost: ${isHost}`);
    if (!roomCode) {
      console.log('No roomCode provided in sync request');
      return;
    }
    const room = rooms[roomCode];
    if (room) {
      socket.join(roomCode);
      
      // Re-claim host status ONLY if they claim they are the host
      if (isHost && (!room.hostId || room.hostId !== socket.id)) {
        console.log(`Re-claiming host status for ${socket.id} in ${roomCode}`);
        room.hostId = socket.id;
      }

      console.log(`Room status: started=${room.isStarted}, index=${room.currentQuestionIndex}`);
      if (room.isStarted) {
        socket.emit('game_started', {
          question: room.questions[room.currentQuestionIndex],
          totalQuestions: room.questions.length,
          currentQuestionIndex: room.currentQuestionIndex,
          roomCode
        });
        
        const totalAnswered = room.participants.filter(p => p.hasAnswered).length;
        socket.emit('answer_received', {
          totalAnswered,
          totalParticipants: room.participants.length
        });
      } else {
        // Even if not started, send the info we have
        socket.emit('room_info', {
          totalQuestions: room.questions.length,
          teamCount: room.teamCount,
          isStarted: false
        });

        // Push the full participant list back to the host if they reconnected
        if (isHost) {
          socket.emit('participant_joined', room.participants);
        }
      }
    } else {
      console.log(`Room ${roomCode} not found in sync request`);
    }
  });

  // Host moves to next question
  socket.on('next_question', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room) {
      room.currentQuestionIndex++;
      console.log(`Transitioning to question index: ${room.currentQuestionIndex} for room ${roomCode}`);
      room.participants.forEach(p => p.hasAnswered = false);

      if (room.currentQuestionIndex < room.questions.length) {
        console.log(`Sending next_question event for index ${room.currentQuestionIndex}`);
        io.to(roomCode).emit('next_question', {
          question: room.questions[room.currentQuestionIndex],
          index: room.currentQuestionIndex
        });
      } else {
        // Instead of immediate game_over, notify host that quiz is ended
        io.to(room.hostId).emit('quiz_ended');
        // Let participants know it's over but wait for reveal
        io.to(roomCode).emit('waiting_for_results');
      }
    }
  });

  // Host reveals results
  socket.on('reveal_results', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.hostId === socket.id) {
      console.log(`Revealing results for room ${roomCode}`);
      io.to(roomCode).emit('game_over', {
        participants: room.participants,
        teamScores: room.teamScores
      });
    }
  });

  // Participant submits an answer
  socket.on('submit_answer', ({ roomCode, answer }) => {
    const room = rooms[roomCode];
    if (room && room.isStarted) {
      const participant = room.participants.find(p => p.id === socket.id);
      if (participant && !participant.hasAnswered) {
        participant.hasAnswered = true;
        const currentQuestion = room.questions[room.currentQuestionIndex];
        const isCorrect = answer === currentQuestion.correctChoice;
        
        if (isCorrect) {
          participant.score += 10;
          room.teamScores[participant.teamId] = (room.teamScores[participant.teamId] || 0) + 10;
        }
        
        // Notify host that someone answered
        const totalAnswered = room.participants.filter(p => p.hasAnswered).length;
        io.to(room.hostId).emit('answer_received', {
          totalAnswered,
          totalParticipants: room.participants.length
        });

        socket.emit('answer_confirmed', { isCorrect, score: participant.score });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Optional: handle host disconnect or participant leaving
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
