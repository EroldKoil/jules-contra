import Phaser from 'phaser';
import { Player } from '../classes/Player';
import { Level } from '../classes/Level';
import { Levels } from '../configs/levels';
import { Weapon } from '../classes/Weapon';
import playerPng from '../assets/player/player.png';
import playerJson from '../assets/player/player.json';

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

  preload() {
    this.load.atlas('player', playerPng, playerJson);
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

    // Give reference of player to enemies if needed (For Ranged)
    this.level.enemies.forEach(e => {
        // We can check if method exists or instanceof
        if ('setTarget' in e && typeof (e as any).setTarget === 'function') {
            (e as any).setTarget(this.player.sprite);
        }
    });

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

    // Weapon 3: Laser
    this.player.addWeapon(new Weapon({
      name: 'Laser',
      fireRate: 500,
      speed: 1000,
      damage: 20,
      range: 1200,
      bulletCount: 1,
      spread: 0,
      pierce: true,
      type: 'laser'
    }));

    // Camera follow
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 5. Collisions

    // Player vs Platforms (Solid)
    this.physics.add.collider(this.player.sprite, this.level.platforms);

    // Player vs One-Way Platforms
    this.physics.add.collider(this.player.sprite, this.level.oneWayPlatforms, undefined, (_playerObj, _platformObj) => {
        // Process Callback
        // If player is dropping, ignore collision
        if (this.player.isDropping) {
            return false;
        }
        return true;
    });

    // Bullets vs Platforms
    const handleBulletPlatformCollision = (obj1: any, _obj2: any) => {
      const bullet = obj1 as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      bullet.destroy();
    };

    const processBulletPlatformCollision = (obj1: any, _obj2: any) => {
      // Process Callback: Return false to ignore collision (allow pierce)
      const bullet = obj1 as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      // Default to 'pierce' if 'piercePlatforms' is not set (backward compatibility)
      const pierce = bullet.getData('pierce');
      const piercePlatforms = bullet.getData('piercePlatforms');
      return piercePlatforms !== undefined ? !piercePlatforms : !pierce;
    };

    // Bullets vs Solid Platforms
    this.physics.add.collider(this.bullets, this.level.platforms, handleBulletPlatformCollision, processBulletPlatformCollision);

    // Bullets vs One-Way Platforms
    // Same logic as solid platforms (collide/destroy unless piercing)
    this.physics.add.collider(this.bullets, this.level.oneWayPlatforms, handleBulletPlatformCollision, processBulletPlatformCollision);

    // Enemy Bullets vs Platforms (Solid & One-Way)
    const handleEnemyBulletPlatformCollision = (obj1: any, _obj2: any) => {
      const bullet = obj1 as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      bullet.destroy();
    };

    this.physics.add.collider(this.level.enemyBullets, this.level.platforms, handleEnemyBulletPlatformCollision);
    this.physics.add.collider(this.level.enemyBullets, this.level.oneWayPlatforms, handleEnemyBulletPlatformCollision);

    // Bullets vs Enemies
    const enemySprites = this.physics.add.group();
    this.level.enemies.forEach(e => enemySprites.add(e.sprite));

    this.physics.add.overlap(this.bullets, enemySprites, (bulletObj, enemySpriteObj) => {
      const bullet = bulletObj as Phaser.Types.Physics.Arcade.GameObjectWithBody;
      const enemySprite = enemySpriteObj as Phaser.GameObjects.GameObject;

      const enemy = this.level.enemies.find(e => e.sprite === enemySprite);
      if (enemy) {
        const dmg = bullet.getData('damage') || 10;
        enemy.takeDamage(dmg);
      }

      const pierce = bullet.getData('pierce');
      const destroyOnHit = bullet.getData('destroyOnHit');

      // If destroyOnHit is explicitly set, use it.
      // Otherwise fallback to !pierce (old behavior: if pierce is true, don't destroy)
      const shouldDestroy = destroyOnHit !== undefined ? destroyOnHit : !pierce;

      if (shouldDestroy) {
        bullet.destroy();
      }
    });

    // Player vs Enemies (Contact Damage)
    this.physics.add.overlap(this.player.sprite, enemySprites, (_playerObj, enemySpriteObj) => {
       const enemySprite = enemySpriteObj as Phaser.GameObjects.GameObject;
       const enemy = this.level.enemies.find(e => e.sprite === enemySprite);

       if (enemy) {
           const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
           this.player.takeDamage(10, body.center.x, body.center.y); // Arbitrary contact damage
       }
    });

    // Player vs Enemy Bullets
    this.physics.add.overlap(this.player.sprite, this.level.enemyBullets, (_playerObj, bulletObj) => {
        const bullet = bulletObj as Phaser.Types.Physics.Arcade.GameObjectWithBody;
        const dmg = bullet.getData('damage') || 10;

        // Pass bullet position as source
        this.player.takeDamage(dmg, bullet.body.center.x, bullet.body.center.y);

        bullet.destroy();
    });

    // Player vs Exit Zone
    this.physics.add.overlap(this.player.sprite, this.level.exitZone, () => {
       this.handleLevelComplete();
    });
  }

  update(time: number, delta: number) {
    if (!this.player || this.player.hp <= 0) {
        // Game Over logic or restart?
        // For now, reload level if dead
        if (this.player && this.player.hp <= 0) {
             this.scene.restart({ levelId: this.currentLevelId });
        }
        return;
    }

    this.player.update(time, this.bullets);
    this.level.update(time, delta);

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

    // Enemy Bullets cleanup (bounds)
    this.level.enemyBullets.children.each((b) => {
        const bullet = b as Phaser.Types.Physics.Arcade.GameObjectWithBody;
        if (bullet.active) {
             // Simple cleanup if out of world
             if (!this.physics.world.bounds.contains(bullet.body.x, bullet.body.y)) {
                 bullet.destroy();
             }
        }
        return true;
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
