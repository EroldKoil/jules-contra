import Phaser from 'phaser';

export interface WeaponConfig {
  name: string;
  fireRate: number; // ms between shots
  speed: number;
  pierce: boolean;
  damage: number;
  range: number; // pixels
  bulletCount: number;
  spread: number; // degrees total spread
  type?: 'bullet' | 'laser';
}

export class Weapon {
  public config: WeaponConfig;
  private lastFired: number = 0;

  constructor(config: WeaponConfig) {
    this.config = config;
  }

  canFire(time: number): boolean {
    return time > this.lastFired + this.config.fireRate;
  }

  fire(
    scene: Phaser.Scene,
    x: number,
    y: number,
    aimVector: Phaser.Math.Vector2,
    bulletGroup: Phaser.Physics.Arcade.Group,
    time: number
  ) {
    this.lastFired = time;

    // Calculate base angle
    const baseAngle = aimVector.angle(); // radians
    const totalSpreadRad = Phaser.Math.DegToRad(this.config.spread);

    // If multiple bullets, center the spread
    // e.g. 3 bullets, 30 deg spread. -15, 0, +15.
    const startAngle = this.config.bulletCount > 1
      ? baseAngle - totalSpreadRad / 2
      : baseAngle;

    const step = this.config.bulletCount > 1
      ? totalSpreadRad / (this.config.bulletCount - 1)
      : 0;

    for (let i = 0; i < this.config.bulletCount; i++) {
      const angle = startAngle + (step * i);
      const velocity = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(this.config.speed);

      let bullet: Phaser.GameObjects.Shape;

      if (this.config.type === 'laser') {
          // 32px long, 3.2px wide (approx 3px)
          bullet = scene.add.rectangle(x, y, 32, 3, 0x00ffff);
          bullet.setRotation(angle);
      } else {
          bullet = scene.add.circle(x, y, 4, 0xffff00); // Yellow bullets
      }

      scene.physics.add.existing(bullet);
      bulletGroup.add(bullet);

      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(velocity.x, velocity.y);
      body.allowGravity = false;

      // Store extra data for range logic
      bullet.setData('startX', x);
      bullet.setData('startY', y);
      bullet.setData('range', this.config.range);
      bullet.setData('damage', this.config.damage);
      bullet.setData('pierce', this.config.pierce);
    }
  }
}
