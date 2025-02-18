import BaseRole from '@/game/ui/role/BaseRole';

export default class CitizenRole extends BaseRole {
  constructor(scene) {
    super(scene);
    this.createUI();
  }

  isPlayerSelectable(player) {
    return !player.dead;
  }

  getTitleText() {
    return '감염자 투표';
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
    return !player.dead ? '#ffffff' : '#999999';
  }

  getSelectedTextColor() {
    return '#ffffff'; // 의사 역할의 경우 선택된 텍스트 색상을 검은색으로
  }

  getSelectedButtonColor() {
    return 0xffffff;
  }

  getActionButtonText() {
    return '투표하기';
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
    this.scene.events.emit('doctorActionComplete', this.selectedPlayer);
  }
}
