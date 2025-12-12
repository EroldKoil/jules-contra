import Phaser from 'phaser';
import { Projectile, ProjectileConfig } from './Projectile';

export interface LaserConfig extends ProjectileConfig {
    segments: number;
}

export class LaserProjectile extends Projectile {
    create(config: ProjectileConfig): void {
        const laserConfig = config as LaserConfig;
        const segments = laserConfig.segments || 3;
        const totalLength = 64; // Default total length mentioned in requirements logic 64 / n
        const segmentLength = totalLength / segments;
        const width = 3;

        // Vector for the direction
        const dir = new Phaser.Math.Vector2(Math.cos(config.angle), Math.sin(config.angle));

        // Velocity vector
        const velocity = dir.clone().scale(config.speed);

        for (let i = 0; i < segments; i++) {
            // Calculate position for this segment
            // They are "standing one after another".
            // The first one (head) is at (x,y). The next is behind it.
            // Offset per segment: we move backwards along the direction vector by segmentLength * i

            // NOTE: The center of the segment vs the connection point.
            // If (x,y) is the firing point (muzzle), the first segment should probably start there.
            // Phaser rectangles are positioned by center by default unless origin is changed.
            // Let's assume (x,y) is the center of the first segment? Or the front tip?
            // Usually projectiles spawn at the muzzle.

            // Let's position the center of the i-th segment.
            // Center of 1st segment (i=0): (x,y) - dir * (segmentLength / 2)?
            // Or just spawn them trailing (x,y).

            // If they are attached end-to-end:
            // Segment 0 center: (x,y) - dir * (segmentLength * 0.5)
            // Segment 1 center: (x,y) - dir * (segmentLength * 1.5)
            // Segment 2 center: (x,y) - dir * (segmentLength * 2.5)

            const offsetDist = segmentLength * (i + 0.5);
            const offsetX = dir.x * offsetDist; // Moving backwards?
            // Actually, if we want them to spawn *at* the player and move out,
            // usually we spawn the head at X, and the tail trails behind.
            // So we subtract the offset from the spawn position.

            const segX = config.x - offsetX;
            const segY = config.y - (dir.y * offsetDist);

            const segment = this.scene.add.rectangle(segX, segY, segmentLength, width, 0x00ffff);
            segment.setRotation(config.angle);

            this.scene.physics.add.existing(segment);
            this.physicsGroup.add(segment);

            const body = segment.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(velocity.x, velocity.y);
            body.allowGravity = false;

            // Collision Data
            segment.setData('startX', this.startX); // All measure range from the gun position
            segment.setData('startY', this.startY);
            segment.setData('range', this.range);
            segment.setData('damage', this.damage);

            // Special Laser Behavior:
            // Pierce Platforms = True (Pass through)
            // Destroy on Hit = True (Disappear on enemy contact)
            segment.setData('piercePlatforms', true);
            segment.setData('destroyOnHit', true);

            // Backward compat (for older logic that might check just 'pierce')
            // If we set 'pierce' to true, it might skip destroying on enemies in old logic,
            // but we updated GameLevel to check 'destroyOnHit' preferentially.
            segment.setData('pierce', true);
        }
    }
}
