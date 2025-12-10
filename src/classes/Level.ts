import Phaser from 'phaser';
import { LevelConfig } from '../configs/levels';
import { Enemy } from './Enemy';

export class Level {
  public scene: Phaser.Scene;
  public config: LevelConfig;
  public platforms: Phaser.Physics.Arcade.StaticGroup;
  public enemies: Enemy[] = [];
  public exitZone!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: LevelConfig) {
    this.scene = scene;
    this.config = config;
    this.platforms = scene.physics.add.staticGroup();
  }

  create() {
    // 1. World Bounds (Adjust based on level content, e.g. exitZone x)
    // Assuming horizontal progression, width ~ exitZone.x + 500
    const width = Math.max(1600, this.config.exitZone.x + 200);
    const height = 600;
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);

    // 2. Base Ground (optional, or defined in config? Let's assume config handles platforms completely)
    // Adding a safety floor at bottom just in case
    const floor = this.scene.add.rectangle(width / 2, height + 10, width, 20, 0x000000);
    this.scene.physics.add.existing(floor, true);
    this.platforms.add(floor);

    // 3. Platforms
    this.config.platforms.forEach(p => {
      const platform = this.scene.add.rectangle(p.x, p.y, p.width, p.height, 0x0000ff);
      this.scene.physics.add.existing(platform, true);
      this.platforms.add(platform);
    });

    // 4. Enemies
    this.config.enemies.forEach(e => {
      const enemy = new Enemy(this.scene, e.x, e.y, e.hp);
      this.enemies.push(enemy);
      this.scene.physics.add.collider(enemy.sprite, this.platforms);
    });

    // 5. Exit Zone
    const ez = this.config.exitZone;
    this.exitZone = this.scene.add.rectangle(ez.x, ez.y, ez.width, ez.height, 0x00ff00);
    this.scene.physics.add.existing(this.exitZone, true);
    // Make it semitransparent
    this.exitZone.setAlpha(0.5);
  }

  update() {
    // Cleanup dead enemies
    this.enemies = this.enemies.filter(e => {
       if (e.hp <= 0) return false;
       e.update();
       return true;
    });
  }
}
