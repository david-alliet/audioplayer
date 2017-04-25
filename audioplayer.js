// checks for active audioplayer elements on the page
function detectAudioPlayers() {
  var nodes = document.getElementsByClassName('dal_audioplayer');
  for (var i=0; i<nodes.length; i++) {
    // convert each found node into an AudioPlayer
    var ap = new AudioPlayer(nodes[i]);
  }
}


// The main AudioPlayer object
function AudioPlayer(node) {
  this.audioPlayerElement = node; // the root element of the player
  this.mode = node.dataset.mode; // mode of the player (currently not implemented)
  this.trackList = []; // will hold all tracks
  this.trackIndex = 0; // what track the player is currently on
  this.progressTimer = null; // timer to update seek-bar and time signature
  //this.seekTimer = null; // the timer checking
  this.playing = false; // is the player currently playing a track?
  this.pausing = false; // is the player currently paused?
  this.seeking = false; // is the user currently hovering over the seek-bar?
  this.muted = false; // is the player muted (no functionality for that at the moment)
  this.globalVolume = 1.0; // the volume of the player
  this.volumeDrag = false; // is the user currently dragging the volume bar?

  // get all tracks in the player
  var tracks = this.audioPlayerElement.getElementsByTagName("audio");

  // process tracks
  for(var i=0; i<tracks.length; i++) {
    // load audio elements into Track object
    var t = new Track(tracks[i]);
    // add functionality and classes to the parent element
    tracks[i].parentNode.className = "apTrack";
    tracks[i].parentNode.dataset.number = i;
    // add event listener for click to each track
    tracks[i].parentNode.addEventListener("mousedown", function(e){
      this.stop();
      this.trackIndex = parseInt(e.srcElement.dataset.number);
      this.play();
    }.bind(this));
    // add processed track to array
    this.trackList.push(t);
  }

  // create containers to hold all UI elements
  // controls contain all buttons
  var apControls = document.createElement("div");
  apControls.className = "apControls";
  // left aligned area for controls
  var leftControlPane = document.createElement("div");
  leftControlPane.className = "apPane left";
  // right aligned area for controls
  var rightControlPane = document.createElement("div");
  rightControlPane.className = "apPane right";
  // the progress bar area
  var apProgress = document.createElement("div");
  apProgress.className = "apProgress";

  // Previous button:
  this.ctrlPrevious = document.createElement("button");
  this.ctrlPrevious.className = "apControl apPrevious";
  this.ctrlPrevious.innerHTML = "&lt;&lt;";
  this.ctrlPrevious.addEventListener("click", function(e) {
    this.previous();
  }.bind(this));

  // Play button:
  this.ctrlPlayPause = document.createElement("button");
  this.ctrlPlayPause.className = "apControl apPlay";
  this.ctrlPlayPause.innerHTML = "play";
  this.ctrlPlayPause.dataset.mode = "play";
  this.ctrlPlayPause.addEventListener("click", function(e) {
    // detect if the player is currently playing, if so pause instead of play
    if(e.srcElement.dataset.mode==="play") {
      this.play();
    } else {
      this.pause();
    }
    e.preventDefault();
  }.bind(this));

  // previous:
  this.ctrlNext = document.createElement("button");
  this.ctrlNext.className = "apControl apNext";
  this.ctrlNext.innerHTML = "&gt;&gt;";
  this.ctrlNext.addEventListener("click", function(e) {
    this.next();
  }.bind(this));

  // stop:
  this.ctrlStop = document.createElement("button");
  this.ctrlStop.className = "apControl apStop";
  this.ctrlStop.innerHTML = "stop";
  this.ctrlStop.addEventListener("click", function(e) {
    // stop the player
    this.playing = false;
    this.stop();
    e.preventDefault();
  }.bind(this));

  // seek bar:
  this.seekBar = document.createElement("div");
  this.seekBar.className = "apSeekBar";
  // event: mouse over (indicates seeking)
  this.seekBar.addEventListener("mouseover", function(e){
    if(this.playing) {
      this.startSeek();
      this.indicatorBar.style="opacity: .2;";
    }
  }.bind(this));
  // event: mouse move (gets mouse cursor related to element)
  this.seekBar.addEventListener("mousemove", function(e){
    if(this.seeking) {
      // move the progress bar
      this.indicatorBar.style="opacity: .2; width: "+ e.offsetX +"px;";
    }
  }.bind(this));
  // event: mouse out (indicates stop seeking)
  this.seekBar.addEventListener("mouseout", function(e){
    if(this.playing) {
      this.stopSeek();
      this.indicatorBar.style="opacity: 0;";
    }
  }.bind(this));
  // event: pressed (indicates seeking to position)
  this.seekBar.addEventListener("mousedown", function(e){
    // only seek in track when either playing or pausing
    if(this.playing || this.pausing) {
      this.seek(e.offsetX, this.seekBar.offsetWidth);
    }
  }.bind(this));

  // indicator for when hovering / seeking
  this.indicatorBar = document.createElement("div");
  this.indicatorBar.className = "apIndicatorBar";

  // the actual progress bar
  this.progressBar = document.createElement("div");
  this.progressBar.className = "apProgressBar";

  // Volume button
  this.ctrlVolume = document.createElement("button");
  this.ctrlVolume.className = "apControl apVolume";
  this.ctrlVolume.innerHTML = "Vol";
  this.ctrlVolume.dataset.opened = false;
  // open or collapse volume panel
  this.ctrlVolume.addEventListener("click", function(e){
    if(e.srcElement.dataset.opened=="false") {
      this.panelVolume.style = "border-color: #404040; border-width: 2px; margin-left: .3em; margin-right: .3em; width: 75px;";
      e.srcElement.dataset.opened = true;
    } else {
      e.srcElement.dataset.opened = false;
      this.panelVolume.style = "border-color: #404040; margin-left: 0; margin-right: 0; width: 0px; border-width: 2px;";
    }
  }.bind(this));

  // volume panel
  this.panelVolume = document.createElement("div");
  this.panelVolume.className = "apVolumePanel";

  // Volume indicator bar
  this.volumeTotalBar = document.createElement("div");
  this.volumeTotalBar.className = "apIndicatorBar";
  // set the volume bar to the correct width based on the player's actual volume
  this.volumeTotalBar.style = "width: "+ Math.round(this.globalVolume * 100) + "%";

  // mouse down on on panel: set volume
  this.panelVolume.addEventListener("mousedown", function(e) {
    this.volumeDrag = true;
    this.adjustVolume(e.offsetX, this.panelVolume.offsetWidth)
    this.volumeTotalBar.style = "width:"+ e.offsetX +"px;";
    e.preventDefault();
  }.bind(this));
  // mouse moving over panel:
  this.panelVolume.addEventListener("mousemove", function(e){
    // check if the user is dragging the volume slider and animate the slider if so
    if(this.volumeDrag) {
      this.adjustVolume(e.offsetX, this.panelVolume.offsetWidth)
      this.volumeTotalBar.style = "width:"+ e.offsetX +"px;";
    }
    e.preventDefault();
  }.bind(this));
  // mouse up: stop volume adjustments if dragging bar
  this.panelVolume.addEventListener("mouseup", function(e){
    if(this.volumeDrag) {
      this.volumeDrag = false;
    }
    e.preventDefault();
  }.bind(this));
  // ditto when the mouse is leaving the element
  this.panelVolume.addEventListener("mouseleave", function(e){
    if(this.volumeDrag) {
      this.volumeDrag = false;
    }
    e.preventDefault();
  }.bind(this));

  // listen to transition finish to clean up animation
  this.panelVolume.addEventListener("transitionend", function(e){
    console.log("animation done");
    if(this.ctrlVolume.dataset.opened=="false") {
      this.panelVolume.style = "border-width: 0;"
    }
  }.bind(this));
  // add volume bar to the volume panel:
  this.panelVolume.appendChild(this.volumeTotalBar);


  // add controls to their proper containers:
  this.seekBar.appendChild(this.progressBar);
  this.seekBar.appendChild(this.indicatorBar);
  apProgress.appendChild(this.seekBar);
  // apProgress.appendChild(this.txtDuration);

  // add the track controls to the left or right panels
  leftControlPane.appendChild(this.ctrlPlayPause);
  leftControlPane.appendChild(this.ctrlStop);
  rightControlPane.appendChild(this.ctrlVolume);
  rightControlPane.appendChild(this.panelVolume);
  rightControlPane.appendChild(this.ctrlPrevious);
  rightControlPane.appendChild(this.ctrlNext);

  // add panels to the container
  apControls.appendChild(leftControlPane);
  apControls.appendChild(rightControlPane);

  // add containers to player
  this.audioPlayerElement.appendChild(apProgress);
  this.audioPlayerElement.appendChild(apControls);
}


