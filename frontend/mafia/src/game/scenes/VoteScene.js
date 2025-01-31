import Phaser from 'phaser';
import setBackground from '@/game/utils/map';
import createVoteContainer from '@/game/ui/VoteContainer';
import { resetVoteSelection, highlightVoteSelection } from '@/game/utils/voteUtils';

export default class VoteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VoteScene' });
  }

  init() {
    this.gameData = this.registry.get('gameData');
    this.character = this.registry.get('playerInfo').character;
    this.target = null;
    this.voteSelections = {};
  }

  create() {
    setBackground(this);

    const dummyOptions = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      nickname: `user${i + 1}`,
    }));

    const { width, height } = this.scale.gameSize;
    const sizer = createVoteContainer(
      this,
      width / 2,
      height / 2,
      width * 0.8,
      height * 0.8,
      dummyOptions,
    );

    // sizer.drawBounds(this.add.graphics(), 0xff0000)
  }

  select(targetId) {
    if (this.target === targetId) {
      resetVoteSelection(this, targetId);
      return;
    }

    if (this.target) resetVoteSelection(this, this.target);

    this.target = targetId;
    highlightVoteSelection(this, targetId);
  }
}
