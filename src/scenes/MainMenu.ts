import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
  private keys!: {
    w: Phaser.Input.Keyboard.Key,
    s: Phaser.Input.Keyboard.Key,
    enter: Phaser.Input.Keyboard.Key,
    i: Phaser.Input.Keyboard.Key
  };
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 4, 'CONTRA CLONE', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const options = ['Start Level 1', 'Start Level 2', 'Start Level 3'];

    options.forEach((opt, index) => {
      const text = this.add.text(width / 2, height / 2 + (index * 40), opt, {
        fontSize: '24px',
        color: index === 0 ? '#ffff00' : '#ffffff'
      }).setOrigin(0.5);
      this.menuItems.push(text);
    });

    this.keys = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      enter: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      i: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I)
    };
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.w)) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) this.selectedIndex = this.menuItems.length - 1;
      this.updateVisuals();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.s)) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.menuItems.length) this.selectedIndex = 0;
      this.updateVisuals();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      this.startGame(this.selectedIndex + 1);
    }
  }

  private updateVisuals() {
    this.menuItems.forEach((text, index) => {
      text.setColor(index === this.selectedIndex ? '#ffff00' : '#ffffff');
    });
  }

  private startGame(levelId: number) {
    this.scene.start('GameLevel', { levelId });
  }
}
