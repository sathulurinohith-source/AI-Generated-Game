import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Terminal, Cpu, Database, AlertTriangle } from 'lucide-react';

type Point = { x: number; y: number };
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: 'SEQ_01: CORRUPTION', artist: 'SYS.ADMIN', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'SEQ_02: DATA_LEAK', artist: 'UNKNOWN_ENTITY', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'SEQ_03: OVERRIDE', artist: 'NULL_PTR', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const randomFoodPosition = (currentSnake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const directionRef = useRef(direction);
  const lastProcessedDirectionRef = useRef(direction);

  useEffect(() => {
    setFood(randomFoodPosition(INITIAL_SNAKE));
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // --- Game Loop ---
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const currentDir = directionRef.current;
        lastProcessedDirectionRef.current = currentDir;

        const newHead = {
          x: head.x + currentDir.x,
          y: head.y + currentDir.y,
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => {
            const newScore = s + 1;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(randomFoodPosition(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver, isPaused, food, highScore]);

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFood(randomFoodPosition(INITIAL_SNAKE));
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) {
          resetGame();
        } else if (!gameStarted) {
          setGameStarted(true);
        } else {
          setIsPaused((p) => !p);
        }
        return;
      }

      if (!gameStarted || isPaused || gameOver) return;

      const currentDir = lastProcessedDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isPaused, gameOver]);

  // --- Music Controls ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="h-screen w-full bg-black text-[#0ff] flex flex-col md:flex-row overflow-hidden relative selection:bg-[#f0f] selection:text-black text-xl md:text-2xl">
      <div className="scanline"></div>

      {/* Left: Main Game Area */}
      <main className="flex-grow flex items-center justify-center relative p-4 md:p-8">
        {/* Game Board - Cleaned up for proper playability */}
        <div
          className={`grid gap-[1px] bg-[#111] p-2 border-4 border-[#0ff] shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-opacity duration-200 ${(!gameStarted || isPaused || gameOver) ? 'opacity-40' : 'opacity-100'}`}
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: 'min(90vw, 75vh)',
            height: 'min(90vw, 75vh)',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`transition-none ${
                  isHead
                    ? 'bg-[#fff] shadow-[0_0_10px_#0ff] z-10'
                    : isSnake
                    ? 'bg-[#0ff]'
                    : isFood
                    ? 'bg-[#f0f] shadow-[0_0_10px_#f0f] animate-[pulse_0.5s_infinite]'
                    : 'bg-transparent'
                }`}
              />
            );
          })}
        </div>
      </main>

      {/* Right: Sidebar Panel */}
      <aside className="w-full md:w-96 flex-none bg-black border-t-4 md:border-t-0 md:border-l-4 border-[#f0f] flex flex-col z-10 m-4 md:m-0 md:my-4 md:mr-4 shadow-[-10px_0_30px_rgba(255,0,255,0.1)]">
        {/* Title */}
        <div className="p-6 border-b-4 border-[#0ff] flex items-center gap-3 bg-[#050505]">
          <Terminal className="w-8 h-8 text-[#0ff]" />
          <h1 className="text-3xl font-bold tracking-widest text-[#fff] glitch-text" data-text="SYS.CORE">
            SYS.CORE
          </h1>
        </div>

        {/* Scores */}
        <div className="p-6 border-b-4 border-[#f0f] flex flex-col gap-6 bg-black">
          <div className="flex flex-col">
            <span className="text-[#f0f] uppercase tracking-widest mb-1 flex items-center gap-2">
              <Database className="w-5 h-5" /> DATA_EXTRACTED
            </span>
            <span className="text-5xl font-bold text-[#0ff]">
              {score.toString().padStart(4, '0')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#0ff] uppercase tracking-widest flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5" /> MAX_CAPACITY
            </span>
            <span className="text-4xl font-bold text-[#f0f]">{highScore.toString().padStart(4, '0')}</span>
          </div>
        </div>

        {/* Game Controls / Status */}
        <div className="p-6 flex-grow flex flex-col justify-center items-center text-center relative overflow-hidden bg-[#050505]">
          <div className="w-full relative z-10">
            {gameOver ? (
              <div className="space-y-6">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="w-16 h-16 text-[#f0f] animate-pulse" />
                </div>
                <h2 className="text-4xl font-bold text-[#fff] glitch-text" data-text="FATAL_ERR">FATAL_ERR</h2>
                <div className="p-4 border-2 border-[#f0f] bg-black">
                  <p className="text-[#0ff] mb-2">FRAGMENTS_LOST</p>
                  <p className="text-4xl font-bold text-[#f0f]">{score}</p>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-[#0ff] text-black font-bold hover:bg-[#f0f] hover:text-[#fff] transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-2xl border-4 border-transparent hover:border-[#0ff] tear-effect"
                >
                  <RefreshCw className="w-6 h-6" /> EXEC_REBOOT
                </button>
              </div>
            ) : !gameStarted ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-[#0ff] glitch-text" data-text="AWAITING_INPUT">AWAITING_INPUT</h2>
                <button
                  onClick={() => setGameStarted(true)}
                  className="w-full py-4 bg-[#f0f] text-black font-bold hover:bg-[#0ff] transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-2xl border-4 border-transparent hover:border-[#f0f] tear-effect"
                >
                  <Play className="w-6 h-6 fill-current" /> INIT_SEQ
                </button>
                <div className="pt-4 text-left text-[#f0f] border-t-2 border-[#0ff] mt-4">
                  <p className="mb-2">&gt; INPUT: W,A,S,D / ARROWS</p>
                  <p>&gt; INTERRUPT: SPACEBAR</p>
                </div>
              </div>
            ) : isPaused ? (
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-[#f0f] glitch-text" data-text="SYS_HALT">SYS_HALT</h2>
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-4 bg-black border-4 border-[#0ff] text-[#0ff] font-bold hover:bg-[#0ff] hover:text-black transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-2xl tear-effect"
                >
                  <Play className="w-6 h-6 fill-current" /> RESUME_SEQ
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-8 bg-black border-2 border-[#0ff] relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-[#0ff] animate-[pulse_1s_infinite] w-full opacity-50"></div>
                </div>
                <p className="text-[#f0f] tracking-widest uppercase font-bold">UPLINK_ESTABLISHED</p>
              </div>
            )}
          </div>
        </div>

        {/* Music Player */}
        <div className="p-6 border-t-4 border-[#0ff] bg-black flex flex-col gap-4">
          {/* Track Info */}
          <div className="flex flex-col gap-1 mb-2">
            <h3 className="font-bold text-[#fff] truncate text-xl uppercase">{currentTrack.title}</h3>
            <p className="text-[#f0f] truncate text-lg uppercase">BY: {currentTrack.artist}</p>
          </div>

          {/* Controls & Volume */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={prevTrack} className="text-[#0ff] hover:text-[#f0f] transition-colors tear-effect">
                <SkipBack className="w-8 h-8 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-[#f0f] text-black flex items-center justify-center hover:bg-[#0ff] transition-colors border-2 border-transparent hover:border-[#f0f] tear-effect"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              <button onClick={nextTrack} className="text-[#0ff] hover:text-[#f0f] transition-colors tear-effect">
                <SkipForward className="w-8 h-8 fill-current" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-grow justify-end">
              <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="text-[#f0f] hover:text-[#0ff] transition-colors tear-effect">
                {volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-2 bg-black border-2 border-[#0ff] appearance-none cursor-pointer accent-[#f0f]"
              />
            </div>
          </div>

          <audio
            ref={audioRef}
            src={currentTrack.url}
            onEnded={nextTrack}
            loop={false}
          />
        </div>
      </aside>
    </div>
  );
}
