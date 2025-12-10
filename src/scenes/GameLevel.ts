import Phaser from 'phaser';
import { Player } from '../classes/Player';
import { Level } from '../classes/Level';
import { Levels } from '../configs/levels';
import { Weapon } from '../classes/Weapon';

export class GameLevel extends Phaser.Scene {
  private player!: Player;
  private level!: Level;
  private bullets!: Phaser.Physics.Arcade.Group;
  private currentLevelId: number = 1;

  constructor() {
    super('GameLevel');
  }

  init(data: { levelId?: number }) {
    this.currentLevelId = data.levelId || 1;
  }

  create() {
    // 1. Level Config
    const config = Levels.find(l => l.id === this.currentLevelId);
    if (!config) {
      console.error('Level config not found for ID:', this.currentLevelId);
      this.scene.start('MainMenu');
      return;
    }

    // 2. Setup Level
    this.level = new Level(this, config);
    this.level.create();

    // 3. Bullets Group
    this.bullets = this.physics.add.group({
      classType: Phaser.GameObjects.Arc,
      runChildUpdate: true
    });

    // 4. Setup Player
    this.player = new Player(this, config.playerStart.x, config.playerStart.y, 100);

    // Add Weapons
    // Weapon 1: Rifle
    this.player.addWeapon(new Weapon({
      name: 'Rifle',
      fireRate: 200,
      speed: 800,
      damage: 10,
      range: 600,
      bulletCount: 1,
      spread: 0,
      pierce: false
    }));

    // Weapon 2: Shotgun/Spread
    this.player.addWeapon(new Weapon({
      name: 'Shotgun',
      fireRate: 800,
      speed: 600,
      damage: 5, // per bullet
      range: 300,
      bulletCount: 5,
      spread: 30,
      pierce: false
    }));

    // Camera follow
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 5. Collisions

    // Player vs Platforms
    this.physics.add.collider(this.player.sprite, this.level.platforms);

    // Bullets vs Platforms
    this.physics.add.collider(this.bullets, this.level.platforms, (obj1, _obj2) => {
      const bullet = obj1 as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      // If pierce is false, destroy. (Currently simple logic: walls always stop bullets)
      // If we had thin platforms, maybe pass through? Assuming walls stop all.
      bullet.destroy();
    });

    // Bullets vs Enemies
    // We need to iterate enemies or add them to a group.
    // Since Enemy class wraps the sprite, we can create a Group for enemy sprites.
    const enemySprites = this.physics.add.group();
    this.level.enemies.forEach(e => enemySprites.add(e.sprite));

    this.physics.add.overlap(this.bullets, enemySprites, (bulletObj, enemySpriteObj) => {
      const bullet = bulletObj as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      const enemySprite = enemySpriteObj as Phaser.GameObjects.GameObject;

      // Find the Enemy object
      // We need to cast or compare correctly. e.sprite is Rectangle, enemySprite is GameObject (Rectangle).
      const enemy = this.level.enemies.find(e => e.sprite === enemySprite);
      if (enemy) {
        const dmg = bullet.getData('damage') || 10;
        enemy.takeDamage(dmg);
      }

      const pierce = bullet.getData('pierce');
      if (!pierce) {
        bullet.destroy();
      }
    });

    // Player vs Enemies (Contact Damage)
    this.physics.add.overlap(this.player.sprite, enemySprites, () => {
       // Simple contact damage cooldown logic could go here
       // For now, instant damage every frame? That's too fast.
       // Let's add a "lastDamageTime" to player or simple pushback.
       this.player.takeDamage(1);
       // Optionally push player back
    });

    // Player vs Exit Zone
    this.physics.add.overlap(this.player.sprite, this.level.exitZone, () => {
       this.handleLevelComplete();
    });
  }

  update(time: number, _delta: number) {
    if (!this.player || this.player.hp <= 0) {
        // Game Over logic or restart?
        // For now, reload level if dead
        if (this.player && this.player.hp <= 0) {
             this.scene.restart({ levelId: this.currentLevelId });
        }
        return;
    }

    this.player.update(time, this.bullets);
    this.level.update();

    // Bullet Range Logic
    this.bullets.children.each((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      if (bullet.active) {
        const startX = bullet.getData('startX');
        const startY = bullet.getData('startY');
        const range = bullet.getData('range');

        if (startX !== undefined && startY !== undefined && range !== undefined) {
           const dist = Phaser.Math.Distance.Between(startX, startY, bullet.body.x, bullet.body.y);
           if (dist > range) {
             bullet.destroy();
           }
        }
      }
      return true; // continue iteration
    });
  }

  private handleLevelComplete() {
    // Prevent multiple triggers
    this.physics.pause();

    const config = Levels.find(l => l.id === this.currentLevelId);
    if (config && config.nextLevelId) {
        const nextConfig = Levels.find(l => l.id === config.nextLevelId);
        this.scene.start('LevelTransition', {
            nextLevelId: config.nextLevelId,
            levelName: nextConfig?.name
        });
    } else {
        // End of game -> Main Menu
        this.scene.start('MainMenu');
    }
  }
}