// play a track:
AudioPlayer.prototype.play = function(){
  this.playing = true;
  this.pausing = false;
  // set correct volume and play
  this.trackList[this.trackIndex].setVolume(this.globalVolume);
  this.trackList[this.trackIndex].play();
  // set play/pause button to pause
  this.ctrlPlayPause.className = "apControl apPause";
  this.ctrlPlayPause.innerHTML = "pause";
  this.ctrlPlayPause.dataset.mode = "pause";
  // start progress bar
  this.progressTimer = window.setInterval(this.checkProgress, 10, this);
};

// pause a track
AudioPlayer.prototype.pause = function(){
  this.pausing = true;
  this.trackList[this.trackIndex].pause();
  // set play/pause button to play
  this.ctrlPlayPause.className = "apControl apPlay";
  this.ctrlPlayPause.innerHTML = "play";
  this.ctrlPlayPause.dataset.mode = "play";
  // pause progress bar
  window.clearInterval(this.progressTimer);
  this.progressTimer = null;
};

// stop a track completely:
AudioPlayer.prototype.stop = function(){
  this.pausing = false;
  this.trackList[this.trackIndex].stop();
  // pause progress bar
  if(this.progressTimer !== null) {
    window.clearInterval(this.progressTimer);
    this.progressTimer = null;
  }
  // set play/pause button to play
  this.ctrlPlayPause.className = "apControl apPlay";
  this.ctrlPlayPause.innerHTML = "play";
  this.ctrlPlayPause.dataset.mode = "play";
  // reset the progress bar:
  this.clearProgress();
};

