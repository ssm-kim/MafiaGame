export default function setBackground(scene) {
  const mapWidth = 932;
  const mapHeight = 610;

  const topMargin = 222;
  const leftMargin = 36;
  const rightMargin = 32;
  const bottomMargin = 32;

  const background = scene.add.image(0, 0, 'background').setOrigin(0, 0);
  background.setPosition(0, 0);

  // const locker = scene.add.rectangle(772, 162, 128, 192);
  const lockerWidth = 0;
  const lockerHeight = 0;

  const locker = scene.add.rectangle(772, 162, lockerWidth, lockerHeight);
  locker.setName('locker');
  // locker.setFillStyle(0x000000);
  locker.setOrigin(0);
  scene.physics.add.existing(locker, true);

  // locker.body.setCollideWorldBounds(true);
  // locker.body.setBounce(0.2);

  scene.physics.world.setBounds(
    leftMargin,
    topMargin,
    mapWidth - (leftMargin + rightMargin),
    mapHeight - (topMargin + bottomMargin),
  );
}
