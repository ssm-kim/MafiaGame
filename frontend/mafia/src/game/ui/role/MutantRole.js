import BaseRole from '@/game/ui/role/BaseRole';

export default class MutantRole extends BaseRole {
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
    return '누구를 처형 하시겠습니까'
  }

  getTitleColor() {
    return '#aeb404';
  }

  getBorderColor() {
    return 0xaeb404;
  }

  getButtonColor(player) {
    return !player.dead ? 0x1a1a1a : 0x666666;
  }

  getHoverColor() {
    return 0x333333;
  }

  getTextColor(player) {
    return !player.dead ? '#ffffff' : '#999999';
  }

  getSelectedTextColor() {
    return '#ffffff';
  }

  getSelectedButtonColor() {
    return 0xaeb404;
  }

  getActionButtonText() {
    return '처형하기';
  }

  getActionButtonTextColor() {
    return '#ffffff';
  }

  getActionButtonColor() {
    return 0xaeb404;
  }

  getActionButtonHoverColor() {
    return 0xd7df01;
  }

  selcetedResult() {
    this.scene.events.emit('mutantActionComplete', this.selectedPlayer);
  }
}
