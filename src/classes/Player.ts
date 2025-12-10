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

  // Input keys
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    switch1: Phaser.Input.Keyboard.Key;
    switch2: Phaser.Input.Keyboard.Key;
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
      switch1: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      switch2: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
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
    const speed = 200;
    const jumpSpeed = -550;
    const body = this.sprite.body;
    const onGround = body.touching.down || body.blocked.down; // blocked check is safer for world bounds

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
    // Weapon Switch
    if (Phaser.Input.Keyboard.JustDown(this.keys.switch1)) this.currentWeaponIndex = 0;
    if (Phaser.Input.Keyboard.JustDown(this.keys.switch2)) this.currentWeaponIndex = 1;

    // Clamp index
    if (this.currentWeaponIndex >= this.weapons.length) this.currentWeaponIndex = 0;

    // Fire
    if (this.keys.fire.isDown) {
      const weapon = this.weapons[this.currentWeaponIndex];
      if (weapon && weapon.canFire(time)) {
        // Origin: center of player
        const x = this.sprite.body.center.x;
        const y = this.sprite.body.center.y;

        // Adjust for prone if needed? Center is usually fine.

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

  public takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.sprite.setTint(0x555555); // Dead visual
      // Disable body?
      // this.sprite.disableBody(true, false);
    } else {
      // Flash red
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => this.sprite.clearTint());
    }
  }
}
