import Phaser from 'phaser';
import { Projectile, ProjectileConfig } from './Projectile';

export class SimpleBullet extends Projectile {
    create(config: ProjectileConfig): void {
        const bullet = this.scene.add.circle(config.x, config.y, 4, 0xffff00); // Yellow bullets
        this.scene.physics.add.existing(bullet);
        this.physicsGroup.add(bullet);

        const body = bullet.body as Phaser.Physics.Arcade.Body;

        // Velocity
        const velocity = new Phaser.Math.Vector2(Math.cos(config.angle), Math.sin(config.angle)).scale(config.speed);
        body.setVelocity(velocity.x, velocity.y);
        body.allowGravity = false;

        // Data for GameLevel logic
        bullet.setData('startX', this.startX);
        bullet.setData('startY', this.startY);
        bullet.setData('range', this.range);
        bullet.setData('damage', this.damage);

        // Standard bullet behavior:
        // Pierce platforms? No (False)
        // Destroy on hit? Yes (True)
        bullet.setData('piercePlatforms', config.piercePlatforms ?? false);
        bullet.setData('destroyOnHit', config.destroyOnHit ?? true);

        // Backward compat
        bullet.setData('pierce', false);
    }
}
