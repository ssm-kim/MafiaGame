export function resetVoteSelection(scene, targetId) {
  if (scene.voteSelections[targetId]) {
    scene.voteSelections[targetId].setFillStyle(0xffffff).setStrokeStyle();
  }
  scene.target = null;
}

export function highlightVoteSelection(scene, targetId) {
  if (scene.voteSelections[targetId]) {
    scene.voteSelections[targetId].setFillStyle(0xff0000).setStrokeStyle(2, 0xff0000);
  }
}