// skip to the next track
AudioPlayer.prototype.next = function() {
  // stop current track
  this.stop();
  // advance trackindex or move back to 0 if it is the last track
  if(this.trackIndex === this.trackList.length-1) {
    this.trackIndex = 0;
  } else {
    this.trackIndex ++;
  }
  // start playing the new track if the player was playing before
  if(this.playing) {
    this.play();
  }
};

AudioPlayer.prototype.previous = function() {
  this.stop();
  if(this.trackIndex === 0) {
    this.trackIndex = this.trackList.length-1;
  } else {
    this.trackIndex --;
  }
  if(this.playing) {
    this.play();
  }
};

// check the progress of a playing track:
AudioPlayer.prototype.checkProgress = function(e){
  // update duration text
  var ct = e.trackList[e.trackIndex].getCurrentTime();
  var tt = e.trackList[e.trackIndex].getTotalTime();
  // format time properly
  var ctHours = Math.floor(ct/3600);
  var ctMinutes = Math.floor((ct - (ctHours*60))/60);
  var ctSeconds = Math.floor(ct - (ctHours*60)-(ctMinutes*60));
  if(ctHours < 10) ctHours = "0"+ctHours;
  if(ctMinutes < 10) ctMinutes = "0"+ctMinutes;
  if(ctSeconds < 10) ctSeconds = "0"+ctSeconds;
  // only show hours if it is relevant:
  if(ctHours === "00") {
    e.trackList[e.trackIndex].lblDuration.innerHTML = ctMinutes +":"+ ctSeconds;
  } else {
    e.trackList[e.trackIndex].lblDuration.innerHTML = ctHours +":"+ ctMinutes +":"+ ctSeconds;
  }
  // update progress bar
  e.progressBar.style = "width: "+ (ct/tt)*100 +"%";
  // check if a track has ended and switch to next track
  if(e.trackList[e.trackIndex].isEnded()) {
    e.next();
  }
};

// reset progress bar and duration
AudioPlayer.prototype.clearProgress = function(){
  this.trackList[this.trackIndex].resetDuration();
  this.progressBar.style = "width: 0%";
};

// start seeking
AudioPlayer.prototype.startSeek = function() {
  this.seeking = true;
};

// stop seeking
AudioPlayer.prototype.stopSeek = function() {
  this.seeking = false;
  this.indicatorBar.style = "width: 0;";
};

// seek to a chosen position in a track:²
AudioPlayer.prototype.seek = function(position, totalWidth) {
  // calculate where to seek to in the track, based on position and total width
  var totalTime = this.trackList[this.trackIndex].getTotalTime();
  var percentage = position / totalWidth;
  this.trackList[this.trackIndex].setCurrentTime(percentage*totalTime);
  // move the progress bar if paused
  if(this.pausing) {
    this.checkProgress(this);
  }
};

// completely mute the player (no option in UI)
AudioPlayer.prototype.mute = function() {
  if(this.muted) {
    // unmute
    this.muted = false;
    this.ctrlVolume.className = "apControl apVolume";
    this.trackList[this.trackIndex].setVolume(this.globalVolume);
  } else {
    // mute
    this.muted = true;
    this.ctrlVolume.className = "apControl apVolume apMuted";
    this.trackList[this.trackIndex].setVolume(0);
  }
};

// change the volume of the player
AudioPlayer.prototype.adjustVolume = function(chosen, total) {
  // calculate new volume
  this.globalVolume = chosen / total;
  // adjust volume of current track
  this.trackList[this.trackIndex].setVolume(this.globalVolume);
};








// track object has wrappers for the HTMLMediaElement
function Track(el) {
  this.el = el;
  this.formattedTotalDuration = "";

  // add total duration info to track:
  this.lblDuration = document.createElement("span");
  this.lblDuration.className = "apDuration";
  this.checkLoadState = window.setInterval(this.checkState, 10, this);
}

Track.prototype.checkState = function(e) {
  // if info is available: add total duration info and cancel interval:
  if(e.el.readyState===1 || e.el.readyState===2 || e.el.readyState===3 || e.el.readyState===4) {
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
    // clear interval
    window.clearInterval(e.checkLoadState);
  }
};

Track.prototype.play = function(){
  this.el.play();
  this.el.parentNode.className += " apActive";
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
}
