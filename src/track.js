// This file contains the Track object, which provides wrappers for the HTML media element


// track object has wrappers for the HTMLMediaElement
function Track(el) {
  this.el = el;
  this.formattedTotalDuration = "";
  this.available = false;

  // add total duration info to track:
  this.lblDuration = document.createElement("span");
  this.lblDuration.className = "apDuration";
  this.checkLoadState = window.setInterval(this.checkState, 10, this);
}

Track.prototype.checkState = function(e) {
  // if info is available: add total duration info and cancel interval:
  /*
    different readyStates:
    0 -> Have nothing: no information about media is available
    1 -> Have metadata: information about media is available
    2 -> Have current data: information is available for the current playback position, but not enough to play
    3 -> Have future data: information is available for a little bit of playback
    4 -> Enouh data: information for full playback and sufficient network speed to stream is available
  */
  var HAVE_NOTHING = 0,
    HAVE_METADATA = 1,
    HAVE_CURRENT_DATA = 2,
    HAVE_FUTURE_DATA = 3,
    HAVE_ENOUH_DATA = 4;

  if(e.el.readyState===HAVE_METADATA || e.el.readyState===HAVE_CURRENT_DATA || e.el.readyState===HAVE_FUTURE_DATA || e.el.readyState===HAVE_ENOUH_DATA) {
    // format time nicely:
    var ct = e.getTotalTime();
    var ctHours = Math.floor(ct/3600);
    var ctMinutes = Math.floor((ct - (ctHours*60))/60);
    var ctSeconds = Math.floor(ct - (ctHours*60)-(ctMinutes*60));
    if(ctHours < 10) ctHours = "0"+ctHours;
    if(ctMinutes < 10) ctMinutes = "0"+ctMinutes;
    if(ctSeconds < 10) ctSeconds = "0"+ctSeconds;
    // only show hours if it is relevant:
    if(ctHours === "00") {
      e.formattedTotalDuration = ctMinutes +":"+ ctSeconds;
    } else {
      e.formattedTotalDuration = ctHours +":"+ ctMinutes +":"+ ctSeconds;
    }
    e.lblDuration.innerHTML = e.formattedTotalDuration;
    // append text node to container
    e.el.parentNode.appendChild(e.lblDuration);
  }

  if(e.el.readyState===HAVE_ENOUH_DATA) {
    // label track as available for playing:
    e.available = true;
    // clear interval
    window.clearInterval(e.checkLoadState);
  }

};

Track.prototype.play = function(){
  if(this.available) {
    this.el.play();
    this.el.parentNode.className += " apActive";
  }
};

Track.prototype.pause = function(){
  this.el.pause();
};

Track.prototype.stop = function(){
  this.el.pause();
  this.el.currentTime = 0;
  this.el.parentNode.className = "apTrack";
};

Track.prototype.getTotalTime = function(){
  return this.el.duration;
};

Track.prototype.getCurrentTime = function(){
  return this.el.currentTime;
};

Track.prototype.setCurrentTime = function(t){
  this.el.currentTime = t;
};

Track.prototype.isEnded = function(){
  return this.el.ended;
};

Track.prototype.getVolume = function() {
  return this.el.volume;
};

Track.prototype.setVolume = function(v) {
  this.el.volume = v;
};

Track.prototype.resetDuration = function() {
  this.lblDuration.innerHTML = this.formattedTotalDuration;
};

Track.prototype.canPlay = function() {
  return this.available;
};
