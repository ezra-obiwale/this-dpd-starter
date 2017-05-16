cancelUnless(body.email, 'Email must be specified!');

var app = require('../package.json').app,
    parse = function(text, data) {
        for(var key in data) {
            text = text.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
        }
        return text;
    };
// get user with email as username
dpd.users.get({username: body.email}, function(users) {
    cancelUnless(users.length, 'No account found for that email!');
    cancelUnless(users[0].verificationToken, 'Account already has been verified!');
    // get template file
    dpd.template.post({"template": 'verify-email.html'}, function(data) {
        // send email
        dpd.email.post({
            to: users[0].username,
            subject: 'Verify your email for ' + app.name,
            html: parse(data.html, {
                appName: app.name,
                link: app.urls.server + '/verify-email/' + users[0].verificationToken
            })
        }, setResult);
    });
});