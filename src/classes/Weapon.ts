import Phaser from 'phaser';

export interface WeaponConfig {
    name: string;
    fireRate: number;        // Milliseconds between shots
    bulletSpeed: number;     // Pixels per second
    penetratesWalls: boolean;
    damage: number;
    range: number;           // Pixels
    projectileCount: number; // Number of bullets per shot
    spread: number;          // Spread angle in degrees
}

export class Weapon {
    public config: WeaponConfig;
    private lastFiredTime: number = 0;

    constructor(config: WeaponConfig) {
        this.config = config;
    }

    public canFire(time: number): boolean {
        return time > this.lastFiredTime + this.config.fireRate;
    }

    public fire(scene: Phaser.Scene, x: number, y: number, aimVector: Phaser.Math.Vector2, bulletsGroup: Phaser.Physics.Arcade.Group): void {
        const time = scene.time.now;
        if (!this.canFire(time)) return;

        this.lastFiredTime = time;

        const baseAngle = aimVector.angle(); // Radians
        const spreadRad = Phaser.Math.DegToRad(this.config.spread);

        // Calculate start angle to center the spread
        // If projectileCount is 1, spread doesn't matter much, just use baseAngle
        // If > 1, distribute evenly around baseAngle
        let startAngle = baseAngle;
        let step = 0;

        if (this.config.projectileCount > 1) {
            startAngle = baseAngle - (spreadRad / 2);
            step = spreadRad / (this.config.projectileCount - 1);
        }

        for (let i = 0; i < this.config.projectileCount; i++) {
            const angle = (this.config.projectileCount === 1) ? baseAngle : startAngle + (step * i);
            const velocity = new Phaser.Math.Vector2().setToPolar(angle, this.config.bulletSpeed);

            const bullet = scene.add.circle(x, y, 4, 0xffff00);
            scene.physics.add.existing(bullet);
            const body = bullet.body as Phaser.Physics.Arcade.Body;

            body.setVelocity(velocity.x, velocity.y);
            body.allowGravity = false;

            // Custom properties for collision handling
            (bullet as any).damage = this.config.damage;
            (bullet as any).penetratesWalls = this.config.penetratesWalls;
            (bullet as any).startPos = new Phaser.Math.Vector2(x, y);
            (bullet as any).range = this.config.range;

            bulletsGroup.add(bullet);
        }
    }
}
