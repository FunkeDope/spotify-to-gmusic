<template>
    <md-layout md-flex class="form-content">
        <md-layout md-column md-flex="80">
            <form md-flex @submit.stop.prevent="submit">
                <md-input-container md-flex="75">
                    <label>Spotify Playlist URL</label>
                    <md-input name="spotify-playlist" @focus.native="$event.target.select()" v-model="spplURL"></md-input>
                </md-input-container> 
            </form>
        </md-layout> 
        <md-layout md-column md-flex>
            <md-button class="md-raised md-primary" :disabled="!spplURL" @click="lookupSpPl">1: Lookup on Spotify</md-button>
        </md-layout>
    </md-layout>
</template>

<script>
    import axios from 'axios';
    import config from '@/js/globals';
    export default {
        name: 'PlaylistURL',
        data(){
        return {
            spplURL: '',
            spPlaylist: {
                info: '',
                tracks: []
            },
            spTracks: []
        }
        },
        methods: {
            lookupSpPl() {
                let vm = this;
                //reset everything
                vm.spTracks = [];
                vm.$root.$data.spotify = {info: {}, tracks:[]};

                //console.log('submit: ', vm.spplURL);
                let payload = {
                    spotifyPlaylistURL: vm.spplURL
                };

                axios.post(config.api.v1 + 'getspplaylist/', payload).then(function(resp) {
                    vm.spPlaylist = {
                        tracks: resp.data[0],
                        info: resp.data[1]
                    };
                    //console.log('spotify results: ', spPlaylist);
                    vm.spTracks = [];

                    for (let i = 0, j = vm.spPlaylist.tracks.length; i < j; i++) {
                        vm.spTracks.push({
                            song: vm.spPlaylist.tracks[i].track.name,
                            artist: vm.spPlaylist.tracks[i].track.artists[0].name,
                            album: vm.spPlaylist.tracks[i].track.album.name,
                            art: vm.spPlaylist.tracks[i].track.album.images.length ? vm.spPlaylist.tracks[i].track.album.images[0].url : ''
                        });
                    }
                    
                    vm.$root.$data.spotify = {
                        tracks: vm.spTracks,
                        info: vm.spPlaylist.info
                    };
                    
                    //console.log('nailed it:', vm.spTracks);
                }).catch(function(err) {
                    console.log(err);
                });
            },
        }
    }

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


</style>
