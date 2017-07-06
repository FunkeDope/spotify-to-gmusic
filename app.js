'use strict';
require('console-stamp')(console, 'HH:MM:ss.l'); //timestamp all console logs
var config = require('./config'),
	request = require("request"),
	cheerio = require("cheerio"),
	http = require('http'),
	util = require('util'),
	sanitize = require("sanitize-filename"),
	fs = require('fs'),
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
app.get('/api/status/', function(req, res) {
	winston.log('get status?');

});


app.get('/add/', function(req, res) {
	var html = '<form method="post" action="/api/watch"><input type="text" placeholder="Query Name" name="queryName"><br><input type="text" placeholder="Disk Path" name="diskPath"><br><button type="submit" name="submit">Add</button></form>';
	res.send(html);
});
app.post('/api/watch/', function(req, res) {

});
app.all('/*', function(req, res, next) {
	// Just send the index.html for other files to support HTML5Mode
	res.sendFile('dashboard/index.html', {
		root: __dirname
	});
});
