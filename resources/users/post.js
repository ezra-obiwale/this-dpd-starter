var hash = require('string-hash'),
    app = require('../package.json').app,
    parse = function(text, data) {
        for(var key in data) {
            text = text.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
        }
        return text;
    };
this.verificationToken = hash(this.username + Date.now());
dpd.template.post({"template": 'verify-email.html'}, function(data) {
    dpd.email.post({
        to: this.username,
        subject: 'Verify your email for ' + app.name,
        html: parse(data.html, {
            appName: app.name,
            link: app.urls.server + '/verify-email/' + this.verificationToken
        })
    });
});
