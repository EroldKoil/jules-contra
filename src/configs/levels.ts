export interface LevelConfig {
  id: number;
  name: string;
  nextLevelId?: number; // if null -> MainMenu
  platforms: { x: number, y: number, width: number, height: number, type?: 'solid' | 'one_way' }[];
  enemies: { x: number, y: number, hp: number, type?: 'melee' | 'ranged' | 'horizontal', facing?: 'left' | 'right' }[];
  exitZone: { x: number, y: number, width: number, height: number };
  playerStart: { x: number, y: number };
}

export const Levels: LevelConfig[] = [
  {
    id: 1,
    name: "Level 1: The Beginning",
    nextLevelId: 2,
    playerStart: { x: 100, y: 400 },
    platforms: [
      { x: 400, y: 550, width: 200, height: 32, type: 'solid' },
      { x: 800, y: 450, width: 200, height: 32, type: 'one_way' }, // Changed to one_way
      { x: 1200, y: 550, width: 200, height: 32, type: 'solid' },
      // Added extra one-way platforms to test jumping through
      { x: 600, y: 300, width: 150, height: 20, type: 'one_way' },
      { x: 250, y: 300, width: 150, height: 20, type: 'one_way' }
    ],
    enemies: [
      { x: 600, y: 400, hp: 30, type: 'melee' },
      { x: 1300, y: 400, hp: 30, type: 'melee' }
    ],
    exitZone: { x: 1500, y: 500, width: 50, height: 200 } // End of world
  },
  {
    id: 2,
    name: "Level 2: The Ascent",
    nextLevelId: 3,
    playerStart: { x: 50, y: 500 },
    platforms: [
      { x: 300, y: 500, width: 150, height: 32 },
      { x: 500, y: 400, width: 150, height: 32 },
      { x: 700, y: 300, width: 150, height: 32 },
      { x: 900, y: 200, width: 150, height: 32 },
      { x: 1200, y: 500, width: 400, height: 32 }, // Long run
    ],
    enemies: [
      { x: 500, y: 300, hp: 50, type: 'melee' },
      { x: 700, y: 200, hp: 50, type: 'melee' },
      { x: 1200, y: 400, hp: 50, type: 'melee' }
    ],
    exitZone: { x: 1500, y: 450, width: 50, height: 200 }
  },
  {
    id: 3,
    name: "Level 3: The Gauntlet",
    nextLevelId: 4, // Next to Level 4
    playerStart: { x: 50, y: 500 },
    platforms: [
      { x: 300, y: 550, width: 100, height: 32 },
      { x: 500, y: 550, width: 100, height: 32 },
      { x: 700, y: 550, width: 100, height: 32 },
      { x: 900, y: 550, width: 100, height: 32 },
      { x: 1100, y: 550, width: 100, height: 32 },
    ],
    enemies: [
        { x: 300, y: 450, hp: 20, type: 'ranged' },
        { x: 500, y: 450, hp: 20, type: 'ranged' },
        { x: 700, y: 450, hp: 20, type: 'ranged' },
        { x: 900, y: 450, hp: 20, type: 'ranged' },
        { x: 1100, y: 450, hp: 20, type: 'ranged' },
    ],
    exitZone: { x: 1300, y: 500, width: 50, height: 200 }
  },
  {
    id: 4,
    name: "Level 4: The Ambush",
    nextLevelId: undefined, // End game
    playerStart: { x: 50, y: 500 },
    platforms: [
      { x: 200, y: 550, width: 200, height: 32 },
      { x: 600, y: 550, width: 200, height: 32 }, // Enemy on top
      { x: 1000, y: 550, width: 200, height: 32 }, // Enemy on top
      { x: 1400, y: 400, width: 200, height: 32 }, // Higher platform
    ],
    enemies: [
        { x: 600, y: 450, hp: 30, type: 'horizontal', facing: 'left' },
        { x: 1000, y: 450, hp: 30, type: 'horizontal', facing: 'right' },
        { x: 1400, y: 300, hp: 30, type: 'horizontal', facing: 'left' },
    ],
    exitZone: { x: 1550, y: 250, width: 50, height: 200 }
  }
];
