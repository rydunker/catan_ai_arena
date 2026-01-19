export const rollDice = () => {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
};

export const getValidSettlementSpots = (player, gameState) => {
  const occupied = gameState.players.flatMap(p => [...p.settlements, ...p.cities]);
  const spots = [];
  for (let i = 0; i < 54; i++) {
    if (!occupied.includes(i) && !occupied.some(s => Math.abs(s - i) < 2)) {
      spots.push(i);
    }
  }
  return spots.slice(0, 20);
};

export const getValidRoadSpots = (player, gameState) => {
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

export const canAfford = (player, cost) => {
  return Object.keys(cost).every(resource => player.resources[resource] >= cost[resource]);
};

export const deductResources = (player, cost) => {
  const newResources = { ...player.resources };
  Object.keys(cost).forEach(resource => {
    newResources[resource] -= cost[resource];
  });
  return newResources;
};