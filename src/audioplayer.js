// The main AudioPlayer object
function AudioPlayer(node) {
  this.audioPlayerElement = node; // the root element of the player
  this.mode = "" // indicates if player for one track or several
  this.trackList = []; // will hold all tracks
  this.trackIndex = 0; // what track the player is currently on
  this.totalTracks = 0; // total number of tracks
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
    tracks[i].parentNode.tabIndex = i+1;
    // add event listener to play track on mousedown or keypress
    tracks[i].parentNode.addEventListener("mousedown", playTrack.bind(this));
    tracks[i].parentNode.addEventListener("keypress", playTrack.bind(this));
    // add processed track to array
    this.trackList.push(t);
  }
  this.totalTracks = this.trackList.length;

  // create containers to hold all UI elements
  // controls contain all buttons
  var apControls = document.createElement("div");
  apControls.className = "apControls";


  /*
    SINGLE TRACK PLAYER 
    -------------------
    -> all functionality for single track player
  */

  if(this.totalTracks === 1) {
    console.log("setting up track container");
    var apTrackContainer = document.createElement("div");
    apTrackContainer.className = "apTrackContainer"
  }

  // the progress bar area
  var apProgress = document.createElement("div");
  apProgress.className = "apProgress";

  // Play button
  this.ctrlPlayPause = document.createElement("button");
  this.ctrlPlayPause.className = "apControl apPlay";
  this.ctrlPlayPause.innerHTML = "play";
  this.tabIndex = this.totalTracks+2;
  this.ctrlPlayPause.dataset.mode = "play";
  this.ctrlPlayPause.addEventListener("click", function(e) {
    // detect if the player is currently playing, if so pause instead of play
    if(e.target.dataset.mode==="play") {
      this.play();
    } else {
      this.pause();
    }
    e.preventDefault();
  }.bind(this));
  this.ctrlPlayPause.addEventListener("mouseout", blur);

  if(this.totalTracks === 1) {
    apControls.appendChild(this.ctrlPlayPause);
  }

  // seek bar:
  this.seekBar = document.createElement("div");
  this.seekBar.className = "apSeekBar";
  this.seekBar.tabIndex = this.totalTracks+1;
  this.seekBar.title = "Press the right or left arrow keys to seek forward or backward in the track.";

  // Seek bar event: mouse over (indicates seeking)
  this.seekBar.addEventListener("mouseover", function(e){
    if(this.playing) {
      this.startSeek();
      this.indicatorBar.style="opacity: .2;";
    }
  }.bind(this));

  // Seek bar event: mouse move (gets mouse cursor related to element)
  this.seekBar.addEventListener("mousemove", function(e){
    if(this.seeking) {
      // move the progress bar
      this.indicatorBar.style="opacity: .2; width: "+ e.offsetX +"px;";
    }
  }.bind(this));

  // Seek bar event: mouse out (indicates stop seeking)
  this.seekBar.addEventListener("mouseout", function(e){
    if(this.playing) {
      this.stopSeek();
      this.indicatorBar.style="opacity: 0;";
    }
  }.bind(this));

  // Seek bar event: pressed (indicates seeking to position)
  this.seekBar.addEventListener("mousedown", function(e){
    // only seek in track when either playing or pausing
    if(this.playing || this.pausing) {
      this.seek(e.offsetX, this.seekBar.offsetWidth);
    }
  }.bind(this));

  // Seek bar event: hit key:
  this.seekBar.addEventListener("keydown", function(e){
    if(this.playing) {
      if(e.code==="ArrowLeft") {
        // seek backward by 5 seconds
        this.trackList[this.trackIndex].setCurrentTime(this.trackList[this.trackIndex].getCurrentTime()-5);
      } else if(e.code==="ArrowRight") {
        // seek forward by 5 seconds
        this.trackList[this.trackIndex].setCurrentTime(this.trackList[this.trackIndex].getCurrentTime()+5);
      }
    }
  }.bind(this));

  // indicator for when hovering / seeking
  this.indicatorBar = document.createElement("div");
  this.indicatorBar.className = "apIndicatorBar";

  // the actual progress bar
  this.progressBar = document.createElement("div");
  this.progressBar.className = "apProgressBar";
  
  // add controls to their proper containers:
  this.seekBar.appendChild(this.progressBar);
  this.seekBar.appendChild(this.indicatorBar);
  apProgress.appendChild(this.seekBar);


  // volume panel
  this.panelVolume = document.createElement("div");
  this.panelVolume.className = "apVolumePanel";

  // Volume button
  this.ctrlVolume = document.createElement("button");
  this.ctrlVolume.className = "apControl apVolume";
  this.ctrlVolume.innerHTML = "Vol";
  this.tabIndex = this.totalTracks+4;
  this.ctrlVolume.dataset.opened = false;
  // open or collapse volume panel
  this.ctrlVolume.addEventListener("click", function(e){
    if(e.target.dataset.opened=="false") {
      this.panelVolume.className = "apVolumePanel opened";
      e.target.dataset.opened = true;
    } else {
      e.target.dataset.opened = false;
      this.panelVolume.className = "apVolumePanel closed";
    }
  }.bind(this));
  this.ctrlVolume.addEventListener("mouseout", blur);
  if(this.totalTracks === 1) {
    apControls.appendChild(this.ctrlVolume);
  }

  // Volume indicator bar
  this.volumeTotalBar = document.createElement("div");
  this.volumeTotalBar.className = "apIndicatorBar";
  // set the volume bar to the correct width based on the player's actual volume
  this.volumeTotalBar.style = "width: "+ Math.round(this.globalVolume * 100) + "%";

  // mouse down on on panel: set volume
  this.panelVolume.addEventListener("mousedown", function(e) {
    this.volumeDrag = true;
    this.adjustVolume(e.offsetX, this.panelVolume.offsetWidth);
    this.volumeTotalBar.style = "width:"+ e.offsetX +"px;";
    e.preventDefault();
  }.bind(this));
  // mouse moving over panel:
  this.panelVolume.addEventListener("mousemove", function(e){
    // check if the user is dragging the volume slider and animate the slider if so
    if(this.volumeDrag) {
      this.adjustVolume(e.offsetX, this.panelVolume.offsetWidth);
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
    if(this.ctrlVolume.dataset.opened=="false") {
      this.panelVolume.className = "apVolumePanel closed hidden";
    }
  }.bind(this));
  // add volume bar to the volume panel:
  this.panelVolume.appendChild(this.volumeTotalBar);

  if(this.totalTracks === 1) {
    apControls.appendChild(this.panelVolume);
  }



  /*
    MULTIPLE TRACK PLAYER 
    ---------------------
    -> all extra functionality for multiple track player
  */
  if(this.totalTracks > 1) {

    // left aligned area for controls
    var leftControlPane = document.createElement("div");
    leftControlPane.className = "apPane left";
    // right aligned area for controls
    var rightControlPane = document.createElement("div");
    rightControlPane.className = "apPane right";
  
    // buttons that are only needed in the multiple track player
    // Previous button:
    this.ctrlPrevious = document.createElement("button");
    this.ctrlPrevious.className = "apControl apPrevious";
    this.ctrlPrevious.innerHTML = "&lt;&lt;";
    this.tabIndex = this.totalTracks+5;
    this.ctrlPrevious.addEventListener("click", function(e) {
      this.previous();
    }.bind(this));
    this.ctrlPrevious.addEventListener("mouseout", blur);

    // Next button:
    this.ctrlNext = document.createElement("button");
    this.ctrlNext.className = "apControl apNext";
    this.ctrlNext.innerHTML = "&gt;&gt;";
    this.tabIndex = this.totalTracks+6;
    this.ctrlNext.addEventListener("click", function(e) {
      this.next();
    }.bind(this));
    this.ctrlNext.addEventListener("mouseout", blur);
  
    // Stop button:
    this.ctrlStop = document.createElement("button");
    this.ctrlStop.className = "apControl apStop";
    this.ctrlStop.innerHTML = "stop";
    this.tabIndex = this.totalTracks+3;
    this.ctrlStop.addEventListener("click", function(e) {
      // stop the player
      this.playing = false;
      this.stop();
      e.preventDefault();
    }.bind(this));
    this.ctrlStop.addEventListener("mouseout", blur);
  
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

    this.audioPlayerElement.appendChild(apProgress);
    this.audioPlayerElement.appendChild(apControls);
  } else {
    
    var tracklistNode = this.audioPlayerElement.removeChild(this.audioPlayerElement.getElementsByTagName("ul")[0]);

    // add containers to single track player
    this.audioPlayerElement.appendChild(apControls);
    apTrackContainer.appendChild(tracklistNode);
    apTrackContainer.appendChild(apProgress);
    this.audioPlayerElement.appendChild(apTrackContainer);
    
    // add class to indicate this is a player for a single track:
    this.audioPlayerElement.className += " single";
  }
}


// play a track:
AudioPlayer.prototype.play = function(){
  // set correct volume and attempt play
  this.trackList[this.trackIndex].setVolume(this.globalVolume);
  var success = this.trackList[this.trackIndex].play();

  if(success) {
    this.playing = true;
    this.pausing = false;
    // set play/pause button to pause
    this.ctrlPlayPause.className = "apControl apPause";
    this.ctrlPlayPause.innerHTML = "pause";
    this.ctrlPlayPause.dataset.mode = "pause";
    // start progress bar
    this.progressTimer = window.setInterval(this.checkProgress, 10, this);
  } else {
    // what happens here?
    console.log("track not ready for playing");
  }
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
  //window.clearInterval(this.progressTimer);
  //this.progressTimer = null;
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
  // volume can't be negative, but the slider can pass negative values
  // check if chosen is smaller than 0, set to 0 if so
  if(chosen<0){
    chosen = 0;
  }
  this.globalVolume = chosen / total;
  // adjust volume of current track
  this.trackList[this.trackIndex].setVolume(this.globalVolume);
};
