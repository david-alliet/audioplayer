# AudioPlayer

This fully funcitonal audioplayer is built with JavaScript. It is built to be fully accessible for keyboard, mouse and mobile users.

There is no maximum length for tracks, the audioplayer should be able to handle everything from short sound snippets to full podcasts. The audioplayer will detect provided tracks and play whatever version works best on your users' browsers. Keep in mind, for full support, to include audio files in different formats.

## Multiple vs single tracks

You can add one or multiple tracks to the audioplayer. If only track is listed in the player, it will limit the controls shown to play, volume and a progress bar, displayed in a way to take up as little vertical space as possible. When multiple tracks are specified, the player will include previous and next buttons and will take up more vertical space. 

### TODO:

Add a way for multiple single track players to interact with each other:

- stop one when another one is starting to play
- share the volume setting so that each track starts playing at the same volume
- proceed to the next single track player and start playing it when the track is done

## Themes

The audiplayer comes with a very bare-bones theme. You can customize its appearance by changing the audioplayer.css stylesheet file. More themes might be added in the future.

## Integrating the player

To have a player on your page, put the following HTML code where you want to include the player:

```html
<div class="dal_audioplayer" id="audioplayer">
  <ul>
    <li>
      <audio preload="metadata">
        <source src="data/my_audio_file.mp3">
        <source src="data/my_audio_file_alternate.ogg">
      </audio>
      My track title</li>
  </ul>
</div>
```

You can put in as many audio tracks as you want, as long as you specify them as in the example above:

- put tracks in an unordered list;
- use the audio element to specify the actual file to play;
- you can add multiple audio files per track, the browser will pick what file to play based on what file types it supports.

At the end of your page, include a link to the audio player script and include the detection script:

```html
<script src="dist/audioplayer.js" type="text/javascript"></script>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function(e){
    detectAudioPlayers();
  });
</script>
```
