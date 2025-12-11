import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class RangedEnemy extends Enemy {
  private lastFired: number = 0;
  private fireInterval: number = 2000;
  private playerReference?: Phaser.GameObjects.GameObject;
  private bulletGroup?: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number) {
    super(scene, x, y, hp, 0x800080); // Purple
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
        this.fire();
        this.lastFired = time;
    }
  }

  private fire() {
      if (!this.playerReference || !this.bulletGroup) return;

      const playerBody = this.playerReference.body as Phaser.Physics.Arcade.Body;
      const myBody = this.sprite.body as Phaser.Physics.Arcade.Body;

      if (!playerBody || !myBody) return;

      const startX = myBody.center.x;
      const startY = myBody.center.y;
      const targetX = playerBody.center.x;
      const targetY = playerBody.center.y;

      const bullet = this.bulletGroup.create(startX, startY); // No key, let it use default classType (Arc)

      if (bullet) {
          if (bullet instanceof Phaser.GameObjects.Arc) {
             bullet.setRadius(5);
             bullet.setFillStyle(0x800080); // Purple bullet
          } else {
             (bullet as any).setTint(0x800080);
          }

          // Physics
          this.scene.physics.add.existing(bullet);
          const body = bullet.body as Phaser.Physics.Arcade.Body;
          body.setAllowGravity(false);

          // Calculate velocity
          const speed = 300;
          const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
          this.scene.physics.velocityFromRotation(angle, speed, body.velocity);

          bullet.setData('damage', 10);
          bullet.setData('isEnemyBullet', true);
      }
  }
}
