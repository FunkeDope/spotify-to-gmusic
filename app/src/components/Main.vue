<template>
<div>
    <md-whiteframe>
        <md-toolbar>
            <h1 class="md-title">Spotify to Google Play Music Converter</h1>
        </md-toolbar>
    </md-whiteframe>
    <div class="container"> 
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
    <md-dialog-alert :md-title="alert.title" :md-content="alert.statusMessage" ref="status"></md-dialog-alert>
</div>
</template>

<script>
    import config from '../js/globals.js';
    import axios from 'axios';
    export default {
        name: 'hello',
        data() {
            return {
                spplURL: '',
                spPlaylist: {
                    info: '',
                    tracks: []
                },
                spTracks: [],
                gpTracks: {
                    tracks: [],
                    errors: []
                },
                alert: {
                    title: '',
                    statusMessage: ''
                }
            };
        },
        methods: {
            lookupSpPl() {
                let vm = this;
                //reset everything
                vm.spTracks = [];
                vm.gpTracks = {
                    tracks: [],
                    errors: []
                };
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
                    //console.log('nailed it:', vm.spTracks);
                }).catch(function(err) {
                    console.log(err);
                });
            },
            lookupOnGPM() {
                let vm = this;
                let payload = {
                    tracks: vm.spTracks
                };
                axios.post(config.api.v1 + 'lookupongpm', payload).then(function(resp) {
                    vm.gpTracks.tracks = resp.data;
                    console.log('comeback: ', vm.gpTracks.tracks);
                    //figure out what had errors
                    for (var i = 0, j = vm.gpTracks.tracks.length; i < j; i++) {
                        if (!vm.gpTracks.tracks[i]) {
                            vm.gpTracks.errors.push(i);
                            vm.gpTracks.tracks[i] = {
                                track: {
                                    artist: 'error',
                                    album: 'error',
                                    title: 'error',
                                    albumArtRef: [{
                                        url: 'error'
                                    }]
                                }
                            };
                        }
                    }
                    console.log('google filtered tracks and errs:', vm.gpTracks);
                }).catch(function(err) {
                    console.log('error posting to import', err);
                });
            },
            createGPMPlaylist() {
                let vm = this;
                var payload = {
                    tracks: vm.gpTracks.tracks,
                    plName: vm.spPlaylist.info.name,
                    plDescription: vm.spPlaylist.info.description || ''
                };

                axios.post(config.api.v1 + 'creategpmplaylist', payload).then(function(data) {
                    if (data.status === 200) {
                        vm.alert = {
                            title: 'Success!',
                            statusMessage: 'Success! Playlist added to your GPM account!'
                        };
                        vm.$refs['status'].open();
                    } else {
                        vm.alert = {
                            title: 'Success!',
                            statusMessage: 'Error! Something went wrong creating the playlist. Try again.'
                        };
                        vm.$refs['status'].open();
                    }
                    console.log(data);
                }).catch(function(err) {
                    console.error('err creating playlist', err);
                    vm.alert = {
                        title: 'Success!',
                        statusMessage: 'Error! Something went wrong creating the playlist. Try again.'
                    };
                    vm.$refs['status'].open();
                });
            },
        }
    }

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .container {
        padding: 0 25px;
    }

</style>
