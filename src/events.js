// this file contains event functions that can be triggered by the player

// click or keypress on track
function playTrack(e) {
  if(e.type==="mousedown" || (e.type==="keypress" && (e.code==="Space" || e.code==="Enter"))) {
    this.stop();
    this.trackIndex = parseInt(e.target.dataset.number);
    this.play();
  }
}

// blurs an element
function blur(e) {
  e.target.blur();
}
