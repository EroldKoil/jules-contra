import Phaser from 'phaser';
import { SimpleBullet } from './projectiles/SimpleBullet';
import { LaserProjectile, LaserConfig } from './projectiles/LaserProjectile';

export interface WeaponConfig {
  name: string;
  fireRate: number; // ms between shots
  speed: number;
  pierce: boolean; // Retained for config compatibility, but used specifically logic-wise
  damage: number;
  range: number; // pixels
  bulletCount: number;
  spread: number; // degrees total spread
  type?: 'bullet' | 'laser';
  segments?: number; // New config for laser
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
    const startAngle = this.config.bulletCount > 1
      ? baseAngle - totalSpreadRad / 2
      : baseAngle;

    const step = this.config.bulletCount > 1
      ? totalSpreadRad / (this.config.bulletCount - 1)
      : 0;

    for (let i = 0; i < this.config.bulletCount; i++) {
      const angle = startAngle + (step * i);

      const projConfig = {
          x: x,
          y: y,
          speed: this.config.speed,
          angle: angle,
          damage: this.config.damage,
          range: this.config.range,
          scene: scene,
          physicsGroup: bulletGroup,
          // Map old pierce config if needed, though specific projectiles override
          piercePlatforms: this.config.type === 'laser' ? true : false,
          destroyOnHit: true
      };

      if (this.config.type === 'laser') {
          const laser = new LaserProjectile({
              ...projConfig,
              segments: this.config.segments || 3
          } as LaserConfig);
          laser.create(projConfig);
      } else {
          const bullet = new SimpleBullet(projConfig);
          bullet.create(projConfig);
      }
    }
  }
}
