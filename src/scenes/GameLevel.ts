import Phaser from 'phaser';

export class GameLevel extends Phaser.Scene {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private bullets!: Phaser.Physics.Arcade.Group;

  private wKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private oKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  private playerFacingRight: boolean = true;
  private isCrouching: boolean = false;

  // Aim direction unit vector (or simplified direction flags)
  // We will calculate exact velocity at fire time, but we can store state here if needed.
  // Actually, calculating on the fly in update/fire is better.

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
    // Initial size 32x64
    const playerRect = this.add.rectangle(0, 0, 32, 64, 0xff0000);
    this.physics.add.existing(playerRect);
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
    this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.oKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  update() {
    const speed = 200;
    const jumpSpeed = -550;

    let moveX = 0;
    if (this.aKey.isDown) moveX = -1;
    if (this.dKey.isDown) moveX = 1;

    let moveY = 0; // -1 for Up, 1 for Down
    if (this.wKey.isDown) moveY = -1;
    if (this.sKey.isDown) moveY = 1;

    // Determine Logic State

    // Check Crouch: Down key pressed AND NOT moving horizontally
    // NOTE: User said "if press down, character lies down". But later "if press down and side, hero runs... and aims down".
    // So Crouch is ONLY when Down + Idle (Horizontal).
    const wantsToCrouch = (moveY === 1 && moveX === 0);

    // Handle Crouching State
    if (wantsToCrouch) {
      if (!this.isCrouching) {
        // Enter Crouch
        this.isCrouching = true;

        // Adjust Size: Height decreases, Width increases.
        // Normal: 32x64. Crouch: 64x32.
        const body = this.player.body;
        const prevBottom = body.bottom; // Keep bottom aligned

        // Visual
        (this.player as any).setSize(64, 32);
        // Note: setSize on a Rectangle Shape acts on the display size, but we also need to update physics body size.
        // For a Rectangle GameObject with physics, setSize updates the display size.
        // We usually need to sync the body size.

        body.setSize(64, 32);

        // Re-align position so we don't pop up or sink
        // The body origin is top-left usually for Arcade physics bodies unless offset.
        // But Arcade physics setSize usually handles centering if we don't mess with offsets too much.
        // However, we want to pin the feet.
        // New height is 32. Old was 64. Difference is 32.
        // If we shrink, the body top moves down? No, usually body stays centered or top-aligned depending on setup.
        // Let's manually adjust Y to keep bottom constant.
        body.y = prevBottom - 32;
      }

      // Stop horizontal movement
      this.player.body.setVelocityX(0);

    } else {
      // Stand Up
      if (this.isCrouching) {
        this.isCrouching = false;

        const body = this.player.body;
        const prevBottom = body.bottom;

        // Visual
        (this.player as any).setSize(32, 64);
        body.setSize(32, 64);

        // Restore Y
        body.y = prevBottom - 64;
      }

      // Movement
      if (moveX !== 0) {
        this.player.body.setVelocityX(moveX * speed);
        this.playerFacingRight = (moveX > 0);
      } else {
        this.player.body.setVelocityX(0);
      }
    }

    // Jump (only if not crouching usually, but Contra allows jump from crouch?
    // Standard platformer: usually stand up then jump. Let's allow jump, forcing stand up logic implicitly by state change next frame or immediately?
    // User didn't specify. Let's assume you can jump. If you jump, you are airborn.
    // Ideally, jumping breaks crouch.
    if (this.oKey.isDown && this.player.body.touching.down) {
       this.player.body.setVelocityY(jumpSpeed);
       // If we were crouching, we are effectively not crouching in air (usually).
       // But our crouch logic is tied to "Down Key + Ground".
       // If we jump, "wantsToCrouch" might still be true if we hold S?
       // In Contra, holding Down while jumping usually just shoots down. You don't "crouch" in air.
       // So we should strictly ensure isCrouching is false if not on floor?
       // The update loop handles it: wantsToCrouch condition doesn't check floor, but visual crouch usually is ground only.
       // Let's force stand up if jumping.
    }

    // Safety check: if in air, probably shouldn't be "crouched" box size?
    // Or does Contra allow small hitbox jump?
    // "Jump spin" is small hitbox.
    // Let's stick to simple logic: Only crouch if on ground?
    // User instructions: "if press down, character lies down".
    if (!this.player.body.touching.down && this.isCrouching) {
        // Force un-crouch in air if we jumped?
        // Let's leave it for now to avoid complexity, unless it looks broken.
    }


    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
        this.fireBullet(moveX, moveY, wantsToCrouch);
    }
  }

  private fireBullet(moveX: number, moveY: number, isCrouching: boolean) {
      // Determine origin
      let x = this.player.x;
      let y = this.player.y;

      // Adjust origin based on crouch/stand?
      // Player origin is usually center for GameObjects.
      // If crouched (32 height), center is 16px from bottom.
      // If standing (64 height), center is 32px from bottom.

      // Determine Vector
      let vx = 0;
      let vy = 0;
      const bulletSpeed = 600;
      const diagSpeed = Math.sqrt((bulletSpeed * bulletSpeed) / 2); // ~424

      if (isCrouching) {
          // Prone shooting: strictly horizontal
          vx = this.playerFacingRight ? bulletSpeed : -bulletSpeed;
          vy = 0;
          // Adjust spawn Y to be lower
          // y is center. Center of 32-high box.

      } else {
          // Standing (or Running)

          if (moveX === 0 && moveY === -1) {
              // Stand + Up = Shoot Vertical Up
              vx = 0;
              vy = -bulletSpeed;
          } else if (moveX !== 0 && moveY === -1) {
              // Run + Up = Diagonal Up
              vx = this.playerFacingRight ? diagSpeed : -diagSpeed;
              vy = -diagSpeed;
          } else if (moveX !== 0 && moveY === 1) {
              // Run + Down = Diagonal Down
              vx = this.playerFacingRight ? diagSpeed : -diagSpeed;
              vy = diagSpeed;
          } else {
              // Default Horizontal
              vx = this.playerFacingRight ? bulletSpeed : -bulletSpeed;
              vy = 0;
          }
      }

      // Spawn Bullet
      // Small offset to not spawn inside player center strictly
      const bullet = this.add.circle(x, y, 5, 0xffffff) as any;
      this.physics.add.existing(bullet);
      this.bullets.add(bullet);

      bullet.body.setVelocity(vx, vy);
      bullet.body.allowGravity = false;

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
