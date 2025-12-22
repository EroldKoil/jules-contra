import Phaser from 'phaser';
import { Weapon } from './Weapon';

export class Player {
  public scene: Phaser.Scene;
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public weapons: Weapon[] = [];
  public currentWeaponIndex: number = 0;

  public hp: number;
  public maxHp: number;

  public isDropping: boolean = false;

  private hpBar: Phaser.GameObjects.Graphics;
  private isProne: boolean = false;
  private playerFacingRight: boolean = true;
  private currentAim: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

  // Invulnerability & Knockback
  private isInvulnerable: boolean = false;
  private isKnockedBack: boolean = false;
  private knockbackDuration: number = 500; // 0.5s

  // Death State
  private isDead: boolean = false;

  // Input keys
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    prevWeapon: Phaser.Input.Keyboard.Key;
    nextWeapon: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number, maxHp: number) {
    this.scene = scene;
    this.maxHp = maxHp;
    this.hp = maxHp;

    // Create Animations
    this.createAnimations();

    // Create Sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player', 'idle_0');
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setGravityY(600);

    // Initial Body Size (Idle: ~23x34)
    this.sprite.body.setSize(23, 34);

    // HP Bar
    this.hpBar = scene.add.graphics();

    // Inputs
    const keyboard = scene.input.keyboard!;
    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      fire: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      prevWeapon: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      nextWeapon: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
  }

  private createAnimations() {
    if (!this.scene.anims.exists('player-idle')) {
      this.scene.anims.create({
        key: 'player-idle',
        frames: this.scene.anims.generateFrameNames('player', { prefix: 'idle_', start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists('player-run')) {
        this.scene.anims.create({
          key: 'player-run',
          frames: this.scene.anims.generateFrameNames('player', { prefix: 'run_', start: 0, end: 5 }),
          frameRate: 10,
          repeat: -1
        });
    }

    if (!this.scene.anims.exists('player-jump')) {
        this.scene.anims.create({
            key: 'player-jump',
            frames: this.scene.anims.generateFrameNames('player', { prefix: 'jump_', start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
    }

    if (!this.scene.anims.exists('player-die-process')) {
        this.scene.anims.create({
            key: 'player-die-process',
            frames: this.scene.anims.generateFrameNames('player', { prefix: 'die-process_', start: 0, end: 3 }),
            frameRate: 8,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('player-die')) {
        this.scene.anims.create({
            key: 'player-die',
            frames: [{ key: 'player', frame: 'die' }],
            frameRate: 1,
            repeat: -1
        });
    }

    // Lie (single frame, but can be an animation for consistency)
    if (!this.scene.anims.exists('player-lie')) {
        this.scene.anims.create({
            key: 'player-lie',
            frames: [{ key: 'player', frame: 'lie' }],
            frameRate: 1,
            repeat: -1
        });
    }
  }

  addWeapon(weapon: Weapon) {
    this.weapons.push(weapon);
  }

  update(time: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    // If dead, ensure we handle the death animation logic
    if (this.hp <= 0) {
        if (!this.isDead) {
            this.handleDeath();
        }
        return;
    }

    this.handleMovement();
    this.handleShooting(time, bulletGroup);
    this.updateHpBar();
  }

  private handleDeath() {
    this.isDead = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAcceleration(0, 0);

    // Play die process
    this.sprite.play('player-die-process');

    // Update size for death animation if needed (23x23)
    this.sprite.body.setSize(23, 23);
    // Align?
    // The previous size was likely larger, so we might want to adjust offset or y to keep feet on ground.
    // Phaser usually handles anchor at 0.5, 0.5.

    this.sprite.once('animationcomplete-player-die-process', () => {
        this.sprite.play('player-die');
        // Die frame size 32x10
        this.sprite.body.setSize(32, 10);
        // Adjust Y to lay on ground properly?
        // Since anchor is center, changing size might make it float or sink.
        // We'll trust Phaser's center alignment for now or user can refine.
    });
  }

  private handleMovement() {
    // If knocked back, player loses control
    if (this.isKnockedBack) {
        return;
    }

    const speed = 200;
    const jumpSpeed = -550;
    const body = this.sprite.body;
    const onGround = body.touching.down || body.blocked.down;

    let velocityX = 0;
    let aimX = 0;
    let aimY = 0;
    this.isProne = false;

    // Horizontal Input
    if (this.keys.a.isDown) {
      velocityX = -speed;
      this.playerFacingRight = false;
    } else if (this.keys.d.isDown) {
      velocityX = speed;
      this.playerFacingRight = true;
    }

    // Facing
    this.sprite.setFlipX(!this.playerFacingRight);

    // Aiming & Prone
    aimX = this.playerFacingRight ? 1 : -1;
    aimY = 0;

    if (this.keys.w.isDown) { // UP
      aimY = -1;
      if (velocityX === 0) aimX = 0;
    } else if (this.keys.s.isDown) { // DOWN
      if (velocityX !== 0) {
        aimY = 1; // Diagonal Down
      } else {
        if (onGround) {
          this.isProne = true;
          aimY = 0; // Prone shoot horizontal
        } else {
          aimY = 1; // Air down
          aimX = 0; // Straight down
        }
      }
    }

    this.currentAim.set(aimX, aimY);
    if (this.currentAim.lengthSq() === 0) {
      this.currentAim.set(this.playerFacingRight ? 1 : -1, 0);
    }

    // Physics Update
    if (this.isProne) velocityX = 0;
    body.setVelocityX(velocityX);

    // Jump
    // Normal Jump
    if (this.keys.jump.isDown && onGround && !this.isProne) {
      body.setVelocityY(jumpSpeed);
    }

    // Drop Down (Prone + Jump)
    if (this.isProne && Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
        this.isDropping = true;
        this.scene.time.delayedCall(300, () => {
            this.isDropping = false;
        });
    }

    // Animation & Body Size Logic
    if (this.isProne) {
        // Crouch/Lie
        if (this.sprite.anims.currentAnim?.key !== 'player-lie') {
            this.sprite.play('player-lie', true);
            // Lie size: 16x32 (based on json frame size in original request, user verified "Lie: 16x32")
            // Actually JSON says lie frame is w:16, h:32? Let's recheck memory/json if possible.
            // JSON memory: "lie": { "frame": { "x": 50, "y": 35, "w": 16, "h": 32 }... }
            this.sprite.body.setSize(16, 32);
            // Offset might be needed to center it
            this.sprite.body.setOffset((this.sprite.width - 16) / 2, (this.sprite.height - 32) / 2);
        }
    } else if (onGround) {
        if (velocityX !== 0) {
            // Run
            if (this.sprite.anims.currentAnim?.key !== 'player-run') {
                this.sprite.play('player-run', true);
                // Run frame size ~20x35
                this.sprite.body.setSize(20, 35);
                this.sprite.body.setOffset((this.sprite.width - 20) / 2, (this.sprite.height - 35) / 2);
            }
        } else {
            // Idle
            if (this.sprite.anims.currentAnim?.key !== 'player-idle') {
                this.sprite.play('player-idle', true);
                // Idle frame size ~23x34
                this.sprite.body.setSize(23, 34);
                this.sprite.body.setOffset((this.sprite.width - 23) / 2, (this.sprite.height - 34) / 2);
            }
        }
    } else {
        // Air / Jump
        if (this.sprite.anims.currentAnim?.key !== 'player-jump') {
            this.sprite.play('player-jump', true);
             // Jump frame size ~20x20
            this.sprite.body.setSize(20, 20);
            this.sprite.body.setOffset((this.sprite.width - 20) / 2, (this.sprite.height - 20) / 2);
        }
    }
  }

  private handleShooting(time: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    if (this.isKnockedBack) return;

    // Weapon Switch
    const weaponCount = this.weapons.length;
    if (weaponCount > 0) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.prevWeapon)) {
        this.currentWeaponIndex = (this.currentWeaponIndex - 1 + weaponCount) % weaponCount;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.nextWeapon)) {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % weaponCount;
      }
    }

    if (this.currentWeaponIndex >= this.weapons.length) this.currentWeaponIndex = 0;

    // Fire
    if (this.keys.fire.isDown) {
      const weapon = this.weapons[this.currentWeaponIndex];
      if (weapon && weapon.canFire(time)) {
        const x = this.sprite.body.center.x;
        const y = this.sprite.body.center.y;

        weapon.fire(this.scene, x, y, this.currentAim, bulletGroup, time);
      }
    }
  }

  private updateHpBar() {
    this.hpBar.clear();
    const x = this.sprite.body.x;
    const y = this.sprite.body.y - 10;
    const width = this.sprite.body.width;

    // Background
    this.hpBar.fillStyle(0x000000);
    this.hpBar.fillRect(x, y, width, 4);

    // Foreground
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x00ff00);
    this.hpBar.fillRect(x, y, width * hpPercent, 4);
  }

  public takeDamage(amount: number, sourceX: number, sourceY: number) {
    if (this.isInvulnerable || this.isDead) return;

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      // Death handled in update loop
    } else {
      this.startInvulnerability(sourceX, sourceY);
    }
  }

  private startInvulnerability(sourceX: number, sourceY: number) {
      this.isInvulnerable = true;
      this.isKnockedBack = true;

      // Knockback Logic
      const playerCenter = this.sprite.body.center;
      const dx = playerCenter.x - sourceX;
      const dy = playerCenter.y - sourceY;

      const knockbackVector = new Phaser.Math.Vector2(dx, dy).normalize();

      if (knockbackVector.lengthSq() === 0) {
          knockbackVector.set(0, -1);
      }

      const force = 300;
      if (knockbackVector.y > -0.2) knockbackVector.y = -0.5;
      knockbackVector.normalize().scale(force);

      this.sprite.body.setVelocity(knockbackVector.x, knockbackVector.y);

      // Flickering Effect
      this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.2,
          duration: 50,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
              this.sprite.alpha = 1;
              this.isInvulnerable = false;
          }
      });

      this.scene.time.delayedCall(this.knockbackDuration, () => {
          this.isKnockedBack = false;
      });
  }
}
