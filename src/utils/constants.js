export const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const HEX_TYPES = {
  wood: { color: '#228B22', number: null },
  brick: { color: '#B22222', number: null },
  sheep: { color: '#90EE90', number: null },
  wheat: { color: '#FFD700', number: null },
  ore: { color: '#708090', number: null },
  desert: { color: '#DEB887', number: null }
};

export const BOARD_LAYOUT = [
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

export const BOT_STRATEGIES = {
  sonnet: { name: 'Claude Sonnet 4.5', color: '#8B5CF6', icon: 'Brain' },
  haiku: { name: 'Claude Haiku 4.5', color: '#06B6D4', icon: 'Zap' },
  greedy: { name: 'Greedy Bot', color: '#EF4444' },
  balanced: { name: 'Balanced Bot', color: '#10B981' }
};