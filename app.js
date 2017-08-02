//Express Server setup
//routes and rest triggers
const express = require("express");
const bodyParser = require("body-parser");

const api = require('./routes/api');
var app = express();

app.use(express.static(__dirname + '/home'));
app.use('/npm', express.static(__dirname + '/node_modules/'));
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '5mb'
}));
app.use(bodyParser.json({
    limit: '5mb'
}));

//all api calls go through the api router
app.use('/api', api);

//start the express server
var server = app.listen(3000, function() {});

//routes
app.get('/', function(req, res) {
    'use strict';
    res.redirect('/home/index.html');
});

app.all('/*', function(req, res, next) {
    'use strict';
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('home/index.html', {
        root: __dirname
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
/* ----- end express seetup ------- */

module.exports = app;
