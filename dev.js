require('dpd-router-middleware')(require('deployd/lib/router'), 'middleware');

var deployd = require('deployd');

var server = deployd({
    port: 2403,
    env: 'development',
    db: {
        host: 'localhost',
        port: 27017,
        name: 'dpdstarter' // change this to desired database name
    }
});

server.listen();

server.on('listening', function () {
    console.log("Server is listening");
});

server.on('error', function (err) {
    console.error(err);
    process.nextTick(
            function () { // Give the server a chance to return an error
                process.exit();
            });
});