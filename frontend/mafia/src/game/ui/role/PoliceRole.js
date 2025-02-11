import BaseRole from '@/game/ui/role/BaseRole';

export default class PoliceRole extends BaseRole {
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

    console.log('POLICE ROLE');

    this.createUI();
  }

  isPlayerSelectable(player) {
    return !player.dead;
  }

  getTitleText() {
    return '혈액 검사를 실시 하시겠습니까';
  }

  getTitleColor() {
    return '#558bcf';
  }

  getBorderColor() {
    return 0x558bcf;
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
    return 0x558bcf;
  }

  getActionButtonText() {
    return '검사하기';
  }

  getActionButtonTextColor() {
    return '#ffffff';
  }

  getActionButtonColor() {
    return 0x558bcf;
  }

  getActionButtonHoverColor() {
    return 0x0080df;
  }

  selcetedResult() {
    this.scene.events.emit('policeActionComplete', this.selectedPlayer);
  }
}
