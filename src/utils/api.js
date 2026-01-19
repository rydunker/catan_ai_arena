export const callClaudeAPI = async (player, gameStateData, modelType) => {
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