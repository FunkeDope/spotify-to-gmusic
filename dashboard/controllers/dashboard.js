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
            for(var i = 0, j = $scope.playlist.items.length; i < j; i++) {
                $scope.tracks.push({
                    song: $scope.playlist.items[i].track.name,
                    artist: $scope.playlist.items[i].track.artists[0].name,
                    album: $scope.playlist.items[i].track.album.name,
                    art: $scope.playlist.items[i].track.album.images[0].url
                });
            }
        });
    }
}

angular
    .module('app')
    .controller('MasterCtrl', MasterCtrl)
    .controller('LookupCtrl', LookupCtrl);
