// Formation configurations with position coordinates
// Coordinates are based on a 100x140 grid (width x height) representing a football field

export interface Position {
  id: string;
  label: string;
  x: number; // 0-100 (left to right)
  y: number; // 0-140 (bottom to top, from goal to goal)
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
}

export interface Formation {
  id: string;
  name: string;
  positions: Position[];
}

export const formations: Formation[] = [
  {
    id: '4-3-3',
    name: '4-3-3',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Midfield (3)
      { id: 'CM1', label: 'CM', x: 30, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 50, y: 50, role: 'MID' },
      { id: 'CM3', label: 'CM', x: 70, y: 50, role: 'MID' },
      
      // Forward (3)
      { id: 'LW', label: 'LW', x: 25, y: 75, role: 'FWD' },
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
      { id: 'RW', label: 'RW', x: 75, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-4-2',
    name: '4-4-2',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Midfield (4)
      { id: 'LM', label: 'LM', x: 20, y: 50, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 40, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 50, role: 'MID' },
      { id: 'RM', label: 'RM', x: 80, y: 50, role: 'MID' },
      
      // Forward (2)
      { id: 'ST1', label: 'ST', x: 40, y: 75, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (3)
      { id: 'CB1', label: 'CB', x: 25, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 50, y: 25, role: 'DEF' },
      { id: 'CB3', label: 'CB', x: 75, y: 25, role: 'DEF' },
      
      // Midfield (5)
      { id: 'LWB', label: 'LWB', x: 15, y: 45, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 35, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 50, y: 50, role: 'MID' },
      { id: 'CM3', label: 'CM', x: 65, y: 50, role: 'MID' },
      { id: 'RWB', label: 'RWB', x: 85, y: 45, role: 'MID' },
      
      // Forward (2)
      { id: 'ST1', label: 'ST', x: 40, y: 75, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (5)
      { id: 'LWB', label: 'LWB', x: 10, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 30, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 50, y: 25, role: 'DEF' },
      { id: 'CB3', label: 'CB', x: 70, y: 25, role: 'DEF' },
      { id: 'RWB', label: 'RWB', x: 90, y: 25, role: 'DEF' },
      
      // Midfield (3)
      { id: 'CM1', label: 'CM', x: 30, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 50, y: 50, role: 'MID' },
      { id: 'CM3', label: 'CM', x: 70, y: 50, role: 'MID' },
      
      // Forward (2)
      { id: 'ST1', label: 'ST', x: 40, y: 75, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Defensive Midfield (2)
      { id: 'CDM1', label: 'CDM', x: 40, y: 40, role: 'MID' },
      { id: 'CDM2', label: 'CDM', x: 60, y: 40, role: 'MID' },
      
      // Attacking Midfield (3)
      { id: 'LAM', label: 'LAM', x: 25, y: 60, role: 'MID' },
      { id: 'CAM', label: 'CAM', x: 50, y: 60, role: 'MID' },
      { id: 'RAM', label: 'RAM', x: 75, y: 60, role: 'MID' },
      
      // Forward (1)
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '3-4-3',
    name: '3-4-3',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (3)
      { id: 'CB1', label: 'CB', x: 25, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 50, y: 25, role: 'DEF' },
      { id: 'CB3', label: 'CB', x: 75, y: 25, role: 'DEF' },
      
      // Midfield (4)
      { id: 'LM', label: 'LM', x: 15, y: 50, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 40, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 50, role: 'MID' },
      { id: 'RM', label: 'RM', x: 85, y: 50, role: 'MID' },
      
      // Forward (3)
      { id: 'LW', label: 'LW', x: 25, y: 75, role: 'FWD' },
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
      { id: 'RW', label: 'RW', x: 75, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-1-4-1',
    name: '4-1-4-1',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Defensive Midfield (1)
      { id: 'CDM', label: 'CDM', x: 50, y: 40, role: 'MID' },
      
      // Midfield (4)
      { id: 'LM', label: 'LM', x: 20, y: 55, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 40, y: 55, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 55, role: 'MID' },
      { id: 'RM', label: 'RM', x: 80, y: 55, role: 'MID' },
      
      // Forward (1)
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-2-4',
    name: '4-2-4',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Midfield (2)
      { id: 'CM1', label: 'CM', x: 40, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 50, role: 'MID' },
      
      // Forward (4)
      { id: 'LW', label: 'LW', x: 20, y: 75, role: 'FWD' },
      { id: 'ST1', label: 'ST', x: 40, y: 75, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 75, role: 'FWD' },
      { id: 'RW', label: 'RW', x: 80, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-3-1-2',
    name: '4-3-1-2',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Midfield (3)
      { id: 'CM1', label: 'CM', x: 30, y: 45, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 50, y: 45, role: 'MID' },
      { id: 'CM3', label: 'CM', x: 70, y: 45, role: 'MID' },
      
      // Attacking Midfield (1)
      { id: 'CAM', label: 'CAM', x: 50, y: 60, role: 'MID' },
      
      // Forward (2)
      { id: 'ST1', label: 'ST', x: 40, y: 75, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '4-5-1',
    name: '4-5-1',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Midfield (5)
      { id: 'LM', label: 'LM', x: 15, y: 50, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 35, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 50, y: 50, role: 'MID' },
      { id: 'CM3', label: 'CM', x: 65, y: 50, role: 'MID' },
      { id: 'RM', label: 'RM', x: 85, y: 50, role: 'MID' },
      
      // Forward (1)
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
    ],
  },
  {
    id: '3-4-2-1',
    name: '3-4-2-1',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (3)
      { id: 'CB1', label: 'CB', x: 25, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 50, y: 25, role: 'DEF' },
      { id: 'CB3', label: 'CB', x: 75, y: 25, role: 'DEF' },
      
      // Midfield (4)
      { id: 'LM', label: 'LM', x: 15, y: 45, role: 'MID' },
      { id: 'CM1', label: 'CM', x: 40, y: 45, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 45, role: 'MID' },
      { id: 'RM', label: 'RM', x: 85, y: 45, role: 'MID' },
      
      // Attacking Midfield/Forward (2)
      { id: 'CAM1', label: 'CAM', x: 35, y: 65, role: 'MID' },
      { id: 'CAM2', label: 'CAM', x: 65, y: 65, role: 'MID' },
      
      // Forward (1)
      { id: 'ST', label: 'ST', x: 50, y: 80, role: 'FWD' },
    ],
  },
  {
    id: '4-1-2-1-2',
    name: '4-1-2-1-2',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (4)
      { id: 'LB', label: 'LB', x: 15, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 35, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 65, y: 25, role: 'DEF' },
      { id: 'RB', label: 'RB', x: 85, y: 25, role: 'DEF' },
      
      // Defensive Midfield (1)
      { id: 'CDM', label: 'CDM', x: 50, y: 40, role: 'MID' },
      
      // Central Midfield (2)
      { id: 'CM1', label: 'CM', x: 35, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 65, y: 50, role: 'MID' },
      
      // Attacking Midfield (1)
      { id: 'CAM', label: 'CAM', x: 50, y: 65, role: 'MID' },
      
      // Forward (2)
      { id: 'ST1', label: 'ST', x: 40, y: 80, role: 'FWD' },
      { id: 'ST2', label: 'ST', x: 60, y: 80, role: 'FWD' },
    ],
  },
  {
    id: '5-2-3',
    name: '5-2-3',
    positions: [
      // Goalkeeper
      { id: 'GK', label: 'GK', x: 50, y: 10, role: 'GK' },
      
      // Defense (5)
      { id: 'LWB', label: 'LWB', x: 10, y: 25, role: 'DEF' },
      { id: 'CB1', label: 'CB', x: 30, y: 25, role: 'DEF' },
      { id: 'CB2', label: 'CB', x: 50, y: 25, role: 'DEF' },
      { id: 'CB3', label: 'CB', x: 70, y: 25, role: 'DEF' },
      { id: 'RWB', label: 'RWB', x: 90, y: 25, role: 'DEF' },
      
      // Midfield (2)
      { id: 'CM1', label: 'CM', x: 40, y: 50, role: 'MID' },
      { id: 'CM2', label: 'CM', x: 60, y: 50, role: 'MID' },
      
      // Forward (3)
      { id: 'LW', label: 'LW', x: 25, y: 75, role: 'FWD' },
      { id: 'ST', label: 'ST', x: 50, y: 75, role: 'FWD' },
      { id: 'RW', label: 'RW', x: 75, y: 75, role: 'FWD' },
    ],
  },
];

export const getFormationById = (formationId: string): Formation | undefined => {
  return formations.find(f => f.id === formationId);
};

export const getPositionColor = (role: Position['role']): string => {
  switch (role) {
    case 'GK':
      return 'bg-yellow-500 border-yellow-600';
    case 'DEF':
      return 'bg-blue-500 border-blue-600';
    case 'MID':
      return 'bg-green-500 border-green-600';
    case 'FWD':
      return 'bg-red-500 border-red-600';
    default:
      return 'bg-gray-500 border-gray-600';
  }
};