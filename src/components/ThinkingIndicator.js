import React from 'react';
import { Brain, Zap } from 'lucide-react';

const ThinkingIndicator = ({ isThinking, currentPlayerData }) => {
  if (!isThinking || !currentPlayerData || (currentPlayerData.strategy !== 'sonnet' && currentPlayerData.strategy !== 'haiku')) return null;

  return (
    <div className="text-center mb-4 py-3 bg-purple-100 border-2 border-purple-400 rounded-lg">
      <p className="text-purple-800 font-semibold flex items-center justify-center gap-2">
        {currentPlayerData.strategy === 'sonnet' ? <Brain className="animate-pulse" /> : <Zap className="animate-pulse" />}
        {currentPlayerData.name} is thinking...
      </p>
    </div>
  );
};

export default ThinkingIndicator;