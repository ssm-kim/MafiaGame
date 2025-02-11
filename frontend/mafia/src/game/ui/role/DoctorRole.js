import BaseRole from '@/game/ui/role/BaseRole';

export default class DoctorRole extends BaseRole {
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
    return '백신을 투여하시겠습니까';
  }

  getTitleColor() {
    return '#ffffff';
  }

  getBorderColor() {
    return 0xffffff;
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
    return '#000000'; // 의사 역할의 경우 선택된 텍스트 색상을 검은색으로
  }

  getSelectedButtonColor() {
    return 0xffffff;
  }

  getActionButtonText() {
    return '투여하기';
  }

  getActionButtonTextColor() {
    return '#000000';
  }

  getActionButtonColor() {
    return 0xffffff;
  }

  getActionButtonHoverColor() {
    return 0xdcdcdc;
  }

  selcetedResult() {
    this.scene.events.emit('doctorActionComplete', this.selectedPlayer);
  }
}
