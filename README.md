# AudioPlayer

This fully funcitonal audioplayer is built with JavaScript. It is built to be fully accessible for keyboard, mouse and mobile users.

There is no maximum length for tracks, the audioplayer should be able to handle everything from short sound snippets to full podcasts. The audioplayer will detect provided tracks and play whatever version works best on your users' browsers. Keep in mind, for full support, to include audio files in different formats.

## Themes

The audiplayer comes with a very bare-bones theme. You can customize its appearance by changing the audioplayer.css stylesheet file. More themes might be added in the future.

## Integrating the player

To have a player on your page, put the following HTML code where you want to include the player:

```html
<div class="dal_audioplayer" id="audioplayer">
  <ul>
    <li><audio src="data/my_audio_file.mp3" preload="metadata"></audio>My track title</li>
  </ul>
</div>
```

You can put in as many audio tracks as you want, as long as you specify them as in the example above.

At the end of your page, include a link to the audio player script and include the detection script:

```html
<script src="audioplayer.js" type="text/javascript"></script>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function(e){
    detectAudioPlayers();
  });
</script>
```
