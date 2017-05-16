cancelUnless(body.email, 'Email must be specified!');

var app = require('../package.json').app,
    hash = require('string-hash'),
    token = hash(body.email + Date.now()) + 'T' + Date.now(),
    parse = function(text, data) {
        for(var key in data) {
            text = text.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
        }
        return text;
    };
    
// get user with email as username
dpd.users.get({username: body.email}, function(users) {
    cancelUnless(users.length, 'No account found for that email!');
    // save token
    dpd.users.put(users[0].id, {passwordToken:token}, function(user, error) {
        // reset url
        var url = app.urls.client + app.urls.resetPassword;
        if (url.indexOf('?') !== -1) {
            url += '&';
        }
        else {
            url += '?';
        }
        url += 'token=' + token;
        // get template file
        dpd.template.post({"template": 'reset-password.html'}, function(data) {
            // send email
            dpd.email.post({
                to: user.username,
                subject: 'Reset Password for ' + app.name,
                html: parse(data.html, {
                            appName: app.name,
                            link: url
                        })
            }, setResult);
        }); 
    });
});