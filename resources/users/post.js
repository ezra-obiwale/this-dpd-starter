cancelUnless(internal, 'Not Allowed', 403);
if (!this.socialAccount) { // creating user from registration
    var hash = require('string-hash');
    this.verificationToken = hash(this.username + Date.now()) + 'T' + Date.now();
    this.verified = false;
    dpd.template.post({"template": 'verify-email.html'}, function (data) {
        ctx.utils.sendmail({
            recipients: [{address: this.username}],
            subject: 'Verify your email for ' + ctx.getConfig('name', 'Starter App', true),
            body: data.html,
            bodyVariables: {
                appName: ctx.getConfig('name', 'Starter App', true),
                link: ctx.appUrls.server + '/user/verify-email/' + this.verificationToken
            }
        });
    });
}
else { // creating user from social login
    this.verified = true;
    switch (this.socialAccount) {
        case 'google':
            this.firstName = this.profile.name.givenName;
            this.lastName = this.profile.name.familyName;
            if (this.profile.emails.length) {
                this.email = this.profile.emails[0].value;
                this.username = this.profile.emails[0].value;
            }
            break;
        case 'facebook':
            break;
    }
}
