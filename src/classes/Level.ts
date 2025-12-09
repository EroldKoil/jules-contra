import Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Weapon, WeaponConfig } from './Weapon';

export interface LevelConfig {
    id: number;
    platforms: { x: number, y: number, w: number, h: number }[];
    enemies: { x: number, y: number }[];
    endZone: { x: number, y: number, w: number, h: number };
    nextLevelId?: number; // Null if it's the last level
}

export class Level {
    private config: LevelConfig;
    private scene: Phaser.Scene;

    // Exposed groups for collision handling in the scene
    public platformsGroup!: Phaser.Physics.Arcade.StaticGroup;
    public enemiesGroup!: Phaser.Physics.Arcade.Group;
    public endZone!: Phaser.GameObjects.Zone;
    public player!: Player;
    public bulletsGroup!: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene, config: LevelConfig) {
        this.scene = scene;
        this.config = config;
    }

    public create() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const worldWidth = width * 5; // Fixed large world for now

        // 1. Setup World
        this.scene.physics.world.setBounds(0, 0, worldWidth, height);
        this.scene.cameras.main.setBounds(0, 0, worldWidth, height);

        // 2. Create Groups
        this.platformsGroup = this.scene.physics.add.staticGroup();
        this.enemiesGroup = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.bulletsGroup = this.scene.physics.add.group({
            classType: Phaser.GameObjects.Arc,
            runChildUpdate: true
        });
        // We attach bullets group to scene so Player can find it easily if needed,
        // though Player.ts logic currently expects us to pass it.
        (this.scene as any).bullets = this.bulletsGroup;

        // 3. Build Platforms
        // Add a base ground for all levels
        const ground = this.scene.add.rectangle(worldWidth / 2, height - 32, worldWidth, 64, 0x00ff00);
        this.scene.physics.add.existing(ground, true);
        this.platformsGroup.add(ground);

        this.config.platforms.forEach(p => {
            const platform = this.scene.add.rectangle(p.x, p.y, p.w, p.h, 0x0000ff);
            this.scene.physics.add.existing(platform, true);
            this.platformsGroup.add(platform);
        });

        // 4. Spawn Enemies
        this.config.enemies.forEach(e => {
            const enemy = new Enemy(this.scene, e.x, e.y);
            this.enemiesGroup.add(enemy);
        });

        // 5. Create End Zone
        // Visual representation
        const ez = this.config.endZone;
        this.scene.add.rectangle(ez.x, ez.y, ez.w, ez.h, 0xffff00); // Yellow
        // Physics Zone
        this.endZone = this.scene.add.zone(ez.x, ez.y, ez.w, ez.h);
        this.scene.physics.add.existing(this.endZone, true);

        // 6. Create Player
        // Define Weapons
        const weapon1Config: WeaponConfig = {
            name: "Machine Gun",
            fireRate: 100,
            bulletSpeed: 600,
            penetratesWalls: false,
            damage: 10,
            range: 400,
            projectileCount: 1,
            spread: 0
        };

        const weapon2Config: WeaponConfig = {
            name: "Shotgun",
            fireRate: 800,
            bulletSpeed: 500,
            penetratesWalls: false, // Maybe shotgun shouldn't penetrate?
            damage: 20,
            range: 250,
            projectileCount: 5,
            spread: 30
        };

        const w1 = new Weapon(weapon1Config);
        const w2 = new Weapon(weapon2Config);

        this.player = new Player(this.scene, 100, height - 150, [w1, w2]);
        this.scene.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 7. Setup Collisions
        this.setupCollisions();
    }

    private setupCollisions() {
        // Player vs Platforms
        this.scene.physics.add.collider(this.player, this.platformsGroup);

        // Enemies vs Platforms (if they have gravity later, useful now just in case)
        this.scene.physics.add.collider(this.enemiesGroup, this.platformsGroup);

        // Bullets vs Platforms
        this.scene.physics.add.collider(this.bulletsGroup, this.platformsGroup, (bullet, _platform) => {
            const b = bullet as any;
            if (!b.penetratesWalls) {
                b.destroy();
            }
        });

        // Bullets vs Enemies
        this.scene.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, (bullet, enemy) => {
            const b = bullet as any;
            const e = enemy as Enemy;

            e.takeDamage(b.damage);

            if (!b.penetratesWalls) {
                b.destroy();
            }
        });

        // Player vs Enemies
        this.scene.physics.add.overlap(this.player, this.enemiesGroup, (player, enemy) => {
            const p = player as Player;
            const e = enemy as Enemy;
            e.onTouchPlayer(p);
            // Optional: destroy enemy on contact or push back?
            // "Basic enemy deals damage on touch".
        });

        // Player vs EndZone
        this.scene.physics.add.overlap(this.player, this.endZone, () => {
            this.finishLevel();
        });
    }

    private finishLevel() {
        // Pause physics to prevent multiple triggers
        this.scene.physics.pause();

        if (this.config.nextLevelId) {
            this.scene.scene.start('LevelTransition', {
                nextLevelId: this.config.nextLevelId
            });
        } else {
            // Last level finished -> Menu
            this.scene.scene.start('MainMenu');
        }
    }
}
