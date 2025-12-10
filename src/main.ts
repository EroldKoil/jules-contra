import Phaser from 'phaser';
import { MainMenu } from './scenes/MainMenu';
import { GameLevel } from './scenes/GameLevel';
import { LevelTransition } from './scenes/LevelTransition';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600, x: 0 },
      debug: true
    }
  },
  scene: [MainMenu, GameLevel, LevelTransition]
};

new Phaser.Game(config);
