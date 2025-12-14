import Phaser from 'phaser';
import { LevelConfig } from '../configs/levels';
import { Enemy } from './enemies/Enemy';
import { MeleeEnemy } from './enemies/MeleeEnemy';
import { RangedEnemy } from './enemies/RangedEnemy';

export class Level {
  public scene: Phaser.Scene;
  public config: LevelConfig;
  public platforms: Phaser.Physics.Arcade.StaticGroup;
  public oneWayPlatforms: Phaser.Physics.Arcade.StaticGroup;
  public enemies: Enemy[] = [];
  public exitZone!: Phaser.GameObjects.Rectangle;
  public enemyBullets!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, config: LevelConfig) {
    this.scene = scene;
    this.config = config;
    this.platforms = scene.physics.add.staticGroup();
    this.oneWayPlatforms = scene.physics.add.staticGroup();
    this.enemyBullets = scene.physics.add.group({
      classType: Phaser.GameObjects.Arc,
      runChildUpdate: true
    });
  }

  create() {
    // 1. World Bounds
    const width = Math.max(1600, this.config.exitZone.x + 200);
    const height = 600;
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.scene.cameras.main.setBounds(0, 0, width, height);

    // 2. Base Ground
    const floor = this.scene.add.rectangle(width / 2, height + 10, width, 20, 0x000000);
    this.scene.physics.add.existing(floor, true);
    this.platforms.add(floor);

    // 3. Platforms
    this.config.platforms.forEach(p => {
      const isOneWay = p.type === 'one_way';
      const color = isOneWay ? 0xff0000 : 0x0000ff;

      const platform = this.scene.add.rectangle(p.x, p.y, p.width, p.height, color);
      this.scene.physics.add.existing(platform, true);

      if (isOneWay) {
        this.oneWayPlatforms.add(platform);
        const body = platform.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        body.checkCollision.up = true;
      } else {
        this.platforms.add(platform);
      }
    });

    // 4. Enemies
    this.config.enemies.forEach(e => {
      let enemy: Enemy;
      if (e.type === 'ranged') {
          enemy = new RangedEnemy(this.scene, e.x, e.y, e.hp);
          (enemy as RangedEnemy).setBulletGroup(this.enemyBullets);
      } else {
          enemy = new MeleeEnemy(this.scene, e.x, e.y, e.hp);
      }

      this.enemies.push(enemy);
      // Collide with both solid and one-way platforms
      this.scene.physics.add.collider(enemy.sprite, this.platforms);
      this.scene.physics.add.collider(enemy.sprite, this.oneWayPlatforms);
    });

    // 5. Exit Zone
    const ez = this.config.exitZone;
    this.exitZone = this.scene.add.rectangle(ez.x, ez.y, ez.width, ez.height, 0x00ff00);
    this.scene.physics.add.existing(this.exitZone, true);
    this.exitZone.setAlpha(0.5);
  }

  update(time: number, delta: number) {
    // Cleanup dead enemies
    this.enemies = this.enemies.filter(e => {
       if (e.hp <= 0) return false;
       e.update(time, delta);
       return true;
    });
  }
}
