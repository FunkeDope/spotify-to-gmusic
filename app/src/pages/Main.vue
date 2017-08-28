<template>
<div>
    <div class="container">
        <!-- url top bar -->
        <playlist-url></playlist-url>
        

        <md-layout md-row md-gutter>
            <!-- spotify -->
            <!--<spotify-list></spotify-list>-->
            <track-list src="spotify"></track-list>
            

            <!-- controls -->
            <md-layout md-column md-flex>
                <md-button class="md-raised md-primary" @click="lookupOnGPM" :disabled="!spotify.tracks.length">2: Lookup on GPM</md-button>
                <md-button class="md-raised md-accent" @click="createGPMPlaylist" :disabled="!google.tracks.length">3: Create GPM Playlist!</md-button>
            </md-layout>


            <!-- GPM -->
            <track-list src="google"></track-list>
        </md-layout>
    </div>
    <md-dialog-alert :md-title="alert.title" :md-content="alert.statusMessage" ref="status"></md-dialog-alert>
</div>
</template>

<script>
    import config from '../js/globals.js';
    import axios from 'axios';
    import router from '@/router';
    import PlaylistURL from '@/components/PlaylistURL';
    import TrackList from '@/components/TrackList';
    export default {
        name: 'hello',
        components: {
            'playlist-url': PlaylistURL,
            'track-list': TrackList 
        },
        data() {
            return {
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
            lookupOnGPM() {
                let vm = this;
                let payload = {
                    tracks: vm.spotify.tracks,
                    user: vm.user
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
                                    song: 'error',
                                    artist: 'error',
                                    album: 'error',
                                    art: 'error'
                                }
                            };
                        }
                        else {
                            vm.gpTracks.tracks[i] = {
                                song: vm.gpTracks.tracks[i].track.title,
                                artist: vm.gpTracks.tracks[i].track.artist,
                                album: vm.gpTracks.tracks[i].track.album,
                                art: vm.gpTracks.tracks[i].track.albumArtRef[0].url,
                            };
                        }
                    }
                    vm.$root.$data.google = {
                        info:'',
                        tracks: vm.gpTracks.tracks,
                        errors: vm.gpTracks.errors
                    };
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
                    plDescription: vm.spPlaylist.info.description || '',
                    user: vm.user
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
            
        },
        created: function() {
            if(!this.user || !this.user.isAuthd) {
                console.log('user is not authd with google', this.user);
                router.push('login');
            }
        },
        computed: {
            user: function() {
                return this.$root.$data.user;
            },
            spotify: function() {
                return this.$root.$data.spotify;
            },
            google: function() {
                return this.$root.$data.google;
            }
        }
    }

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .container {
        padding: 0 25px;
    }

</style>
