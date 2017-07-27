function MasterCtrl($scope) {
    'use strict';
    $scope.test = 'heyyyyy';
    console.log($scope.test);
}

function LookupCtrl($scope, $http, $q, $mdPanel) {
    'use strict';
    $scope.spotifyURL = '';
    $scope.spTracks = [];
    $scope.spPlaylist = {};
    $scope.gpPlaylists = {};
    $scope.gpTracks = {
        tracks: [],
        errors: []
    };

    //lookup a spotify playlist and get the tracklist
    $scope.lookUp = function(url) {
        //reset everything!
        $scope.spTracks = [];
        $scope.spPlaylist = {};
        $scope.gpTracks.tracks = [];
        $scope.gpTracks.errors = [];

        var payload = {
            spotifyPlaylistURL: url
        };
        $http.post('/api/getspplaylist/', JSON.stringify(payload)).then(function(resp) {
            $scope.spPlaylist = {
                tracks: resp.data[0],
                info: resp.data[1]
            };
            console.log('spotify results: ', $scope.spPlaylist);
            $scope.spTracks = [];
            for(var i = 0, j = $scope.spPlaylist.tracks.length; i < j; i++) {
                $scope.spTracks.push({
                    song: $scope.spPlaylist.tracks[i].track.name,
                    artist: $scope.spPlaylist.tracks[i].track.artists[0].name,
                    album: $scope.spPlaylist.tracks[i].track.album.name,
                    art: $scope.spPlaylist.tracks[i].track.album.images.length ? $scope.spPlaylist.tracks[i].track.album.images[0].url : ''
                });
            }
        });
    }


    //look up  an array of tracks on google play music and get their unique ids
    $scope.lookupTracksOnGoogle = function() {
        if($scope.spTracks.length > 0) {
            var payload = {
                tracks: $scope.spTracks
            }
            $http.post('/api/lookupongpm', JSON.stringify(payload)).then(function(resp) {
                $scope.gpTracks.tracks = resp.data;
                //figure out what had errors
                for(var i = 0, j = $scope.gpTracks.tracks.length; i < j; i++) {
                    if(!$scope.gpTracks.tracks[i]) {
                        $scope.gpTracks.errors.push(i);
                    }
                }
                console.log('google results:', $scope.gpTracks);
            }).catch(function(err) {
                console.log('error posting to import', err);
            });
        }
        else {
            console.log('err. no tracks.');
        }
    }

    //actually do the deed and create the playlist on google!
    $scope.createGooglePlaylist = function() {
        if($scope.gpTracks.tracks.length > 0) {
            var payload = {
                tracks: $scope.gpTracks.tracks,
                plName: $scope.spPlaylist.info.name,
                plDescription: $scope.spPlaylist.info.description || ''
            }

            $http.post('/api/creategpmplaylist', JSON.stringify(payload)).then(function(data) {
                console.log(data);
            }).catch(function(err) {
                console.err('err creating playlist', err);
            });
        }
        else {
            console.err('no tracks!')
        }
    };



    //get current google music playlists
    $scope.getGooglePlaylists = function() {
        $http.get('/api/list/gpl').then(function(resp) {
            $scope.gpPlaylists = resp.data;
            console.log('google pl results: ', $scope.gpPlaylists);
        });
    };
}

angular
    .module('app')
    .controller('MasterCtrl', MasterCtrl)
    .controller('LookupCtrl', LookupCtrl);
