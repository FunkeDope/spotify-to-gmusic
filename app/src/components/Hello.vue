<template>
<md-whiteframe>
    <md-toolbar>
        <h1 class="md-title">Spotify to Google Play Music Converter</h1>
    </md-toolbar>
</md-whiteframe>
<div class="main-wrapper" id="playlist-url">
        <md-layout md-gutter md-row>
            <md-layout md-flex class="form-content">
                <md-layout md-column md-flex="80">
                    <form md-flex @submit.stop.prevent="submit">
                        <md-input-container md-flex="75">
                            <label>Spotify Playlist URL</label>
                            <md-input v-model="spplURL"></md-input>
                        </md-input-container>
                    </form>
                </md-layout>
                <md-layout md-column md-flex>
                    <md-button class="md-raised md-primary" :disabled="!spplURL" @click="lookupSpPl">1: Lookup on Spotify</md-button>
                </md-layout>
            </md-layout>
        </md-layout>

        <md-layout md-row md-gutter>
            <!-- spotify -->
            <md-layout md-column md-flex="40">
                <md-subheader v-if="spPlaylist.info">{{spPlaylist.info.name}} ({{spTracks.length}} Tracks)
                    <br><span v-html="spPlaylist.info.description"></span>
                </md-subheader>
                <md-list class="custom-list md-triple-line md-dense">
                    <md-list-item v-for="(track, index) in spTracks" :key="index">
                        <md-avatar>
                            <img :src="track.art" :alt="track.album">
                        </md-avatar>

                        <div class="md-list-text-container">
                            <span><strong>{{index}}. {{track.song}}</strong></span>
                            <span>{{track.artist}}</span>
                            <p>{{track.album}}</p>
                        </div>
                        <md-divider class="md-inset"></md-divider>
                    </md-list-item>
                </md-list>
            </md-layout>

            <!-- controls -->
            <md-layout md-column md-flex>
                <md-button class="md-raised md-primary" @click="lookupOnGPM" :disabled="!spTracks.length">2: Lookup on GPM</md-button>
                <md-button class="md-raised md-accent" @click="createGPMPlaylist" :disabled="!gpTracks.tracks.length">3: Create GPM Playlist!</md-button>
            </md-layout>


            <!-- GPM -->
            <md-layout md-column md-flex="40">
                <md-subheader v-if="gpTracks.tracks.length">{{gpTracks.tracks.length - gpTracks.errors.length}} Tracks to be Imported
                    <br>{{gpTracks.errors.length}} Error(s) matching tracks.
                </md-subheader>
                <md-list class="custom-list md-triple-line md-dense">
                    <md-list-item v-for="(gpTrack, index) in gpTracks.tracks" :key="index">
                        <md-avatar>
                            <img :src="gpTrack.track.albumArtRef[0].url" :alt="gpTrack.track.album">
                        </md-avatar>

                        <div class="md-list-text-container">
                            <span><strong>{{index}}. {{gpTrack.track.title}}</strong></span>
                            <span>{{gpTrack.track.artist}}</span>
                            <p>{{gpTrack.track.album}}</p>
                        </div>
                        <md-divider class="md-inset"></md-divider>
                    </md-list-item>
                </md-list>
            </md-layout>
        </md-layout>
    </div>
</template>

<script>
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
