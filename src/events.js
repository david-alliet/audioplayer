// this file contains event functions that can be triggered by the player

// click or keypress on track
function playTrack(e) {
  var el;
  // see what element has been clicked on
  if(e.target.className=="apProgressBar") {
    el = e.target.parentNode;
  } else {
    el = e.target;
  }
  // detect the type of event and respond when the right event is tracked
  if(e.type==="mousedown" || (e.type==="keypress" && (e.code==="Space" || e.code==="Enter"))) {
    this.stop();
    this.trackIndex = parseInt(el.dataset.number);
    this.play();
  }
}

// blurs an element
function blur(e) {
  e.target.blur();
}
