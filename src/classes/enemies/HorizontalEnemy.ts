import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class HorizontalEnemy extends Enemy {
  private lastFired: number = 0;
  private fireInterval: number = 1500;
  private playerReference?: Phaser.GameObjects.GameObject;
  private bulletGroup?: Phaser.Physics.Arcade.Group;
  private facing: 'left' | 'right';
  private sightRange: number = 500;
  private verticalThreshold: number = 50; // Roughly same height

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number, facing: 'left' | 'right' = 'left') {
    super(scene, x, y, hp, 0x00FFFF); // Cyan
    this.facing = facing;
  }

  public setTarget(player: Phaser.GameObjects.GameObject) {
      this.playerReference = player;
  }

  public setBulletGroup(group: Phaser.Physics.Arcade.Group) {
      this.bulletGroup = group;
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    if (this.hp <= 0) return;

    if (this.canSeePlayer()) {
        if (time > this.lastFired + this.fireInterval) {
            this.fire();
            this.lastFired = time;
        }
    }
  }

  private canSeePlayer(): boolean {
      if (!this.playerReference) return false;
      const playerBody = this.playerReference.body as Phaser.Physics.Arcade.Body;
      const myBody = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (!playerBody || !myBody) return false;

      // 1. Vertical Alignment Check
      const dy = Math.abs(playerBody.center.y - myBody.center.y);
      if (dy > this.verticalThreshold) return false;

      // 2. Horizontal Distance Check
      const dx = playerBody.center.x - myBody.center.x; // + if player is right, - if left
      const dist = Math.abs(dx);
      if (dist > this.sightRange) return false;

      // 3. Direction Check
      // If facing right, dx must be positive
      // If facing left, dx must be negative
      if (this.facing === 'right' && dx < 0) return false;
      if (this.facing === 'left' && dx > 0) return false;

      return true;
  }

  private fire() {
      if (!this.bulletGroup) return;

      const myBody = this.sprite.body as Phaser.Physics.Arcade.Body;
      const startX = myBody.center.x;
      const startY = myBody.center.y;

      const bullet = this.bulletGroup.create(startX, startY);

      if (bullet) {
          if (bullet instanceof Phaser.GameObjects.Arc) {
             bullet.setRadius(5);
             bullet.setFillStyle(0x00FFFF); // Cyan bullet
          } else {
             (bullet as any).setTint(0x00FFFF);
          }

          // Physics
          this.scene.physics.add.existing(bullet);
          const body = bullet.body as Phaser.Physics.Arcade.Body;
          body.setAllowGravity(false); // Horizontal only
          body.setCircle(5); // Explicit collision size

          // Calculate velocity
          const speed = 400;
          const direction = this.facing === 'right' ? 1 : -1;

          body.setVelocity(speed * direction, 0);

          bullet.setData('damage', 10);
          bullet.setData('isEnemyBullet', true);
      }
  }
}
