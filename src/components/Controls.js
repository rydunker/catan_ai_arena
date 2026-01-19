import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

const Controls = ({ isPlaying, setIsPlaying, processTurn, initializeGame, gameState, isThinking }) => {
  return (
    <div className="flex gap-4 justify-center mb-6">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        disabled={gameState.winner || isThinking}
      >
        {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Play</>}
      </button>
      <button
        onClick={processTurn}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
        disabled={isPlaying || gameState.winner || isThinking}
      >
        <SkipForward size={20} /> Step
      </button>
      <button
        onClick={initializeGame}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-700"
      >
        <RotateCcw size={20} /> New Game
      </button>
    </div>
  );
};

export default Controls;