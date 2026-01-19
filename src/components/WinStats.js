import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { BOT_STRATEGIES } from '../utils/constants';

const WinStats = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-3">Win Statistics</h3>
      {Object.keys(stats).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([strategy, wins]) => {
            const Icon = strategy === 'sonnet' ? Brain : strategy === 'haiku' ? Zap : null;
            return (
              <div key={strategy} className="flex justify-between items-center">
                <span className="font-semibold flex items-center gap-2">
                  {Icon && <Icon size={16} />}
                  {BOT_STRATEGIES[strategy].name}
                </span>
                <span className="px-3 py-1 bg-blue-100 rounded-full font-bold">{wins}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No games completed yet</p>
      )}
    </div>
  );
};

export default WinStats;