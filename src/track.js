// This file contains the Track object, which provides wrappers for the HTML media element


// track object has wrappers for the HTMLMediaElement
function Track(el) {
  this.el = el;
  this.formattedTotalDuration = "";
  this.available = false;

  // add total duration info to track:
  this.lblDuration = document.createElement("span");
  this.lblDuration.className = "apDuration";

  // add progress bar for loading:
  this.loadProgress = document.createElement("div");
  this.loadProgress.className = "apProgressBar";
  this.el.parentNode.appendChild(this.loadProgress);

  // start loading the track:
  //this.el.load();

  // show some kind of loading animation / indication here...

  // check loading progress:
  this.el.addEventListener("progress", function(e){
    // read how much is buffered
    var b = this.el.buffered;
    var loaded = 0;
    if(b.length==1) {
      // calculate what's been loaded
      loaded = b.end(0) / this.el.duration;
    }
    // update load progress bar
    this.loadProgress.style = "width: "+ loaded*100 +"%;";
  }.bind(this));

  // track has downloaded a first frame
  this.el.addEventListener("loadeddata", function(e){
    var HAVE_NOTHING = 0,
      HAVE_METADATA = 1,
      HAVE_CURRENT_DATA = 2,
      HAVE_FUTURE_DATA = 3,
      HAVE_ENOUH_DATA = 4;

    // if info is available: add total duration info
    if(this.el.readyState===HAVE_METADATA || this.el.readyState===HAVE_CURRENT_DATA || this.el.readyState===HAVE_FUTURE_DATA || this.el.readyState===HAVE_ENOUH_DATA) {
      // format time nicely:
      var ct = this.getTotalTime();
      var ctHours = Math.floor(ct/3600);
      var ctMinutes = Math.floor((ct - (ctHours*60))/60);
      var ctSeconds = Math.floor(ct - (ctHours*60)-(ctMinutes*60));
      if(ctHours < 10) ctHours = "0"+ctHours;
      if(ctMinutes < 10) ctMinutes = "0"+ctMinutes;
      if(ctSeconds < 10) ctSeconds = "0"+ctSeconds;
      // only show hours if it is relevant:
      if(ctHours === "00") {
        this.formattedTotalDuration = ctMinutes +":"+ ctSeconds;
      } else {
        this.formattedTotalDuration = ctHours +":"+ ctMinutes +":"+ ctSeconds;
      }
      this.lblDuration.innerHTML = this.formattedTotalDuration;
      // append text node to container
      this.el.parentNode.appendChild(this.lblDuration);
    }
  }.bind(this));

  // track has fully loaded, add flag
  this.el.addEventListener("canplay", function(e){
    var HAVE_NOTHING = 0,
      HAVE_METADATA = 1,
      HAVE_CURRENT_DATA = 2,
      HAVE_FUTURE_DATA = 3,
      HAVE_ENOUH_DATA = 4;

    if(this.el.readyState===HAVE_ENOUH_DATA) {
      // label track as available for playing:
      this.available = true;
    }
    //this.loadProgress.style = "width: 100%;";
  }.bind(this));

  // track can't continue to play (display some sort of buffering indication)
  this.el.addEventListener("waiting", function(e){
    // buffering animation goes here
    this.el.parentNode.className += " apBuffering";
    console.log("buffering...");
  }.bind(this));

  // track is resuming after buffering
  this.el.addEventListener("playing", function(e){
    // cancel buffering animation, if there is one
    console.log("resuming");
    var classes = this.el.parentNode.className;
    this.el.parentNode.className = classes.replace(" apBuffering", "");
  }.bind(this));
}


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
};

Track.prototype.canPlay = function() {
  return this.available;
};
