import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Brain, Zap } from 'lucide-react';

const CatanSimulator = () => {
  const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
  const HEX_TYPES = {
    wood: { color: '#228B22', number: null },
    brick: { color: '#B22222', number: null },
    sheep: { color: '#90EE90', number: null },
    wheat: { color: '#FFD700', number: null },
    ore: { color: '#708090', number: null },
    desert: { color: '#DEB887', number: null }
  };

  const BOARD_LAYOUT = [
    { type: 'ore', number: 10 },
    { type: 'sheep', number: 2 },
    { type: 'wood', number: 9 },
    { type: 'wheat', number: 12 },
    { type: 'brick', number: 6 },
    { type: 'sheep', number: 4 },
    { type: 'brick', number: 10 },
    { type: 'wheat', number: 9 },
    { type: 'wood', number: 11 },
    { type: 'desert', number: null },
    { type: 'wood', number: 3 },
    { type: 'ore', number: 8 },
    { type: 'wood', number: 8 },
    { type: 'ore', number: 3 },
    { type: 'wheat', number: 4 },
    { type: 'sheep', number: 5 },
    { type: 'brick', number: 5 },
    { type: 'wheat', number: 6 },
    { type: 'sheep', number: 11 }
  ];

  const BOT_STRATEGIES = {
    sonnet: { name: 'Claude Sonnet 4.5', color: '#8B5CF6', icon: Brain },
    haiku: { name: 'Claude Haiku 4.5', color: '#06B6D4', icon: Zap },
    greedy: { name: 'Greedy Bot', color: '#EF4444' },
    balanced: { name: 'Balanced Bot', color: '#10B981' }
  };

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

  const rollDice = () => {
    return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
  };

  const getValidSettlementSpots = (player) => {
    const occupied = gameState.players.flatMap(p => [...p.settlements, ...p.cities]);
    const spots = [];
    for (let i = 0; i < 54; i++) {
      if (!occupied.includes(i) && !occupied.some(s => Math.abs(s - i) < 2)) {
        spots.push(i);
      }
    }
    return spots.slice(0, 20);
  };

  const getValidRoadSpots = (player) => {
    const occupied = gameState.players.flatMap(p => p.roads);
    const playerLocations = [...player.settlements, ...player.cities, ...player.roads];
    const spots = [];
    for (let i = 0; i < 72; i++) {
      if (!occupied.includes(i) && (playerLocations.length === 0 || Math.random() > 0.5)) {
        spots.push(i);
      }
    }
    return spots.slice(0, 15);
  };

  const canAfford = (player, cost) => {
    return Object.keys(cost).every(resource => player.resources[resource] >= cost[resource]);
  };

  const deductResources = (player, cost) => {
    const newResources = { ...player.resources };
    Object.keys(cost).forEach(resource => {
      newResources[resource] -= cost[resource];
    });
    return newResources;
  };

  const callClaudeAPI = async (player, gameStateData, modelType) => {
    const model = modelType === 'sonnet' ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001';
    
    const gameContext = `You are playing Settlers of Catan. Here's the current game state:

YOUR STATUS:
- Points: ${player.points}/10 (need 10 to win)
- Resources: Wood(${player.resources.wood}) Brick(${player.resources.brick}) Sheep(${player.resources.sheep}) Wheat(${player.resources.wheat}) Ore(${player.resources.ore})
- Settlements: ${player.settlements.length}
- Cities: ${player.cities.length}
- Roads: ${player.roads.length}

COSTS:
- Settlement: 1 wood, 1 brick, 1 sheep, 1 wheat (gives 1 point)
- City: 2 wheat, 3 ore (upgrade settlement, gives 1 additional point + double resources)
- Road: 1 wood, 1 brick

OPPONENTS:
${gameStateData.players.filter(p => p.id !== player.id).map(p => 
  `- ${p.name}: ${p.points} points, ${p.settlements.length} settlements, ${p.cities.length} cities`
).join('\n')}

GAME STATE: Turn ${gameStateData.turn}, Phase: ${gameStateData.phase}

Based on this, what action should you take? Respond with ONLY a JSON object in this format:
{"action": "settlement" | "city" | "road" | "pass", "reasoning": "brief explanation"}

Consider:
- What gets you closest to 10 points?
- Resource efficiency
- Blocking opponents if ahead
- Long-term vs short-term gains`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          messages: [
            { role: "user", content: gameContext }
          ],
        })
      });

      const data = await response.json();
      const textContent = data.content.find(c => c.type === 'text')?.text || '';
      
      // Extract JSON from response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { action: 'pass', reasoning: 'Could not parse response' };
    } catch (error) {
      console.error('Claude API error:', error);
      return { action: 'pass', reasoning: 'API error occurred' };
    }
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
        const validSpots = getValidSettlementSpots(currentPlayer);
        if (validSpots.length > 0) {
          const spot = validSpots[Math.floor(Math.random() * Math.min(5, validSpots.length))];
          currentPlayer.settlements.push(spot);
          currentPlayer.points += 1;

          const roadSpots = getValidRoadSpots(currentPlayer);
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
        const validSpots = getValidSettlementSpots(updatedPlayer);
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
        const validRoads = getValidRoadSpots(updatedPlayer);
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
  const isAITurn = currentPlayerData.strategy === 'sonnet' || currentPlayerData.strategy === 'haiku';

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Catan AI Arena</h1>
        <p className="text-center text-gray-600 mb-6">Claude Sonnet vs Haiku vs Rule-Based Bots</p>
        
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

        {isThinking && isAITurn && (
          <div className="text-center mb-4 py-3 bg-purple-100 border-2 border-purple-400 rounded-lg">
            <p className="text-purple-800 font-semibold flex items-center justify-center gap-2">
              {currentPlayerData.strategy === 'sonnet' ? <Brain className="animate-pulse" /> : <Zap className="animate-pulse" />}
              {currentPlayerData.name} is thinking...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Game Board</h2>
              <p className="text-gray-600">Turn {gameState.turn} - {gameState.phase === 'setup' ? `Setup Round ${gameState.setupRound}` : 'Main Game'}</p>
              {gameState.dice[0] > 0 && (
                <p className="text-lg font-semibold mt-2">Last Roll: {gameState.dice[0]} + {gameState.dice[1]} = {gameState.dice[0] + gameState.dice[1]}</p>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <svg viewBox="0 0 700 650" className="w-full max-w-3xl">
                {/* Water background - large hexagon */}
                <polygon
                  points="350,20 550,140 550,380 350,500 150,380 150,140"
                  fill="#4A90E2"
                  stroke="#2C5F8D"
                  strokeWidth="8"
                />
                
                {/* Waves pattern for water */}
                {[...Array(12)].map((_, i) => (
                  <path
                    key={`wave-${i}`}
                    d={`M ${100 + i * 50} ${50 + (i % 2) * 10} Q ${110 + i * 50} ${45 + (i % 2) * 10} ${120 + i * 50} ${50 + (i % 2) * 10}`}
                    stroke="#6BA3D8"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.4"
                  />
                ))}
                
                {BOARD_LAYOUT.map((hex, idx) => {
                  // Hexagonal layout: 3-4-5-4-3 pattern
                  const hexSize = 52;
                  const hexHeight = hexSize * Math.sqrt(3);
                  
                  let row, col, x, y;
                  
                  if (idx < 3) {
                    // Row 0: 3 hexes
                    row = 0;
                    col = idx;
                    x = 350 + (col - 1) * hexSize * 1.5;
                    y = 150;
                  } else if (idx < 7) {
                    // Row 1: 4 hexes
                    row = 1;
                    col = idx - 3;
                    x = 350 + (col - 1.5) * hexSize * 1.5;
                    y = 150 + hexHeight;
                  } else if (idx < 12) {
                    // Row 2: 5 hexes (middle)
                    row = 2;
                    col = idx - 7;
                    x = 350 + (col - 2) * hexSize * 1.5;
                    y = 150 + hexHeight * 2;
                  } else if (idx < 16) {
                    // Row 3: 4 hexes
                    row = 3;
                    col = idx - 12;
                    x = 350 + (col - 1.5) * hexSize * 1.5;
                    y = 150 + hexHeight * 3;
                  } else {
                    // Row 4: 3 hexes
                    row = 4;
                    col = idx - 16;
                    x = 350 + (col - 1) * hexSize * 1.5;
                    y = 150 + hexHeight * 4;
                  }

                  const hexColor = HEX_TYPES[hex.type].color;
                  
                  const points = [
                    [x, y - hexSize * 0.577],
                    [x + hexSize * 0.5, y - hexSize * 0.289],
                    [x + hexSize * 0.5, y + hexSize * 0.289],
                    [x, y + hexSize * 0.577],
                    [x - hexSize * 0.5, y + hexSize * 0.289],
                    [x - hexSize * 0.5, y - hexSize * 0.289]
                  ].map(p => p.join(',')).join(' ');
                  
                  
                  return (
                    <g key={idx}>
                      {/* Tan/beige border (outer hex) */}
                      <polygon
                        points={points}
                        fill="#D4A574"
                        stroke="#B8935E"
                        strokeWidth="3"
                      />
                      
                      {/* Inner resource hex (slightly smaller) */}
                      <polygon
                        points={Array.from({ length: 6 }, (_, i) => {
                          const a = (Math.PI / 3) * i - Math.PI / 2;
                          return [
                            x + (hexSize - 6) * Math.cos(a),
                            y + (hexSize - 6) * Math.sin(a)
                          ];
                        }).map(p => p.join(',')).join(' ')}
                        fill={hexColor}
                        stroke="#8B7355"
                        strokeWidth="2"
                      />
                      
                      {hex.type === 'wood' && (
                        <>
                          <rect x={x-6} y={y-12} width="3" height="16" fill="#654321" />
                          <rect x={x+3} y={y-12} width="3" height="16" fill="#654321" />
                          <circle cx={x-4.5} cy={y-14} r="6" fill="#2d5016" />
                          <circle cx={x+4.5} cy={y-14} r="6" fill="#2d5016" />
                        </>
                      )}
                      {hex.type === 'brick' && (
                        <>
                          <rect x={x-12} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                          <rect x={x-2} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                          <rect x={x+8} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                          <rect x={x-12} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                          <rect x={x-2} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                          <rect x={x+8} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                        </>
                      )}
                      {hex.type === 'sheep' && (
                        <>
                          <ellipse cx={x} cy={y-3} rx="10" ry="8" fill="white" stroke="#333" strokeWidth="1" />
                          <circle cx={x-4} cy={y-6} r="1.5" fill="#333" />
                          <circle cx={x+4} cy={y-6} r="1.5" fill="#333" />
                          <ellipse cx={x-6} cy={y-3} rx="3" ry="5" fill="white" stroke="#333" strokeWidth="1" />
                          <ellipse cx={x+6} cy={y-3} rx="3" ry="5" fill="white" stroke="#333" strokeWidth="1" />
                        </>
                      )}
                      {hex.type === 'wheat' && (
                        <>
                          <line x1={x-8} y1={y+8} x2={x-8} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                          <line x1={x} y1={y+8} x2={x} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                          <line x1={x+8} y1={y+8} x2={x+8} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                          <ellipse cx={x-8} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                          <ellipse cx={x} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                          <ellipse cx={x+8} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                        </>
                      )}
                      {hex.type === 'ore' && (
                        <>
                          <polygon points={`${x-6},${y+4} ${x},${y-8} ${x+6},${y+4}`} fill="#696969" stroke="#333" strokeWidth="1" />
                          <polygon points={`${x-10},${y+6} ${x-3},${y-1} ${x+3},${y+6}`} fill="#808080" stroke="#333" strokeWidth="1" />
                          <polygon points={`${x+3},${y+6} ${x+10},${y-1} ${x+6},${y+6}`} fill="#A9A9A9" stroke="#333" strokeWidth="1" />
                        </>
                      )}
                      {hex.type === 'desert' && (
                        <>
                          <circle cx={x-6} cy={y+6} r="2.5" fill="#D2B48C" opacity="0.5" />
                          <circle cx={x+4} cy={y-4} r="3" fill="#D2B48C" opacity="0.5" />
                          <circle cx={x+6} cy={y+8} r="2" fill="#D2B48C" opacity="0.5" />
                        </>
                      )}
                      
                      {/* Number token */}
                      {hex.number && (
                        <>
                          <circle cx={x} cy={y+10} r="10" fill="#F5E6D3" stroke="#333" strokeWidth="2" />
                          <text
                            x={x}
                            y={y+15}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="bold"
                            fill={hex.number === 6 || hex.number === 8 ? '#D32F2F' : '#333'}
                          >
                            {hex.number}
                          </text>
                          {(hex.number === 6 || hex.number === 8) && (
                            <circle cx={x} cy={y+10} r="3" fill="none" stroke="#D32F2F" strokeWidth="1.5" opacity="0.5" />
                          )}
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Player Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {gameState.players.map(player => {
                  const Icon = BOT_STRATEGIES[player.strategy]?.icon;
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
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-3">Win Statistics</h3>
              {Object.keys(stats).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([strategy, wins]) => {
                    const Icon = BOT_STRATEGIES[strategy]?.icon;
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

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-3">Game Log</h3>
              <div className="h-96 overflow-y-auto space-y-1 text-sm">
                {gameLog.slice(-25).reverse().map((log, idx) => (
                  <p key={idx} className="text-gray-700 border-b border-gray-100 pb-1">{log}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatanSimulator;