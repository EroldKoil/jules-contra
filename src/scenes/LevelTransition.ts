import Phaser from 'phaser';

export class LevelTransition extends Phaser.Scene {
    private nextLevelId!: number;

    constructor() {
        super('LevelTransition');
    }

    init(data: { nextLevelId: number }) {
        this.nextLevelId = data.nextLevelId;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width / 2, height / 2, `Next Level: ${this.nextLevelId}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, 'Get Ready!', {
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Wait 5 seconds then start next level
        this.time.delayedCall(5000, () => {
            this.scene.start('GameLevel', { levelId: this.nextLevelId });
        });
    }
}
