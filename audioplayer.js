function detectAudioPlayers() {
  var nodes = document.getElementsByClassName('dal_audioplayer');
  for (var i=0; i<nodes.length; i++) {
    var ap = new AudioPlayer(nodes[i]);
  }
}



function AudioPlayer(node) {
  this.audioPlayerElement = node;
  this.mode = node.dataset.mode;
  this.trackList = [];
  this.trackIndex = 0;
  this.progressTimer = null;
  this.seekTimer = null;
  this.playing = false;
  this.pausing = false;
  this.seeking = false;
  this.muted = false;
  this.globalVolume = 1.0;

  var tracks = this.audioPlayerElement.getElementsByTagName("audio");

  // process tracks in source code
  for(var i=0; i<tracks.length; i++) {
    // load audio elements into Track object
    var t = new Track(tracks[i]);
    // add functionality and classes to the parent element
    tracks[i].parentNode.className = "apTrack";
    tracks[i].parentNode.dataset.number = i;
    tracks[i].parentNode.addEventListener("mousedown", function(e){
      this.stop();
      this.trackIndex = e.srcElement.dataset.number;
      this.play();
    }.bind(this));
    this.trackList.push(t);
  }

  //  set global controls: play, pause, seek bar
  var apControls = document.createElement("div");
  apControls.className = "apControls";

  var leftControlPane = document.createElement("div");
  leftControlPane.className = "apPane left";

  var middleControlPane = document.createElement("div");
  middleControlPane.className = "apPane middle";

  var rightControlPane = document.createElement("div");
  rightControlPane.className = "apPane right";

  var apProgress = document.createElement("div");
  apProgress.className = "apProgress";

  // previous:
  this.ctrlPrevious = document.createElement("button");
  this.ctrlPrevious.className = "apControl apPrevious";
  this.ctrlPrevious.innerHTML = "&lt;&lt;";
  this.ctrlPrevious.addEventListener("click", function(e) {
    this.previous();
  }.bind(this));

  // play:
  this.ctrlPlayPause = document.createElement("button");
  this.ctrlPlayPause.className = "apControl apPlay";
  this.ctrlPlayPause.innerHTML = "play";
  this.ctrlPlayPause.dataset.mode = "play";
  this.ctrlPlayPause.addEventListener("click", function(e) {
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
    this.playing = false;
    this.stop();
    e.preventDefault();
  }.bind(this));

  // duration text:
  this.txtDuration = document.createElement("div");
  this.txtDuration.className = "apDuration";
  this.txtDuration.innerHTML = "";

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

  // indicator for when mouse-overing
  this.indicatorBar = document.createElement("div");
  this.indicatorBar.className = "apIndicatorBar";

  // progress bar:
  this.progressBar = document.createElement("div");
  this.progressBar.className = "apProgressBar";

  // volume:
  this.ctrlVolume = document.createElement("button");
  this.ctrlVolume.className = "apControl apVolume";
  this.ctrlVolume.innerHTML = "Vol";
  this.ctrlVolume.dataset.mute = false;
  this.ctrlVolume.addEventListener("click", function(e){
    // mute or unmute volume
    this.mute();
  }.bind(this));

  // volume panel
  this.panelVolume = document.createElement("div");
  this.panelVolume.className = "panel";

  // volume total bar
  this.volumeTotalBar = document.createElement("div");
  this.volumeTotalBar.className = "apIndicatorBar";
  // volume actual bar
  this.volumeSlider = document.createElement("div");
  this.volumeSlider.className = "apProgressBar";

  this.panelVolume.appendChild(this.volumeSlider);
  this.panelVolume.appendChild(this.volumeTotalBar);



  // add controls to their proper containers:
  this.seekBar.appendChild(this.progressBar);
  this.seekBar.appendChild(this.indicatorBar);
  apProgress.appendChild(this.seekBar);
  apProgress.appendChild(this.txtDuration);

  // add the track controls to the left, middle or right panels
  leftControlPane.appendChild(this.ctrlPrevious);
  middleControlPane.appendChild(this.ctrlPlayPause);
  middleControlPane.appendChild(this.ctrlStop);
  rightControlPane.appendChild(this.ctrlNext);
  apControls.appendChild(this.ctrlVolume);

  apControls.appendChild(this.panelVolume);

  // add panels to the container
  apControls.appendChild(leftControlPane);
  apControls.appendChild(middleControlPane);
  apControls.appendChild(rightControlPane);

  // add containers to player
  this.audioPlayerElement.appendChild(apProgress);
  this.audioPlayerElement.appendChild(apControls);
}


AudioPlayer.prototype.play = function(){
  this.playing = true;
  this.pausing = false;
  this.trackList[this.trackIndex].setVolume(this.globalVolume);
  this.trackList[this.trackIndex].play();
  // set play/pause button to pause
  this.ctrlPlayPause.className = "apControl apPause";
  this.ctrlPlayPause.innerHTML = "pause";
  this.ctrlPlayPause.dataset.mode = "pause";
  // start progress bar
  this.progressTimer = window.setInterval(this.checkProgress, 10, this);
};

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
  this.clearProgress();
};

AudioPlayer.prototype.next = function() {
  this.stop();
  if(this.trackIndex === this.trackList.length-1) {
    this.trackIndex = 0;
  } else {
    this.trackIndex ++;
  }
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
    e.txtDuration.innerHTML = ctMinutes +":"+ ctSeconds;
  } else {
    e.txtDuration.innerHTML = ctHours +":"+ ctMinutes +":"+ ctSeconds;
  }

  // update progress bar
  e.progressBar.style = "width: "+ (ct/tt)*100 +"%";

  // check if a track has ended and switch to next track
  if(e.trackList[e.trackIndex].isEnded()) {
    e.next();
  }
};

AudioPlayer.prototype.clearProgress = function(){
  // clear the progress bar and duration text
  this.txtDuration.innerHTML = "";
  this.progressBar.style = "width: 0%";
};

AudioPlayer.prototype.startSeek = function() {
  this.seeking = true;
};

AudioPlayer.prototype.stopSeek = function() {
  this.seeking = false;
  this.indicatorBar.style = "width: 0;";
};

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








// track object has wrappers for the HTMLMediaElement
function Track(el) {
  this.el = el;

  // add total duration info to track:
  this.totalDuration = document.createElement("span");
  this.totalDuration.className = "apDuration";
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
      e.totalDuration.innerHTML = ctMinutes +":"+ ctSeconds;
    } else {
      e.totalDuration.innerHTML = ctHours +":"+ ctMinutes +":"+ ctSeconds;
    }
    // append text node to container
    e.el.parentNode.appendChild(e.totalDuration);
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
