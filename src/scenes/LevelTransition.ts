import Phaser from 'phaser';

export class LevelTransition extends Phaser.Scene {
  private nextLevelId!: number;
  private timerText!: Phaser.GameObjects.Text;
  private timeLeft: number = 5;

  constructor() {
    super('LevelTransition');
  }

  init(data: { nextLevelId: number; levelName?: string }) {
    this.nextLevelId = data.nextLevelId;
    this.timeLeft = 5;
  }

  create(data: { nextLevelId: number; levelName?: string }) {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 50, `Loading Level ${this.nextLevelId}...`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (data.levelName) {
      this.add.text(width / 2, height / 2, data.levelName, {
        fontSize: '24px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
    }

    this.timerText = this.add.text(width / 2, height / 2 + 50, `Starts in ${this.timeLeft}`, {
      fontSize: '24px',
      color: '#ffff00'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`Starts in ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
          this.scene.start('GameLevel', { levelId: this.nextLevelId });
        }
      },
      repeat: 5
    });
  }
}
