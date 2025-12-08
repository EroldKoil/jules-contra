import Phaser from 'phaser';

export class GameLevel extends Phaser.Scene {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private bullets!: Phaser.Physics.Arcade.Group;

  private aKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private oKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  private playerFacingRight: boolean = true;

  constructor() {
    super('GameLevel');
  }

  create() {
    // Set world bounds
    const width = this.scale.width;
    const height = this.scale.height;
    const worldWidth = width * 5;
    this.physics.world.setBounds(0, 0, worldWidth, height);

    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(worldWidth / 2, height - 32, worldWidth, 64, 0x00ff00);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    this.createPlatforms(worldWidth, height);

    // Player
    const playerRect = this.add.rectangle(0, 0, 32, 64, 0xff0000);
    this.physics.add.existing(playerRect);
    // Cast to unknown first to avoid TS collision since we are treating a Shape as a Sprite-like physics object
    this.player = playerRect as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.player.body.setCollideWorldBounds(true);
    this.player.setPosition(100, height - 150);
    this.player.body.setGravityY(600);

    // Bullets group
    this.bullets = this.physics.add.group({
      classType: Phaser.GameObjects.Arc,
      runChildUpdate: true
    });

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, (bullet, _platform) => {
      bullet.destroy();
    });

    // Camera
    this.cameras.main.setBounds(0, 0, worldWidth, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Inputs
    // We only need A, D, O, I for now based on logic used
    this.aKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.oKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  update() {
    const speed = 200;
    const jumpSpeed = -550;

    // Movement
    if (this.aKey.isDown) {
      this.player.body.setVelocityX(-speed);
      this.playerFacingRight = false;
    } else if (this.dKey.isDown) {
      this.player.body.setVelocityX(speed);
      this.playerFacingRight = true;
    } else {
      this.player.body.setVelocityX(0);
    }

    // Jump
    if (this.oKey.isDown && this.player.body.touching.down) {
      this.player.body.setVelocityY(jumpSpeed);
    }

    // Shoot
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
        this.fireBullet();
    }
  }

  private fireBullet() {
      // Create a bullet
      const x = this.player.x + (this.playerFacingRight ? 20 : -20);
      const y = this.player.y;

      const bullet = this.add.circle(x, y, 5, 0xffffff) as any;
      this.physics.add.existing(bullet);
      this.bullets.add(bullet);

      const speed = 600;
      bullet.body.setVelocityX(this.playerFacingRight ? speed : -speed);
      bullet.body.allowGravity = false;

      // Auto destroy after 2 seconds
      this.time.delayedCall(2000, () => {
          if (bullet.active) bullet.destroy();
      });
  }

  private createPlatforms(worldWidth: number, height: number) {
    for (let x = 400; x < worldWidth - 200; x += 300) {
      const y = Phaser.Math.Between(height - 250, height - 150);
      const w = Phaser.Math.Between(100, 200);

      const platform = this.add.rectangle(x, y, w, 32, 0x0000ff);
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    }
    for (let x = 600; x < worldWidth - 200; x += 500) {
        const y = Phaser.Math.Between(height - 450, height - 350);
        const w = Phaser.Math.Between(100, 150);

        const platform = this.add.rectangle(x, y, w, 32, 0x0000ff);
        this.physics.add.existing(platform, true);
        this.platforms.add(platform);
    }
  }
}
