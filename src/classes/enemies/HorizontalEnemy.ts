import Phaser from 'phaser';
import { Enemy } from './Enemy';

export type FacingDirection = 'left' | 'right';

export class HorizontalEnemy extends Enemy {
  private facing: FacingDirection;
  private range: number = 500;
  private lastFired: number = 0;
  private fireInterval: number = 2000;
  private playerReference?: Phaser.GameObjects.GameObject;
  private bulletGroup?: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number, facing: FacingDirection) {
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

    if (time > this.lastFired + this.fireInterval) {
        if (this.canSeePlayer()) {
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

      // 1. Distance Check
      const dist = Phaser.Math.Distance.Between(myBody.center.x, myBody.center.y, playerBody.center.x, playerBody.center.y);
      if (dist > this.range) return false;

      // 2. Direction Check (In front?)
      if (this.facing === 'left') {
          // Player must be to the left (player.x < my.x)
          if (playerBody.center.x >= myBody.center.x) return false;
      } else {
          // Player must be to the right (player.x > my.x)
          if (playerBody.center.x <= myBody.center.x) return false;
      }

      // 3. Vertical Alignment (Y-axis overlap)
      // Overlap occurs if one's bottom is below the other's top AND one's top is above the other's bottom
      // Phaser coordinates: y increases downwards.
      // bottom > top AND top < bottom
      const yOverlap = (playerBody.bottom > myBody.top) && (playerBody.top < myBody.bottom);

      return yOverlap;
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
          body.setAllowGravity(false);

          // Calculate velocity
          const speed = 300;
          const velocityX = this.facing === 'left' ? -speed : speed;
          body.setVelocity(velocityX, 0);

          bullet.setData('damage', 10);
          bullet.setData('isEnemyBullet', true);
      }
  }
}
