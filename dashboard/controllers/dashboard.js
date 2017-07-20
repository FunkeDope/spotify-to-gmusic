function MasterCtrl($scope) {
    'use strict';
    $scope.test = 'heyyyyy';
    console.log($scope.test);
}

function LookupCtrl($scope, $http, $q, $mdPanel) {
    'use strict';
    $scope.spotifyURL = '';
    $scope.tracks = [];
    $scope.playlist;

    $scope.lookUp = function(url) {
        var payload = {
            spotifyPlaylistURL: url
        };
        $http.post('/api/parse/', JSON.stringify(payload)).then(function(resp) {
            $scope.playlist = resp.data;
            console.log($scope.playlist);
            $scope.tracks = [];
            for(var i = 0, j = $scope.playlist.length; i < j; i++) {
                $scope.tracks.push({
                    song: $scope.playlist[i].track.name,
                    artist: $scope.playlist[i].track.artists[0].name,
                    album: $scope.playlist[i].track.album.name,
                    art: $scope.playlist[i].track.album.images[0].url
                });
            }
        });
    }
}

angular
    .module('app')
    .controller('MasterCtrl', MasterCtrl)
    .controller('LookupCtrl', LookupCtrl);
