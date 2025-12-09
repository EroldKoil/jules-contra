import Phaser from 'phaser';
import { Level } from '../classes/Level';
import { levels } from '../configs/levels';

export class GameLevel extends Phaser.Scene {
  private levelManager!: Level;
  private currentLevelId: number = 1;

  constructor() {
    super('GameLevel');
  }

  init(data: { levelId: number }) {
    this.currentLevelId = data.levelId || 1;
  }

  create() {
    // Find config
    const config = levels.find(l => l.id === this.currentLevelId);
    if (!config) {
        console.error('Level config not found!');
        this.scene.start('MainMenu');
        return;
    }

    this.levelManager = new Level(this, config);
    this.levelManager.create();
  }

  update(time: number, delta: number) {
    if (this.levelManager && this.levelManager.player) {
        this.levelManager.player.update(time, delta);
    }
  }
}
