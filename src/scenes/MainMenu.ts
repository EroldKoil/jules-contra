import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
  private startText!: Phaser.GameObjects.Text;
  private refreshText!: Phaser.GameObjects.Text;
  private currentSelection: number = 0; // 0 for Start, 1 for Refresh
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 3, 'CONTRA STYLE GAME', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.startText = this.add.text(width / 2, height / 2, 'START GAME', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.refreshText = this.add.text(width / 2, height / 2 + 50, 'REFRESH', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.updateSelectionVisuals();
  }

  update() {
    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.currentSelection = 0;
      this.updateSelectionVisuals();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.currentSelection = 1;
      this.updateSelectionVisuals();
    }

    // Selection
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.iKey)) {
      if (this.currentSelection === 0) {
        this.scene.start('GameLevel');
      } else {
        window.location.reload();
      }
    }
  }

  private updateSelectionVisuals() {
    if (this.currentSelection === 0) {
      this.startText.setColor('#ffff00');
      this.refreshText.setColor('#ffffff');
    } else {
      this.startText.setColor('#ffffff');
      this.refreshText.setColor('#ffff00');
    }
  }
}
