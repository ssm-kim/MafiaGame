import BaseRole from '@/game/ui/role/BaseRole';

export default class MafiaRole extends BaseRole {
  constructor(scene) {
    super(scene);
    this.players = [
      { userId: '1', nickname: '생존자 1', dead: false, role: '감염자' },
      { userId: '2', nickname: '생존자 2', dead: false, role: '생존자' },
      { userId: '3', nickname: '생존자 3', dead: false, role: '감염자' },
      { userId: '4', nickname: '생존자 4', dead: true, role: '연구원' },
      { userId: '5', nickname: '생존자 5', dead: true, role: '의사' },
      { userId: '6', nickname: '생존자 6', dead: false, role: '생존자' },
    ];

    this.createUI();
  }

  isPlayerSelectable(player) {
    return !player.dead;
  }

  getTitleText() {
    return '누구를 감염시키겠습니까';
  }

  getTitleColor() {
    return '#ff0000';
  }

  getBorderColor() {
    return 0xff0000;
  }

  getButtonColor(player) {
    return !player.dead ? 0x1a1a1a : 0x666666;
  }

  getHoverColor() {
    return 0x333333;
  }

  getTextColor(player) {
    if (player.dead) return '#999999';
    return player.role === '감염자' ? '#ff0000' : '#ffffff';
  }

  getSelectedTextColor() {
    return '#ffffff';
  }

  getSelectedButtonColor() {
    return 0xff0000;
  }

  getActionButtonText() {
    return '감염시키기';
  }

  getActionButtonTextColor() {
    return '#ffffff';
  }

  getActionButtonColor() {
    return 0xff0000;
  }

  getActionButtonHoverColor() {
    return 0xff3333;
  }

  selcetedResult() {
    this.scene.events.emit('mafiaActionComplete', this.selectedPlayer);
    console.log(this.selectedPlayer);
  }
}
