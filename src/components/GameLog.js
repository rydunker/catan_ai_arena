import React from 'react';

const GameLog = ({ gameLog }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-3">Game Log</h3>
      <div className="h-96 overflow-y-auto space-y-1 text-sm">
        {gameLog.slice(-25).reverse().map((log, idx) => (
          <p key={idx} className="text-gray-700 border-b border-gray-100 pb-1">{log}</p>
        ))}
      </div>
    </div>
  );
};

export default GameLog;