import { LevelConfig } from '../classes/Level';

export const levels: LevelConfig[] = [
    {
        id: 1,
        platforms: [
            { x: 400, y: 400, w: 200, h: 32 },
            { x: 800, y: 300, w: 200, h: 32 }
        ],
        enemies: [
            { x: 500, y: 350 },
            { x: 900, y: 250 }
        ],
        endZone: { x: 1200, y: 400, w: 50, h: 100 },
        nextLevelId: 2
    },
    {
        id: 2,
        platforms: [
            { x: 300, y: 500, w: 150, h: 32 },
            { x: 600, y: 400, w: 150, h: 32 },
            { x: 900, y: 300, w: 150, h: 32 },
            { x: 1200, y: 200, w: 150, h: 32 }
        ],
        enemies: [
            { x: 600, y: 350 },
            { x: 900, y: 250 },
            { x: 1200, y: 150 }
        ],
        endZone: { x: 1500, y: 400, w: 50, h: 100 },
        nextLevelId: 3
    },
    {
        id: 3,
        platforms: [
            { x: 500, y: 450, w: 100, h: 32 },
            { x: 700, y: 450, w: 100, h: 32 },
            { x: 900, y: 350, w: 100, h: 32 },
            { x: 1100, y: 250, w: 100, h: 32 },
            { x: 1300, y: 250, w: 100, h: 32 }
        ],
        enemies: [
            { x: 500, y: 400 },
            { x: 700, y: 400 },
            { x: 900, y: 300 },
            { x: 1100, y: 200 }
        ],
        endZone: { x: 1600, y: 400, w: 50, h: 100 }
        // No nextLevelId -> Last level
    }
];
