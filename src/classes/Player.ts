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
  private _isProne: boolean = false; // Internal variable
  private playerFacingRight: boolean = true;
  private currentAim: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

  // Invulnerability & Knockback
  private isInvulnerable: boolean = false;
  private isKnockedBack: boolean = false;
  private knockbackDuration: number = 500; // 0.5s

  // Death State
  private _isDead: boolean = false;

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

  get isDead(): boolean {
    return this._isDead;
  }

  get isProne(): boolean {
    return this._isProne;
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
    if (this.hp <= 0) {
        if (!this._isDead) {
            this.handleDeath();
        }
        return;
    }

    this.handleMovement();
    this.handleShooting(time, bulletGroup);
    this.updateHpBar();
  }

  private resizeBody(width: number, height: number) {
      if (this.sprite.body.width === width && this.sprite.body.height === height) {
          return;
      }

      // 1. Get current bottom Y (in world space)
      // body.y is top-left of the physics body
      const oldBottom = this.sprite.body.y + this.sprite.body.height;

      // 2. Resize Body
      this.sprite.body.setSize(width, height);
      this.sprite.body.setOffset((this.sprite.width - width) / 2, (this.sprite.height - height) / 2);

      // 3. Calculate new top-left Y based on old bottom, to keep feet anchored
      // newBottom (should be equal to oldBottom) = newY + newHeight
      // newY = oldBottom - newHeight

      const newY = oldBottom - height;

      // 4. Adjust Sprite Y
      // The body position is derived from sprite position.
      // body.y = sprite.y - (sprite.height * originY) + offset.y  (roughly)
      // But we can just move the sprite by the difference needed.

      // Let's look at current body.y after resize.
      // We want body.y to be `newY`.
      // The difference is `newY - this.sprite.body.y`.
      // We apply that diff to sprite.y

      const currentBodyY = this.sprite.body.y;
      const diff = newY - currentBodyY;

      this.sprite.y += diff;
  }

  private handleDeath() {
    this._isDead = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAcceleration(0, 0);

    this.sprite.play('player-die-process');
    this.resizeBody(23, 23);

    this.sprite.once('animationcomplete-player-die-process', () => {
        this.sprite.play('player-die');
        this.resizeBody(32, 10);
    });
  }

  private handleMovement() {
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
    this._isProne = false;

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

    if (this.keys.w.isDown) {
      aimY = -1;
      if (velocityX === 0) aimX = 0;
    } else if (this.keys.s.isDown) {
      if (velocityX !== 0) {
        aimY = 1;
      } else {
        if (onGround) {
          this._isProne = true;
          aimY = 0;
        } else {
          aimY = 1;
          aimX = 0;
        }
      }
    }

    this.currentAim.set(aimX, aimY);
    if (this.currentAim.lengthSq() === 0) {
      this.currentAim.set(this.playerFacingRight ? 1 : -1, 0);
    }

    // Physics Update
    if (this._isProne) velocityX = 0;
    body.setVelocityX(velocityX);

    // Jump
    if (this.keys.jump.isDown && onGround && !this._isProne) {
      body.setVelocityY(jumpSpeed);
    }

    // Drop Down
    if (this._isProne && Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
        this.isDropping = true;
        this.scene.time.delayedCall(300, () => {
            this.isDropping = false;
        });
    }

    // Animation & Body Size Logic
    if (this._isProne) {
        if (this.sprite.anims.currentAnim?.key !== 'player-lie') {
            this.sprite.play('player-lie', true);
            this.resizeBody(16, 32);
        }
    } else if (onGround) {
        if (velocityX !== 0) {
            // Run
            if (this.sprite.anims.currentAnim?.key !== 'player-run') {
                this.sprite.play('player-run', true);
                this.resizeBody(20, 35);
            }
        } else {
            // Idle
            if (this.sprite.anims.currentAnim?.key !== 'player-idle') {
                this.sprite.play('player-idle', true);
                this.resizeBody(23, 34);
            }
        }
    } else {
        // Air / Jump
        if (this.sprite.anims.currentAnim?.key !== 'player-jump') {
            this.sprite.play('player-jump', true);
            this.resizeBody(20, 20);
        }
    }
  }

  private handleShooting(time: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    if (this.isKnockedBack) return;

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

    this.hpBar.fillStyle(0x000000);
    this.hpBar.fillRect(x, y, width, 4);

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x00ff00);
    this.hpBar.fillRect(x, y, width * hpPercent, 4);
  }

  public takeDamage(amount: number, sourceX: number, sourceY: number) {
    if (this.isInvulnerable || this._isDead) return;

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
    } else {
      this.startInvulnerability(sourceX, sourceY);
    }
  }

  private startInvulnerability(sourceX: number, sourceY: number) {
      this.isInvulnerable = true;
      this.isKnockedBack = true;

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
