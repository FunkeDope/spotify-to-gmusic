'use strict';
require('console-stamp')(console, 'HH:MM:ss.l'); //timestamp all console logs
var config = require('./config'),
    //request = require("request"),
    //cheerio = require("cheerio"),
    http = require('http'),
    util = require('util'),
    //sanitize = require("sanitize-filename"),
    //fs = require('fs'),
    winston = require('winston'),
    url = require('url');

//spotify goodness
var SpotifyWebApi = require('spotify-web-api-node');

winston.configure({
    transports: [
		new(winston.transports.Console)(),
		new(winston.transports.File)({
            filename: 'log.log',
            json: false
        })
    ]
});

//fuckin google shit
var PlayMusic = require('playmusic');
var pm = new PlayMusic();
pm.login({
    email: config.google.user,
    password: config.google.appPW,
    androidId: config.google.androidID
}, function(err, data) {
    if(err) console.error(err);
    // place code here
    //console.log('got master token:', data);
    pm.init({
        androidId: data.androidId,
        masterToken: data.masterToken
    }, function(err) {
        if(err) console.error(err);
    })
});

var getPlaylistTracks,
    lookupOnGoogle,
    gpmCreatePlaylist,
    gpmAddToPlaylist;

//routes and rest triggers
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
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
server.timeout = 240000;
app.get('/', function(req, res) {
    res.redirect('/dashboard/index.html');
});
app.get('/log/', function(req, res) {
    fs.readFile('log.log', 'utf8', function(err, contents) {
        //contents = contents.split("\n");
        //json = JSON.stringify(json, null, 4);
        res.send('<pre>' + contents + '</pre>');
    });
});


//takes a spotify playlist url, parses it, and returns and array of tracks
app.post('/api/parse/', function(req, res) {
    var spotifyPlaylistURL = req.body.spotifyPlaylistURL;
    console.log('attempting to parse:', spotifyPlaylistURL);
    // https://open.spotify.com/user/droldness/playlist/2RxIXT72Emcypl7IFWUCW1
    var parts = url.parse(spotifyPlaylistURL);
    parts = parts.path.split('/');
    var userID = parts[2];
    var playlistID = parts[4];

    var promises = [];

    //gets all the tracks in a playlist
    var promise = getPlaylistTracks(userID, playlistID).then(function(data) {
        return data;
    }).catch(function(err) {
        console.log('err getting playlist tracks: ', err);
        return err;
    });
    promises.push(promise);

    //get details about the playlist
    promise = spotifyApi.getPlaylist(userID, playlistID)
        .then(function(data) {
            return data.body;
        }, function(err) {
            console.log('Something went wrong!', err);
            return err
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


app.post('/api/lookup/', function(req, res) {
    var tracks = req.body.tracks;
    console.log(tracks);
});

app.get('/api/list/gpl', function(req, res) {
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

app.post('/api/lookupongpm', function(req, res) {
    req.socket.setTimeout(10 * 60 * 1000); // 10 minutes timeout just for this POST
    var tracks = req.body.tracks;
    var googleTracks = [];
    var promises = [];
    for(var i = 0, j = tracks.length; i < j; i++) {
        promises.push(lookupOnGoogle(tracks[i]));
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

app.post('/api/creategpmplaylist', function(req, res) {
    var gpmPlaylist = {
        name: req.body.plName,
        tracks: req.body.tracks
    };

    console.log('creating playlist: ' + gpmPlaylist.name, 'total tracks: ' + gpmPlaylist.tracks.length);

    gpmCreatePlaylist(gpmPlaylist.name).then(function(data) {
        //now we need to insert tracks into the playlist
        var plID = data.mutate_response[0].id;
        console.log('success! pl created!', plID, data);

        //create an array of only the trackIDs
        var trackIDs = [];
        for(var i = 0, j = gpmPlaylist.tracks.length; i < j; i++) {
            if(gpmPlaylist.tracks[i]) { //skip bad matches. TODO: filter this on front end maybe?
                trackIDs.push(gpmPlaylist.tracks[i].track.storeId);
            }
        }

        gpmAddToPlaylist(trackIDs, plID).then(function(data) {
            console.log('success adding to pl!', data);
        }).catch(function(err) {
            console.error('error adding to gpm pl', err);
        })



    }).catch(function(err) {
        console.log('err creating pl!', err);
    });


    res.send('yahhhh');
});




app.all('/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('dashboard/index.html', {
        root: __dirname
    });
});

lookupOnGoogle = function(track) {
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
    })
};

gpmCreatePlaylist = function(name) {
    return new Promise(function(resolve, reject) {
        pm.addPlayList(name, function(err, data) {
            return resolve(data);
        }, function(err) {
            console.log(err);
            return reject(err);
        });
    })
}

gpmAddToPlaylist = function(trackIDs, plID) {
    return new Promise(function(resolve, reject) {
        pm.addTrackToPlayList(trackIDs, plID, function(err, data) {
            return resolve(data);
        }, function(err) {
            console.log(err);
            return reject(err);
        });
    })
}

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientID,
    clientSecret: config.spotify.clientSecret,
    redirectUri: 'http://localhost:3000/api/callback'
});
spotifyApi.clientCredentialsGrant()
    .then(function(data) {
        //console.log('The access token expires in ' + data.body['expires_in']);
        //console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    }, function(err) {
        console.log('Something went wrong when retrieving an access token', err.message);
    });


getPlaylistTracks = function(userID, playlistID, o, t) {
    var offset = o ? o : 0
    var promise = spotifyApi.getPlaylistTracks(userID, playlistID, {
            offset: offset
        })
        .then(function(data) {
                var promise2;
                var pl = data.body;
                var tracks = !t ? pl.items : t.concat(pl.items);

                if(pl.total > pl.limit + pl.offset) {
                    //console.log('total: ' + pl.total + ' | limit: ' + pl.limit + ' | offset: ' + pl.offset);
                    promise2 = getPlaylistTracks(userID, playlistID, offset + pl.limit, tracks).then(function(data) {
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
}
