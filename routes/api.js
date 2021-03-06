const express = require('express');
const router = express.Router();
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const url = require('url'),
    util = require('util'),
    config = require('../config');

//local functions and wrappers
var spGetPlaylistTracks,
    gpmLookupSong,
    gpmCreatePlaylist,
    gpmAddToPlaylist;

//spotify goodness
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientID,
    clientSecret: config.spotify.clientSecret,
    redirectUri: 'http://localhost:3000/api/callback'
});
//fuckin google shit
const PlayMusic = require('playmusic');
const pm = new PlayMusic();

var reAuthTimer; //timer to reauth with spotify


//takes a spotify playlist url, parses it, and returns and array of tracks
router.post('/getspplaylist/', function(req, res) {
    'use strict';
    var spotifyPlaylistURL = req.body.spotifyPlaylistURL;
    console.log('attempting to parse:', spotifyPlaylistURL);
    var parts = url.parse(spotifyPlaylistURL);
    parts = parts.path.split('/');
    var userID = parts[2]; //TODO: parse playlist url better
    var playlistID = parts[4];

    var promises = [];

    //gets all the tracks in a playlist
    var promise = spGetPlaylistTracks(userID, playlistID).then(function(data) {
        return data;
    }).catch(function(err) {
        console.log('err getting playlist tracks: ', err);
        return err;
    });
    promises.push(promise);

    //get some general details about the playlist (name, description, owner, etc)
    promise = spotifyApi.getPlaylist(userID, playlistID)
        .then(function(data) {
            return data.body;
        }, function(err) {
            console.log('Something went wrong!', err);
            return err;
        });
    promises.push(promise);

    //send back when done
    Promise.all(promises).then(function(data) {
        res.send(data);
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

//lists the current user's gpm playlists
router.get('/list/gpl', function(req, res) {
    'use strict';
    pm.getPlayLists(function(err, data) {
        var resp;
        if(err) {
            console.log(err);
            resp = err;
        }
        else {
            resp = data.data.items;
        }
        res.send(resp);
    });
});

//looks up songs on gpm one at a time
router.post('/lookupongpm', function(req, res) {
    'use strict';
    req.socket.setTimeout(10 * 60 * 1000); // 10 minutes timeout just for this POST
    var tracks = req.body.tracks;
    var googleTracks = [];
    var promises = [];
    var user = req.body.user;

    gpmConnectToAPI(user).then(function(data) {
        for(var i = 0, j = tracks.length; i < j; i++) {
            promises.push(gpmLookupSong(tracks[i]));
        }
        Promise.all(promises).then(function(data) {
            //console.log(data);
            console.log('found ' + promises.length + ' matching tracks on google');
            res.send(data);
        }).catch(function(err) {
            console.log(err);
            res.send(err);
        });
    }).catch(function(err) {
        console.log('error auth gpm', err);
        res.send(err);
    })
});

//creates a gpm pl with a name and description, then populates it with tracks
router.post('/creategpmplaylist', function(req, res) {
    'use strict';
    var gpmPlaylist = {
        name: entities.decode(req.body.info.name), //spotify gives us html entities we need to convert before sending to google
        description: entities.decode(req.body.info.description),
        tracks: req.body.tracks
    };

    console.log('creating playlist: ' + gpmPlaylist.name, 'total tracks: ' + gpmPlaylist.tracks.length);

    var user = req.body.user;
    gpmConnectToAPI(user).then(function(data) {
        //make the gpm pl
        gpmCreatePlaylist(gpmPlaylist.name, gpmPlaylist.description).then(function(data) {
            var plID = data.mutate_response[0].id;
            console.log('success! pl created!', plID, data);

            //now we need to insert tracks into the playlist
            //create an array of only the trackIDs
            var trackIDs = [];
            console.log(gpmPlaylist.tracks);
            for(var i = 0, j = gpmPlaylist.tracks.length; i < j; i++) {
                if(gpmPlaylist.tracks[i].storeId !== 'error') { //skip bad matches. TODO: filter this on front end maybe?
                    trackIDs.push(gpmPlaylist.tracks[i].storeId);
                }
            }
            gpmAddToPlaylist(trackIDs, plID).then(function(data) {
                console.log('success adding to pl!', data);
                var ret = {
                    tracks: data.mutate_response,
                    status: 200
                };
                res.send(ret);
            }).catch(function(err) {
                console.error('error adding to gpm pl', err);
                res.send(err);
            });

        }).catch(function(err) {
            console.log('err creating pl!', err);
        });
    }).catch(function(err) {
        console.log('err init gpm auth', err);
    });
});

//check if we can login and auth with gpm
router.post('/authgpm', function(req, res) {
    'use strict';
    var user = req.body.user;
    var promise = gpmConnectToAPI(user).then(function(data) {
        console.log('success?', data);
        res.send(data);

    }).catch(function(err) {
        console.error('error authing with GPM', err);
        res.send(err);
    });
});

//connect to the two APIs
spConnectToAPI();
//gpmConnectToAPI();




/* promise wrappers and logic*/
function spConnectToAPI() {
    'use strict';
    spotifyApi.clientCredentialsGrant().then(function(data) {
            console.log('Spotify Access Token Granted for ' + data.body.expires_in + ' seconds.');
            //console.log('The access token is ' + data.body['access_token']);
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body.access_token);

            //call again when it expires
            try {
                clearTimeout(reAuthTimer);
            }
            catch(e) {
                console.err('can\'t cancel timer');
            }

            reAuthTimer = setTimeout(spConnectToAPI, (data.body.expires_in - 30) * 1000);

        },
        function(err) {
            console.log('Something went wrong when retrieving an access token', err.message);
        }
    );
}

function gpmConnectToAPI(user) {
    'use strict';
    return new Promise(function(resolve, reject) {
        if(user.masterToken) {
            pm.init({
                    androidId: user.androidID,
                    masterToken: user.masterToken
                },
                function(err) {
                    if(err) {
                        return reject(err);
                    }
                    else {
                        console.log('GPM Access Granted for AndroidID: ' + user.androidID);
                        return resolve(user);
                    }
                });
        }
        else {
            pm.login({
                email: user.email,
                password: user.pass,
                androidId: user.androidID
            }, function(err, data) {
                if(err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    data.status = 200;
                    resolve(data);
                }
            });

        }
    });
}



gpmLookupSong = function(track) {
    'use strict';
    return new Promise(function(resolve, reject) {
        pm.search(track.artist + ' ' + track.song, 5, function(err, data) { // max 5 results
            //console.log(data.entries);
            var songChoices = [];
            for(var x = 0, y = data.entries.length; x < y; x++) {
                if(data.entries[x].type === '1') {
                    songChoices.push(data.entries[x]);
                }
            }
            return resolve(songChoices[0]);
        }, function(message, body, err, httpResponse) {
            console.log(message);
            return reject(message);
        });
    });
};

gpmCreatePlaylist = function(name, description) {
    'use strict';
    return new Promise(function(resolve, reject) {
        pm.addPlayList(name, description, function(err, data) {
            return resolve(data);
        }, function(err) {
            console.log(err);
            return reject(err);
        });
    });
};

gpmAddToPlaylist = function(trackIDs, plID) {
    'use strict';
    return new Promise(function(resolve, reject) {
        pm.addTrackToPlayList(trackIDs, plID, function(err, data) {
            return resolve(data);
        }, function(err) {
            console.log(err);
            return reject(err);
        });
    });
};


spGetPlaylistTracks = function(userID, playlistID, o, t) {
    'use strict';
    var offset = o ? o : 0;
    var promise = spotifyApi.getPlaylistTracks(userID, playlistID, {
            offset: offset
        })
        .then(function(data) {
                var promise2;
                var pl = data.body;
                var tracks = !t ? pl.items : t.concat(pl.items);

                if(pl.total > pl.limit + pl.offset) {
                    //console.log('total: ' + pl.total + ' | limit: ' + pl.limit + ' | offset: ' + pl.offset);
                    promise2 = spGetPlaylistTracks(userID, playlistID, offset + pl.limit, tracks).then(function(data) {
                        return data;
                    }).catch(function(err) {
                        console.log('err in recursion', err);
                    });
                }
                console.log('total tracks so far: ' + tracks.length);
                return promise2 ? promise2 : tracks;
            },
            function(err) {
                console.log('Something went wrong!', err);
            });
    return promise;
};


module.exports = router;
