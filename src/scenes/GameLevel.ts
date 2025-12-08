import Phaser from 'phaser';

export class GameLevel extends Phaser.Scene {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private bullets!: Phaser.Physics.Arcade.Group;

  private aKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private oKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  private playerFacingRight: boolean = true;
  private currentAim: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

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
    this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.oKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  update() {
    const speed = 200;
    const jumpSpeed = -550;
    const onGround = this.player.body.touching.down;

    let velocityX = 0;
    let aimX = 0;
    let aimY = 0;
    let isProne = false;

    // 1. Determine Horizontal Movement & Facing
    if (this.aKey.isDown) {
      velocityX = -speed;
      this.playerFacingRight = false;
    } else if (this.dKey.isDown) {
      velocityX = speed;
      this.playerFacingRight = true;
    }
    // Else velocityX stays 0

    // 2. Determine Aim Direction & Prone State
    // Default aim is based on facing
    aimX = this.playerFacingRight ? 1 : -1;
    aimY = 0; // Default: horizontal

    if (this.wKey.isDown) {
      // Up pressed
      aimY = -1;
      if (velocityX === 0) {
        // Up Only (Standing Still) -> Aim Straight Up
        aimX = 0;
      }
      // If moving (velocityX != 0), aimX remains +/- 1 => Diagonal Up
    } else if (this.sKey.isDown) {
      // Down pressed
      if (velocityX !== 0) {
        // Moving + Down => Diagonal Down
        aimY = 1;
      } else {
        // Down Only (No horizontal input)
        if (onGround) {
          // Prone on ground
          isProne = true;
          // User Requirement: Shoot in direction of gaze (Horizontal)
          aimY = 0;
        } else {
          // Down in Air -> Aim Down (User Requirement: 8 directions in jump)
          aimY = 1;
          // If no horizontal input in air, aim straight down?
          // Defaulting to straight down if no X input makes sense for 8-way aim
          if (velocityX === 0) aimX = 0;
        }
      }
    }

    // Update Aim Vector
    this.currentAim.set(aimX, aimY);
    // Safety fallback: if 0,0 (unlikely with above logic), default to facing
    if (this.currentAim.lengthSq() === 0) {
      this.currentAim.set(this.playerFacingRight ? 1 : -1, 0);
    }

    // 3. Handle Prone Dimensions (Hitbox/Visuals)
    const currentW = this.player.body.width;
    const currentH = this.player.body.height;

    // Target dimensions
    let targetW = 32;
    let targetH = 64;

    if (isProne) {
      targetW = 64;
      targetH = 32;
    }

    if (currentW !== targetW || currentH !== targetH) {
      // Resize Visual (Shape)
      (this.player as any).setSize(targetW, targetH);
      // Resize Physics Body
      this.player.body.setSize(targetW, targetH);

      // Adjust Position (to keep bottom aligned on ground)
      // When height reduces (64 -> 32), center moves UP.
      // We need to move the sprite DOWN to keep feet planted.
      // Delta Height = Old - New. Shift = Delta / 2.
      // 64 - 32 = 32. 32 / 2 = 16. Y += 16.
      // When height increases (32 -> 64), center moves DOWN.
      // We need to move UP.
      // Delta = 32 - 64 = -32. Shift = -16. Y += -16.
      const heightDiff = currentH - targetH;
      this.player.y += heightDiff / 2;
    }

    // 4. Apply Movement
    // If prone, force velocity to 0 (though logic above ensures velocityX is 0 if no A/D input,
    // and prone only happens if no A/D input. Double check logic for safety.)
    if (isProne) {
        velocityX = 0;
    }
    this.player.body.setVelocityX(velocityX);

    // 5. Jump
    // Can only jump if on ground and NOT prone (unless we decide prone jump stands up)
    if (this.oKey.isDown && onGround && !isProne) {
      this.player.body.setVelocityY(jumpSpeed);
    }

    // Shoot
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
        this.fireBullet();
    }
  }

  private fireBullet() {
      // Create a bullet
      // Spawn roughly at center of player
      const x = this.player.x;
      const y = this.player.y;

      const bullet = this.add.circle(x, y, 5, 0xffffff) as any;
      this.physics.add.existing(bullet);
      this.bullets.add(bullet);

      const speed = 600;

      // Calculate velocity based on current aim
      const vec = this.currentAim.clone().normalize().scale(speed);

      bullet.body.setVelocity(vec.x, vec.y);
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
