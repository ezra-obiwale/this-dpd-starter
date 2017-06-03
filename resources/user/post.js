var app = require('../../package.json').app,
        utils = require('node-utils'),
        parse = utils.parseTemplate,
        login = function (body) {
            cancelUnless(body.email && body.password, 'Email and password are required!');
            dpd.users.login({
                username: body.email,
                password: body.password
            }, function (session, err) {
                cancelUnless(session, err);
                // log from the normal session deployd keeps
                dpd.users.logout();
                setResult({
                    uid: session.uid,
                    apiKey: ctx.session.data.apiKey,
                    expires: ctx.jwt.expires.numeric,
                    refreshToken: ctx.session.data.refreshToken
                });
            });
        };
switch (parts[0]) {
    // without JWT token
    case 'revive-token':
        cancelUnless(body.id && body.refreshToken, 'User id and refresh token are required!');
        dpd.accesstokens.get({
            user: body.id,
            refreshToken: body.refreshToken
        }, function (tokens, err) {
            cancelUnless(tokens.length, 'Invalid refresh token!');
            ctx.jwt.create(tokens[0].user, {
                issuer: ctx.appUrls.server
            }, function (token, err) {
                cancelUnless(token, err);
                setResult({
                    uid: body.id,
                    apiKey: token,
                    refreshToken: body.refreshToken,
                    expires: ctx.jwt.expires.numeric
                });
                dpd.accesstokens.put(tokens[0].id, {
                    apiKey: token
                });
            });
        });
        break;
        // with JWT token
    case 'change-password':
        cancel('Not Implemented', 501);
        break;
    case 'renew-token': // to renew api token before expiration
        cancelUnless(body.id, 'User not specified!');
        dpd.users.get(body.id, function (user) {
            cancelUnless(user, 'User not found!');
            // create jwt token
            ctx.jwt.create(user, {// options
                issuer: ctx.appUrls.server
            }, function (token, err) { // callback
                cancelIf(err, err);
                setResult({
                    uid: user.id,
                    apiKey: token
                });
                // delete old token
                dpd.accesstokens.del({
                    id: {$ne: null},
                    apiKey: ctx.jwt.token
                });
                // create new token
                dpd.accesstokens.post({
                    user: user.id,
                    apiKey: token,
                    createdDate: Math.floor(Date.now() / 1000),
                    expirationDate: Math.floor(Date.now() / 1000) + 60 * 60
                });
            });

        });
        break;
    case 'revoke-token': // to revoke an api token
        cancelUnless(body.token, 'Token not specified!');
        // delete old token
        dpd.accesstokens.del({
            id: {$ne: null},
            user: ctx.user.id,
            apiKey: body.token
        }, setResult);
        break;
        // without JWT token
    case 'register':
        // set username for deployd
        body.username = body.email;
        // confirm password
        cancelUnless(body.password === body.confirm, 'Passwords mismatch!');
        dpd.users.post(body, function (user, err) {
            cancelIf(err, err);
            if (body.login) {
                return login({
                    email: body.email,
                    password: body.confirm,
                    ig: true
                });
            }
            delete user.verificationToken;
            setResult(user);
        });
        break;
    case 'login': // ajax
        login(body);
        break;
    case 'resend-verification-email': // ajax
        cancelUnless(body.email, 'Email must be specified!');

        // get user with email as username
        dpd.users.get({username: body.email}, function (users) {
            cancelUnless(users && users.length, 'No account found for that email!');
            cancelIf(users[0].verified, 'Account already has been verified!');
            // get template file
            dpd.template.post({"template": 'verify-email.html'}, function (
                    data) {
                // send email
                var SP = require('sparkpost'),
                        sparkpost = new SP(app.sparkpost.key);

                sparkpost.transmissions.send({
                    content: {
                        from: app.sparkpost.fromAddress,
                        subject: 'Verify your email for ' + app.name,
                        html: parse(data.html, {
                            appName: app.name,
                            link: ctx.appUrls.server + '/user/verify-email/' + users[0].verificationToken
                        })
                    },
                    recipients: [
                        {address: users[0].username}
                    ]
                })
                        .then(function (response) {
                            if (response.results.total_accepted_recipients)
                                setResult({
                                    status: 200,
                                    message: 'Mail sent successfully'
                                });
                            else
                                setResult(null, 'Send email failed');
                        })
                        .catch(err => {
                            console.error('Send email failed: ' + err);
                            setResult(null, err);
                        });
            });
        });
        break;
    case 'reset-password': // ajax
        cancelUnless(body.password.trim(), 'Password is required!');
        cancelUnless(body.token, 'Invalid token!');
        cancelUnless(body.password === body.confirm);
        // get user with token
        dpd.users.get({passwordToken: body.token}, function (users) {
            cancelUnless(users.length, 'Invalid token!');
            var user = users[0];
            // update user with new password and remove token
            dpd.users.put(user.id, {
                password: body.password,
                passwordToken: null
            }, setResult);
        });
        break;
    case 'send-password-reset-email': // ajax
        cancelUnless(body.email, 'Email must be specified!');

        var hash = require('string-hash'),
                token = hash(body.email + Date.now()) + 'T' + Date.now();

        // get user with email as username
        dpd.users.get({username: body.email}, function (users) {
            cancelUnless(users.length, 'No account found for that email!');
            // save token
            dpd.users.put(users[0].id, {passwordToken: token}, function (
                    user, error) {
                // reset url
                var url = ctx.appUrls.client + ctx.appUrls.resetPassword;
                if (url.indexOf('?') !== -1) {
                    url += '&';
                }
                else {
                    url += '?';
                }
                url += 'token=' + token;
                // get template file
                dpd.template.post({"template": 'reset-password.html'}, function (
                        data) {
                    var SP = require('sparkpost'),
                            sparkpost = new SP(app.sparkpost.key);

                    sparkpost.transmissions.send({
                        // options: {
                        //   sandbox: true
                        // },
                        content: {
                            from: app.sparkpost.fromAddress,
                            subject: 'Reset Password for ' + app.name,
                            html: parse(data.html, {
                                appName: app.name,
                                link: url
                            })
                        },
                        recipients: [
                            {address: user.username}
                        ]
                    })
                            .then(function (response) {
                                if (response.results.total_accepted_recipients)
                                    setResult({
                                        status: 200,
                                        message: 'Mail sent successfully'
                                    });
                                else
                                    setResult(null, 'Send email failed');
                            })
                            .catch(err => {
                                console.error('Send email failed: ' + err);
                                setResult(null, err);
                            });
                });
            });
        });
        break;
    default:
        cancel('Not Implemented', 501);
}