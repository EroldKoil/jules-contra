import Phaser from 'phaser';
import { Weapon } from './Weapon';

export class Player extends Phaser.GameObjects.Rectangle {
    declare public body: Phaser.Physics.Arcade.Body;

    private hp: number;
    // @ts-ignore
    private maxHp: number;

    private weapons: [Weapon, Weapon];
    private activeWeaponIndex: number = 0;

    private moveSpeed: number = 200;
    private jumpSpeed: number = -550;

    // Inputs
    private keys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        O: Phaser.Input.Keyboard.Key;
        I: Phaser.Input.Keyboard.Key;
        ONE: Phaser.Input.Keyboard.Key;
        TWO: Phaser.Input.Keyboard.Key;
    };

    private facingRight: boolean = true;
    private isProne: boolean = false;
    private currentAim: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

    // Dimensions
    private readonly STANDING_SIZE = { w: 32, h: 64 };
    private readonly PRONE_SIZE = { w: 64, h: 32 };

    constructor(scene: Phaser.Scene, x: number, y: number, weapons: [Weapon, Weapon], maxHp: number = 100) {
        super(scene, x, y, 32, 64, 0xff0000);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = maxHp;
        this.maxHp = maxHp;
        this.weapons = weapons;

        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(600);

        // Input setup
        const keyboard = scene.input.keyboard!;
        this.keys = {
            W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            O: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
            I: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
            ONE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            TWO: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
        };
    }

    update(_time: number, _delta: number) {
        if (this.hp <= 0) return; // Dead logic placeholder

        this.handleWeaponSwitch();
        this.handleMovementAndAiming();
        this.handleShooting();
    }

    private handleWeaponSwitch() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
            this.activeWeaponIndex = 0;
            console.log('Switched to Weapon 1');
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
            this.activeWeaponIndex = 1;
            console.log('Switched to Weapon 2');
        }
    }

    private handleMovementAndAiming() {
        const onGround = this.body.touching.down;
        let velocityX = 0;
        let aimX = 0;
        let aimY = 0;
        let nextProneState = false;

        // Horizontal Movement
        if (this.keys.A.isDown) {
            velocityX = -this.moveSpeed;
            this.facingRight = false;
        } else if (this.keys.D.isDown) {
            velocityX = this.moveSpeed;
            this.facingRight = true;
        }

        // Aiming Logic (Re-implemented from previous task)
        aimX = this.facingRight ? 1 : -1;
        aimY = 0;

        if (this.keys.W.isDown) {
            // Up
            aimY = -1;
            if (velocityX === 0) aimX = 0; // Straight up if standing still
        } else if (this.keys.S.isDown) {
            // Down
            if (velocityX !== 0) {
                // Moving + Down = Diagonal Down
                aimY = 1;
            } else {
                // Stationary + Down
                if (onGround) {
                    nextProneState = true;
                    aimY = 0; // Aim horizontal
                } else {
                    // Air + Down = Aim Down
                    aimY = 1;
                    if (velocityX === 0) aimX = 0; // Straight down
                }
            }
        }

        // Update Aim Vector
        this.currentAim.set(aimX, aimY);
        if (this.currentAim.lengthSq() === 0) {
            this.currentAim.set(this.facingRight ? 1 : -1, 0);
        }

        // Handle Prone State Changes
        if (nextProneState !== this.isProne) {
            this.isProne = nextProneState;
            this.updateSize();
        }

        // Apply Movement
        if (this.isProne) velocityX = 0;
        this.body.setVelocityX(velocityX);

        // Jump
        if (this.keys.O.isDown && onGround && !this.isProne) {
            this.body.setVelocityY(this.jumpSpeed);
        }
    }

    private updateSize() {
        const targetW = this.isProne ? this.PRONE_SIZE.w : this.STANDING_SIZE.w;
        const targetH = this.isProne ? this.PRONE_SIZE.h : this.STANDING_SIZE.h;

        const currentH = this.body.height;
        const heightDiff = currentH - targetH;

        this.setSize(targetW, targetH);
        this.body.setSize(targetW, targetH);

        // Adjust Y to stay grounded
        this.y += heightDiff / 2;
    }

    private handleShooting() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) {
            const weapon = this.weapons[this.activeWeaponIndex];
            // Fire from center of player
            // You might want to offset this based on aim later
            weapon.fire(
                this.scene,
                this.x,
                this.y,
                this.currentAim,
                (this.scene as any).bullets // We'll need to ensure the scene exposes this or pass it in
            );
        }
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        console.log(`Player HP: ${this.hp}`);
        if (this.hp === 0) {
            // Handle death (restart level? go to menu?)
            console.log('Player Died');
            // For now, maybe just restart the scene
            this.scene.scene.restart();
        }
    }
}
