import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class MeleeEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, hp: number) {
    super(scene, x, y, hp, 0xffa500); // Orange
  }
}
