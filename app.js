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
    console.log('got master token:', data);
    pm.init({
        androidId: data.androidId,
        masterToken: data.masterToken
    }, function(err) {
        if(err) console.error(err);
    })
});

var getPlaylist;

//routes and rest triggers
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(express.static(__dirname + '/dashboard'));
app.use('/scripts', express.static(__dirname + '/bower_components/'));
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
//start the express server
var server = app.listen(3000, function() {});
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

    getPlaylist(userID, playlistID).then(function(data) {
        console.log(data.length);
        var playlist = {}
        res.send(data);
    }).catch(function(err) {
        console.log('err getting playlist tracks: ', err);
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

app.post('/api/importtogpm', function(req, res) {
    var tracks = req.body.tracks;
    var googleTracks = [];
    var promises = [];
    for(var i = 0, j = 5; i < j; i++) {
        var promise = Promise.resolve(pm.search(tracks[i].song + ' ' + tracks[i].artist, 5, function(err, data) { // max 5 results
            if(err) {
                console.log(err);
            }
            else {
                var song = data.entries.sort(function(a, b) { // sort by match score
                    return a.score < b.score;
                }).shift(); // take first song
                return song;
            }
        }));
        promises.push(promise);
    }

    Promise.all(promises).then(function(data) {
        console.log(data);
        res.send(data);
    }).catch(function(err) {
        console.log(err);
        res.send(err);

    });
});




app.all('/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('dashboard/index.html', {
        root: __dirname
    });
});


// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientID,
    clientSecret: config.spotify.clientSecret,
    redirectUri: 'http://localhost:3000/api/callback'
});
spotifyApi.clientCredentialsGrant()
    .then(function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    }, function(err) {
        console.log('Something went wrong when retrieving an access token', err.message);
    });


getPlaylist = function(userID, playlistID, o, t) {
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
                    promise2 = getPlaylist(userID, playlistID, offset + pl.limit, tracks).then(function(data) {
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
