import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
  private levelTexts: Phaser.GameObjects.Text[] = [];
  private currentSelection: number = 0;
  private wKey!: Phaser.Input.Keyboard.Key;
  private sKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private iKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 4, 'SELECT LEVEL', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Create 3 Level buttons
    for (let i = 1; i <= 3; i++) {
        const text = this.add.text(width / 2, height / 3 + (i * 50), `LEVEL ${i}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.levelTexts.push(text);
    }

    this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.updateSelectionVisuals();
  }

  update() {
    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.wKey)) {
      this.currentSelection--;
      if (this.currentSelection < 0) this.currentSelection = this.levelTexts.length - 1;
      this.updateSelectionVisuals();
    } else if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
      this.currentSelection++;
      if (this.currentSelection >= this.levelTexts.length) this.currentSelection = 0;
      this.updateSelectionVisuals();
    }

    // Selection
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.iKey)) {
      const selectedLevel = this.currentSelection + 1; // 0-based index to 1-based ID
      this.scene.start('GameLevel', { levelId: selectedLevel });
    }
  }

  private updateSelectionVisuals() {
    this.levelTexts.forEach((text, index) => {
        text.setColor(index === this.currentSelection ? '#ffff00' : '#ffffff');
    });
  }
}
