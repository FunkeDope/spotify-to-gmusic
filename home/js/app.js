Vue.use(VueMaterial);

let App = new Vue({
    el: '#app'
});

let playlistUrl = new Vue({
    el: '#playlist-url',
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
            }
        };
    },
    methods: {
        lookupSpPl() {
                let vm = this;
                //console.log('submit: ', vm.spplURL);
                let payload = {
                    spotifyPlaylistURL: vm.spplURL
                };

                axios.post('/api/getspplaylist/', payload).then(function(resp) {
                    vm.spPlaylist = {
                        tracks: resp.data[0],
                        info: resp.data[1]
                    };
                    //console.log('spotify results: ', spPlaylist);
                    vm.spTracks = [];

                    for(let i = 0, j = vm.spPlaylist.tracks.length; i < j; i++) {
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
                axios.post('/api/lookupongpm', payload).then(function(resp) {
                    vm.gpTracks.tracks = resp.data;
                    console.log('comeback: ', vm.gpTracks.tracks);
                    //figure out what had errors
                    for(var i = 0, j = vm.gpTracks.tracks.length; i < j; i++) {
                        if(!vm.gpTracks.tracks[i]) {
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

                axios.post('/api/creategpmplaylist', payload).then(function(data) {
                    console.log(data);
                }).catch(function(err) {
                    console.err('err creating playlist', err);
                });
            }
    }
});
