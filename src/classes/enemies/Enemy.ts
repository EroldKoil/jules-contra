import Phaser from 'phaser';

export abstract class Enemy {
  public scene: Phaser.Scene;
  public sprite!: Phaser.GameObjects.Rectangle;
  public hp: number;
  public maxHp: number;
  protected hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number, color: number) {
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;

    // Visual: Rectangle
    this.sprite = scene.add.rectangle(x, y, 40, 60, color);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(600);
    body.setCollideWorldBounds(true);
    body.setImmovable(true);

    this.hpBar = scene.add.graphics();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_time?: number, _delta?: number) {
    if (this.hp <= 0) return;
    this.updateHpBar();
  }

  protected updateHpBar() {
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
        const originalColor = this.sprite.fillColor;
        this.sprite.fillColor = 0xffffff;
        this.scene.time.delayedCall(50, () => {
            if (this.sprite.active) this.sprite.fillColor = originalColor;
        });
    }
  }

  public destroy() {
    this.hpBar.destroy();
    this.sprite.destroy();
  }
}
