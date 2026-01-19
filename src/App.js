import React, { useState, useEffect } from 'react';
import { BOT_STRATEGIES } from './utils/constants';
import { rollDice, getValidSettlementSpots, getValidRoadSpots, canAfford, deductResources } from './utils/gameLogic';
import { callClaudeAPI } from './utils/api';
import Controls from './components/Controls';
import GameBoard from './components/GameBoard';
import PlayerStats from './components/PlayerStats';
import WinStats from './components/WinStats';
import GameLog from './components/GameLog';
import ThinkingIndicator from './components/ThinkingIndicator';

const CatanSimulator = () => {
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [stats, setStats] = useState({});
  const [isThinking, setIsThinking] = useState(false);

  const initializeGame = () => {
    const players = Object.keys(BOT_STRATEGIES).map((strategy, idx) => ({
      id: idx,
      name: BOT_STRATEGIES[strategy].name,
      strategy,
      color: BOT_STRATEGIES[strategy].color,
      resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
      settlements: [],
      cities: [],
      roads: [],
      devCards: [],
      points: 0
    }));

    setGameState({
      players,
      currentPlayer: 0,
      turn: 1,
      phase: 'setup',
      setupRound: 1,
      dice: [0, 0],
      winner: null
    });

    setGameLog(['🎮 Game started! Setup phase begins.']);
    setStats({});
  };

  const makeRuleBasedDecision = (player) => {
    const settlementCost = { wood: 1, brick: 1, sheep: 1, wheat: 1 };
    const cityCost = { wheat: 2, ore: 3 };
    const roadCost = { wood: 1, brick: 1 };

    if (player.strategy === 'greedy') {
      if (canAfford(player, cityCost) && player.settlements.length > 0) {
        return { action: 'city', cost: cityCost, reasoning: 'Greedy: Going for immediate points with city' };
      }
      if (canAfford(player, settlementCost)) {
        return { action: 'settlement', cost: settlementCost, reasoning: 'Greedy: Building settlement for points' };
      }
      if (canAfford(player, roadCost)) {
        return { action: 'road', cost: roadCost, reasoning: 'Greedy: Building road to enable future settlements' };
      }
    } else if (player.strategy === 'balanced') {
      if (canAfford(player, settlementCost) && player.settlements.length < 3) {
        return { action: 'settlement', cost: settlementCost, reasoning: 'Balanced: Expanding settlement base' };
      }
      if (canAfford(player, cityCost) && player.settlements.length > 0) {
        return { action: 'city', cost: cityCost, reasoning: 'Balanced: Upgrading for better production' };
      }
      if (canAfford(player, roadCost)) {
        return { action: 'road', cost: roadCost, reasoning: 'Balanced: Building infrastructure' };
      }
    }

    return { action: 'pass', cost: {}, reasoning: 'Cannot afford any actions' };
  };

  const makeDecision = async (player) => {
    if (player.strategy === 'sonnet' || player.strategy === 'haiku') {
      setIsThinking(true);
      const decision = await callClaudeAPI(player, gameState, player.strategy);
      setIsThinking(false);
      
      const costs = {
        settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
        city: { wheat: 2, ore: 3 },
        road: { wood: 1, brick: 1 }
      };
      
      return {
        action: decision.action,
        cost: costs[decision.action] || {},
        reasoning: decision.reasoning
      };
    } else {
      return makeRuleBasedDecision(player);
    }
  };

  const processTurn = async () => {
    if (!gameState || gameState.winner || isThinking) return;

    const newState = { ...gameState };
    const currentPlayer = newState.players[newState.currentPlayer];

    if (newState.phase === 'setup') {
      if (newState.setupRound <= 2) {
        const validSpots = getValidSettlementSpots(currentPlayer, newState);
        if (validSpots.length > 0) {
          const spot = validSpots[Math.floor(Math.random() * Math.min(5, validSpots.length))];
          currentPlayer.settlements.push(spot);
          currentPlayer.points += 1;

          const roadSpots = getValidRoadSpots(currentPlayer, newState);
          if (roadSpots.length > 0) {
            currentPlayer.roads.push(roadSpots[0]);
          }

          if (newState.setupRound === 2) {
            const resources = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
            const randomResource = resources[Math.floor(Math.random() * resources.length)];
            currentPlayer.resources[randomResource] += 1;
          }

          setGameLog(prev => [...prev, `📍 ${currentPlayer.name} placed settlement at spot ${spot}`]);
        }

        newState.currentPlayer = (newState.currentPlayer + 1) % 4;
        if (newState.currentPlayer === 0) {
          newState.setupRound += 1;
          if (newState.setupRound > 2) {
            newState.phase = 'main';
            setGameLog(prev => [...prev, '🎯 Setup complete! Main game begins.']);
          }
        }
      }
      setGameState(newState);
    } else {
      const dice = rollDice();
      newState.dice = dice;
      const total = dice[0] + dice[1];

      setGameLog(prev => [...prev, `🎲 ${currentPlayer.name} rolled ${total} (${dice[0]}+${dice[1]})`]);

      if (total !== 7) {
        newState.players.forEach(player => {
          player.settlements.forEach(() => {
            if (Math.random() > 0.7) {
              const resources = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
              const resource = resources[Math.floor(Math.random() * resources.length)];
              player.resources[resource] += 1;
            }
          });
          player.cities.forEach(() => {
            if (Math.random() > 0.7) {
              const resources = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
              const resource = resources[Math.floor(Math.random() * resources.length)];
              player.resources[resource] += 2;
            }
          });
        });
      }

      setGameState(newState);

      const decision = await makeDecision(currentPlayer);
      
      const updatedState = { ...newState };
      const updatedPlayer = updatedState.players[updatedState.currentPlayer];

      if (decision.action === 'settlement' && canAfford(updatedPlayer, decision.cost)) {
        const validSpots = getValidSettlementSpots(updatedPlayer, updatedState);
        if (validSpots.length > 0) {
          updatedPlayer.settlements.push(validSpots[0]);
          updatedPlayer.resources = deductResources(updatedPlayer, decision.cost);
          updatedPlayer.points += 1;
          setGameLog(prev => [...prev, `🏘️ ${updatedPlayer.name} built a settlement! ${decision.reasoning}`]);
        }
      } else if (decision.action === 'city' && canAfford(updatedPlayer, decision.cost)) {
        if (updatedPlayer.settlements.length > 0) {
          const settlement = updatedPlayer.settlements.pop();
          updatedPlayer.cities.push(settlement);
          updatedPlayer.resources = deductResources(updatedPlayer, decision.cost);
          updatedPlayer.points += 1;
          setGameLog(prev => [...prev, `🏛️ ${updatedPlayer.name} upgraded to a city! ${decision.reasoning}`]);
        }
      } else if (decision.action === 'road' && canAfford(updatedPlayer, decision.cost)) {
        const validRoads = getValidRoadSpots(updatedPlayer, updatedState);
        if (validRoads.length > 0) {
          updatedPlayer.roads.push(validRoads[0]);
          updatedPlayer.resources = deductResources(updatedPlayer, decision.cost);
          setGameLog(prev => [...prev, `🛤️ ${updatedPlayer.name} built a road. ${decision.reasoning}`]);
        }
      } else if (decision.action === 'pass') {
        setGameLog(prev => [...prev, `⏭️ ${updatedPlayer.name} passed. ${decision.reasoning}`]);
      }

      if (updatedPlayer.points >= 10) {
        updatedState.winner = updatedPlayer;
        setIsPlaying(false);
        setGameLog(prev => [...prev, `🎉 ${updatedPlayer.name} wins with ${updatedPlayer.points} points!`]);
        setStats(prev => ({
          ...prev,
          [updatedPlayer.strategy]: (prev[updatedPlayer.strategy] || 0) + 1
        }));
      }

      updatedState.currentPlayer = (updatedState.currentPlayer + 1) % 4;
      if (updatedState.currentPlayer === 0) {
        updatedState.turn += 1;
      }

      setGameState(updatedState);
    }
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (isPlaying && gameState && !gameState.winner && !isThinking) {
      const timer = setTimeout(processTurn, 800);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, gameState, isThinking]);

  if (!gameState) return <div className="p-8">Loading...</div>;

  const currentPlayerData = gameState.players[gameState.currentPlayer];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Catan AI Arena</h1>
        <p className="text-center text-gray-600 mb-6">Claude Sonnet vs Haiku vs Rule-Based Bots</p>
        
        <Controls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          processTurn={processTurn}
          initializeGame={initializeGame}
          gameState={gameState}
          isThinking={isThinking}
        />

        <ThinkingIndicator
          isThinking={isThinking}
          currentPlayerData={currentPlayerData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Game Board</h2>
              <p className="text-gray-600">Turn {gameState.turn} - {gameState.phase === 'setup' ? `Setup Round ${gameState.setupRound}` : 'Main Game'}</p>
              {gameState.dice[0] > 0 && (
                <p className="text-lg font-semibold mt-2">Last Roll: {gameState.dice[0]} + {gameState.dice[1]} = {gameState.dice[0] + gameState.dice[1]}</p>
              )}
            </div>

            <GameBoard gameState={gameState} />

            <PlayerStats gameState={gameState} />
          </div>

          <div className="space-y-6">
            <WinStats stats={stats} />

            <GameLog gameLog={gameLog} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatanSimulator;