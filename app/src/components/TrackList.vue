<template>
<md-layout md-column md-flex="40">
    <md-subheader v-if="library.info && library.tracks.length">{{library.info.name}} ({{library.tracks.length}} Tracks)
        <br><span v-html="library.info.description"></span>
    </md-subheader>
    <md-list class="custom-list md-triple-line md-dense">
        <md-list-item v-for="(track, index) in library.tracks" :key="index">
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

</template>

<script>
    export default {
        name: 'TrackList',
        props: ['src'],
        computed: {
            library: function() {
                switch(this.src) {
                    case 'spotify':
                        return this.$root.$data.spotify;
                        break;
                    case 'google':
                        return this.$root.$data.google;
                        break;
                    break;
                }
            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


</style>
