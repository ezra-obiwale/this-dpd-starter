// block to allow only user/login and social media
cancelUnless(internal, 'Not Allowed', 403);
this.lastLogin = Date.now();
this.passwordToken = null;
var hash = require('string-hash');
// create jwt token
var token = ctx.jwt.create(this);
cancelUnless(token, 'Create token failed!');
ctx.session.data.apiKey = token;
ctx.session.data.refreshToken = hash(token) + '' + Date.now();
ctx.session.data.verified = this.verified;
if (this.socialAccount)
    ctx.session.data.socialAccount = true;

// create new token
dpd.accesstokens.post({
    user: this.id,
    apiKey: ctx.session.data.apiKey,
    refreshToken: ctx.session.data.refreshToken,
    createdDate: Date.now(),
    expirationDate: ctx.jwt.expires.numeric
});