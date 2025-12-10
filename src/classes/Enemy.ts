import Phaser from 'phaser';

export class Enemy {
  public scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Rectangle;
  public hp: number;
  public maxHp: number;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number) {
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;

    // Visual: Orange Rectangle
    this.sprite = scene.add.rectangle(x, y, 40, 60, 0xffa500);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(600);
    body.setCollideWorldBounds(true);
    // Stationary but needs to collide, so maybe set immovable?
    // body.setImmovable(true); // If we don't want player pushing it around
    // But gravity needs to work so it falls to platform.
    // Usually standard Arcade Physics body is fine, just don't set velocity.
    // To make it truly immovable by collisions but affected by gravity:
    // body.pushable = false; // Property is 'pushable' in some versions, or setPushable method?
    // In Phaser 3 Arcade Physics, body.pushable is a property on Body.
    // However, TypeScript definitions might vary.
    // Let's check if we can cast or just set immovable for now which is safer.
    // Ideally we want it to fall but not be pushed.
    // body.setImmovable(true) stops gravity usually? No, setImmovable(true) means velocity is not affected by collisions. Gravity still applies unless allowGravity is false.
    body.setImmovable(true);

    this.hpBar = scene.add.graphics();
  }

  update() {
    if (this.hp <= 0) return;
    this.updateHpBar();
  }

  private updateHpBar() {
    this.hpBar.clear();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const x = body.x;
    const y = body.y - 10;
    const width = body.width;

    this.hpBar.fillStyle(0x000000);
    this.hpBar.fillRect(x, y, width, 4);

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0xff0000); // Enemy Health Red
    this.hpBar.fillRect(x, y, width * hpPercent, 4);
  }

  public takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
    } else {
        this.sprite.fillColor = 0xffffff;
        this.scene.time.delayedCall(50, () => {
            if (this.sprite.active) this.sprite.fillColor = 0xffa500;
        });
    }
  }

  public destroy() {
    this.hpBar.destroy();
    this.sprite.destroy();
  }
}
