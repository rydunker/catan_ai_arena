import React from 'react';
import { Brain, Zap } from 'lucide-react';

const PlayerStats = ({ gameState }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-3">Player Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        {gameState.players.map(player => {
          const Icon = player.strategy === 'sonnet' ? Brain : player.strategy === 'haiku' ? Zap : null;
          return (
            <div
              key={player.id}
              className={`p-4 rounded-lg ${gameState.currentPlayer === player.id ? 'ring-4 ring-blue-400' : ''}`}
              style={{ backgroundColor: player.color + '20', borderLeft: `4px solid ${player.color}` }}
            >
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                {Icon && <Icon size={20} />}
                {player.name}
              </h4>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Points: {player.points}/10</p>
                <p>Settlements: {player.settlements.length}</p>
                <p>Cities: {player.cities.length}</p>
                <p>Roads: {player.roads.length}</p>
                <p className="text-xs text-gray-600">
                  Resources: W:{player.resources.wood} B:{player.resources.brick} S:{player.resources.sheep} Wh:{player.resources.wheat} O:{player.resources.ore}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerStats;