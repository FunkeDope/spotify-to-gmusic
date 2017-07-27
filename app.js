require('console-stamp')(console, 'HH:MM:ss.l'); //timestamp all console logs
const config = require('./config'),
    //request = require("request"),
    //cheerio = require("cheerio"),
    http = require('http'),
    util = require('util'),
    //sanitize = require("sanitize-filename"),
    //fs = require('fs'),
    url = require('url');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

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

//local functions and wrappers
var spGetPlaylistTracks,
    gpmLookupSong,
    gpmCreatePlaylist,
    gpmAddToPlaylist;



//Express Server setup
//routes and rest triggers
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(express.static(__dirname + '/dashboard'));
app.use('/scripts', express.static(__dirname + '/bower_components/'));
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '5mb'
}));
app.use(bodyParser.json({
    limit: '5mb'
}));
app.use(function(error, req, res, next) {
    'use strict';
    if(!error) {
        next();
    }
    else {
        console.error(error.stack);
        res.send(500);
    }
});
//start the express server
var server = app.listen(3000, function() {});
server.timeout = 2 * 60 * 1000; //2min timeout

//routes
app.get('/', function(req, res) {
    'use strict';
    res.redirect('/dashboard/index.html');
});

//takes a spotify playlist url, parses it, and returns and array of tracks
app.post('/api/getspplaylist/', function(req, res) {
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
app.get('/api/list/gpl', function(req, res) {
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
app.post('/api/lookupongpm', function(req, res) {
    'use strict';
    req.socket.setTimeout(10 * 60 * 1000); // 10 minutes timeout just for this POST
    var tracks = req.body.tracks;
    var googleTracks = [];
    var promises = [];
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
});

//creates a gpm pl with a name and description, then populates it with tracks
app.post('/api/creategpmplaylist', function(req, res) {
    'use strict';
    var gpmPlaylist = {
        name: entities.decode(req.body.plName), //spotify gives us html entities we need to convert before sending to google
        description: entities.decode(req.body.plDescription),
        tracks: req.body.tracks
    };

    console.log('creating playlist: ' + gpmPlaylist.name, 'total tracks: ' + gpmPlaylist.tracks.length);

    //make the gpm pl
    gpmCreatePlaylist(gpmPlaylist.name, gpmPlaylist.description).then(function(data) {
        var plID = data.mutate_response[0].id;
        console.log('success! pl created!', plID, data);

        //now we need to insert tracks into the playlist
        //create an array of only the trackIDs
        var trackIDs = [];
        for(var i = 0, j = gpmPlaylist.tracks.length; i < j; i++) {
            if(gpmPlaylist.tracks[i]) { //skip bad matches. TODO: filter this on front end maybe?
                trackIDs.push(gpmPlaylist.tracks[i].track.storeId);
            }
        }

        gpmAddToPlaylist(trackIDs, plID).then(function(data) {
            console.log('success adding to pl!', data);
            res.send(data);
        }).catch(function(err) {
            console.error('error adding to gpm pl', err);
            res.send(err);
        });

    }).catch(function(err) {
        console.log('err creating pl!', err);
    });
});

app.all('/*', function(req, res, next) {
    'use strict';
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('dashboard/index.html', {
        root: __dirname
    });
});
/* ----- end express seetup ------- */



//connect to the two APIs
spConnectToAPI();
gpmConnectToAPI();




/* promise wrappers and logic*/
function spConnectToAPI() {
    'use strict';
    spotifyApi.clientCredentialsGrant().then(function(data) {
            console.log('Spotify Access Token Granted for ' + data.body.expires_in + ' seconds.');
            //console.log('The access token is ' + data.body['access_token']);
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body.access_token);
        },
        function(err) {
            console.log('Something went wrong when retrieving an access token', err.message);
        }
    );
}

function gpmConnectToAPI() {
    'use strict';
    pm.login({
        email: config.google.user,
        password: config.google.appPW,
        androidId: config.google.androidID
    }, function(err, data) {
        if(err) {
            console.error(err);
        }

        pm.init({
                androidId: data.androidId,
                masterToken: data.masterToken
            },
            function(err) {
                if(err) {
                    console.error(err);
                }
                else {
                    console.log('GPM Token Granted for AndroidID: ' + data.androidId);
                }
            });
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
