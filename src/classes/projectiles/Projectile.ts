import Phaser from 'phaser';

export interface ProjectileConfig {
    x: number;
    y: number;
    speed: number;
    angle: number; // radians
    damage: number;
    range: number;
    scene: Phaser.Scene;
    physicsGroup: Phaser.Physics.Arcade.Group;
    // Optional additional properties
    piercePlatforms?: boolean;
    destroyOnHit?: boolean;
}

export abstract class Projectile {
    protected scene: Phaser.Scene;
    protected physicsGroup: Phaser.Physics.Arcade.Group;
    protected damage: number;
    protected range: number;
    protected startX: number;
    protected startY: number;

    constructor(config: ProjectileConfig) {
        this.scene = config.scene;
        this.physicsGroup = config.physicsGroup;
        this.damage = config.damage;
        this.range = config.range;
        this.startX = config.x;
        this.startY = config.y;
    }

    // Abstract method to create the visual and physical representation
    abstract create(config: ProjectileConfig): void;
}
