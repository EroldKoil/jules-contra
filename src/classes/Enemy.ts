import Phaser from 'phaser';
import { Player } from './Player';

export class Enemy extends Phaser.GameObjects.Rectangle {
    private damage: number;
    private hp: number;
    private maxHp: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 32, 32, 0xff00ff); // Magenta square
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Setup physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);

        this.damage = 10;
        this.maxHp = 30; // 3 hits from default gun (10 dmg)
        this.hp = this.maxHp;
    }

    // Called when player touches enemy
    public onTouchPlayer(player: Player) {
        player.takeDamage(this.damage);
    }

    public takeDamage(amount: number) {
        this.hp -= amount;

        // Visual flash feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });

        if (this.hp <= 0) {
            this.destroy();
        }
    }
}
