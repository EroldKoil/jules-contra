import Phaser from 'phaser';
import { Weapon } from './Weapon';

export class Player {
  public scene: Phaser.Scene;
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public weapons: Weapon[] = [];
  public currentWeaponIndex: number = 0;

  public hp: number;
  public maxHp: number;

  private hpBar: Phaser.GameObjects.Graphics;
  private isProne: boolean = false;
  private playerFacingRight: boolean = true;
  private currentAim: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

  // Invulnerability & Knockback
  private isInvulnerable: boolean = false;
  private isKnockedBack: boolean = false;
  private knockbackDuration: number = 500; // 0.5s

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

    // Create Sprite (using Rectangle for now)
    const playerRect = scene.add.rectangle(x, y, 32, 64, 0xff0000);
    scene.physics.add.existing(playerRect);
    this.sprite = playerRect as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setGravityY(600);

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

  addWeapon(weapon: Weapon) {
    this.weapons.push(weapon);
  }

  update(time: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    if (this.hp <= 0) return; // Dead?

    this.handleMovement();
    this.handleShooting(time, bulletGroup);
    this.updateHpBar();
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

    // Prone Physics/Visuals
    const currentW = body.width;
    const currentH = body.height;
    let targetW = 32;
    let targetH = 64;

    if (this.isProne) {
      targetW = 64;
      targetH = 32;
    }

    if (currentW !== targetW || currentH !== targetH) {
      (this.sprite as any).setSize(targetW, targetH);
      body.setSize(targetW, targetH);

      const heightDiff = currentH - targetH;
      this.sprite.y += heightDiff / 2;
    }

    if (this.isProne) velocityX = 0;
    body.setVelocityX(velocityX);

    // Jump
    if (this.keys.jump.isDown && onGround && !this.isProne) {
      body.setVelocityY(jumpSpeed);
    }
  }

  private handleShooting(time: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    // If knocked back, maybe prevent shooting too? Original request only mentioned "lose control".
    // Usually knockback prevents all actions.
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

    // Clamp index
    if (this.currentWeaponIndex >= this.weapons.length) this.currentWeaponIndex = 0;

    // Fire
    if (this.keys.fire.isDown) {
      const weapon = this.weapons[this.currentWeaponIndex];
      if (weapon && weapon.canFire(time)) {
        // Origin: center of player
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
    if (this.isInvulnerable) return;

    this.hp -= amount;

    // Check death
    if (this.hp <= 0) {
      this.hp = 0;
      this.sprite.setTint(0x555555);
      // Handle death callback if needed, handled in GameLevel
    } else {
      // Trigger Invulnerability & Knockback
      this.startInvulnerability(sourceX, sourceY);
    }
  }

  private startInvulnerability(sourceX: number, sourceY: number) {
      this.isInvulnerable = true;
      this.isKnockedBack = true;

      // Knockback Logic
      // Calculate direction from source to player
      const playerCenter = this.sprite.body.center;
      const dx = playerCenter.x - sourceX;
      const dy = playerCenter.y - sourceY;

      const knockbackVector = new Phaser.Math.Vector2(dx, dy).normalize();

      // If perfectly overlapped, push random or up
      if (knockbackVector.lengthSq() === 0) {
          knockbackVector.set(0, -1);
      }

      // Apply force
      const force = 300;
      // Usually knockback has an upward component to lift off ground slightly
      // So we can bias Y slightly up
      if (knockbackVector.y > -0.2) knockbackVector.y = -0.5; // Ensure some lift
      knockbackVector.normalize().scale(force);

      this.sprite.body.setVelocity(knockbackVector.x, knockbackVector.y);

      // Flickering Effect
      this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.2,
          duration: 50,
          yoyo: true,
          repeat: 4, // 50ms * 2 * 5 = 500ms approx
          onComplete: () => {
              this.sprite.alpha = 1;
              this.isInvulnerable = false;
          }
      });

      // Reset Control
      this.scene.time.delayedCall(this.knockbackDuration, () => {
          this.isKnockedBack = false;
      });
  }
}
