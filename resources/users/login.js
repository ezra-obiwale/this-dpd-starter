// block to allow only user/login and social media
cancelUnless(internal, 'Not Allowed', 403);
this.lastLogin = Date.now();
this.passwordToken = null;
var hash = require('string-hash');
// create jwt token
ctx.jwt.create(this, {// options
    issuer: ctx.appUrls.server
}, function (token, err) { // callback
    cancelIf(err, err);
    ctx.session.data.apiKey = token;
    ctx.session.data.refreshToken = hash(token) + '' + Date.now();
    // create new token
    dpd.accesstokens.post({
        user: this.id,
        apiKey: ctx.session.data.apiKey,
        refreshToken: ctx.session.data.refreshToken,
        createdDate: Date.now(),
        expirationDate: ctx.jwt.expires.numeric
    });
}.bind(this));