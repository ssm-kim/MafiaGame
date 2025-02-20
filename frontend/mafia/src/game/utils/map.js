export default function setBackground(scene) {
  const background = scene.add.image(0, 0, 'background').setOrigin(0, 0);
  background.setPosition(0, 0);
  scene.physics.world.setBounds(32, 64, 1344 - 64, 832 - 128);
}
