'use strict';
require('console-stamp')(console, 'HH:MM:ss.l'); //timestamp all console logs
var config = require('./config'),
    //request = require("request"),
    //cheerio = require("cheerio"),
    http = require('http'),
    util = require('util'),
    //sanitize = require("sanitize-filename"),
    //fs = require('fs'),
    winston = require('winston');


winston.configure({
    transports: [
		new(winston.transports.Console)(),
		new(winston.transports.File)({
            filename: 'log.log',
            json: false
        })
    ]
});

//spotify goodness
var SpotifyWebApi = require('spotify-web-api-node');



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
app.get('/api/get/:userID/:playlistID', function(req, res) {
    var spotifyPlaylistID = req.params.playlistID;
    var userID = req.params.userID;
    var tracks;
    spotifyApi.getPlaylistTracks(userID, spotifyPlaylistID)
        .then(function(data) {
            tracks = parsePlaylist(data.body);
            var html = '';
            for(var i = 0, j = tracks.length; i < j; i++) {
                html += tracks[i].artist + ' - ' + tracks[i].song + '<br>'
            }
            res.send(html);
        }, function(err) {
            console.log('Something went wrong!', err);
        });


});

app.get('/api/callback', function(req, res) {
    console.log('cb complete!');
    console.log(req.params);
    console.log(req.post);
});

app.get('/add/', function(req, res) {
    var html = '<form method="post" action="/api/watch"><input type="text" placeholder="Query Name" name="queryName"><br><input type="text" placeholder="Disk Path" name="diskPath"><br><button type="submit" name="submit">Add</button></form>';
    res.send(html);
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



function parsePlaylist(pl) {
    //console.log(pl);
    var tracks = [];
    for(var i = 0, j = pl.items.length; i < j; i++) {
        tracks.push({
            song: pl.items[i].track.name,
            artist: pl.items[i].track.artists[0].name
        });
    }
    return tracks;
}
