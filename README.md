# AudioPlayer

This fully funcitonal audioplayer is built with JavaScript.

To have a player on your page, put the following HTML code where you want to include the player:

<div class="dal_audioplayer" id="audioplayer">
  <ul>
    <li><audio src="data/my_audio_file.mp3" preload="metadata"></audio>My track title</li>
  </ul>
</div>

You can put in as many audio tracks as you want.

At the end of your page, include a link to the audio player script and include the detection script:

´´´<script src="audioplayer.js" type="text/javascript"></script>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function(e){
    detectAudioPlayers();
  });
</script>
´´´
