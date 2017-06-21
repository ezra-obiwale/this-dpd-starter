var login = function (body, callback) {
    cancelUnless(body.email && body.password, 'Email and password are required!');
    dpd.users.login({
        username: body.email,
        password: body.password
    }, function (session, err) {
        // log out from the normal session deployd keeps
        dpd.users.logout();
        if (callback) {
            callback(session, err);
        }
        else {
            if (!session)
                setResult(session, err);
            else
                setResult({
                    uid: session.uid,
                    apiKey: ctx.session.data.apiKey,
                    expires: Date.now() + ctx.jwt.expires.numeric,
                    refreshToken: ctx.session.data.refreshToken,
                    verified: ctx.session.data.verified,
                    socialAccount: false,
                    path: ctx.session.data.path
                });
        }
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
            ctx.jwt.create(tokens[0].user, function (err, token) {
                cancelUnless(token, err);
                setResult({
                    apiKey: token,
                    expires: Date.now() + ctx.jwt.expires.numeric,
                    verified: tokens[0].user.verified
                });
                dpd.accesstokens.put(tokens[0].id, {
                    apiKey: token
                });
            });
        });
        break;
        // with JWT token
    case 'change-password':
        cancelUnless(body.newPassword === body.confirm, 'Passwords mismatch!');
        // get user
        dpd.users.get(ctx.user.id, function (user) {
            // check old password is correct
            login({
                email: user.username,
                password: body.oldPassword
            }, function (session, err) {
                if (!session)
                    setResult(null, 'Incorrect old password!');
                // Update password
                dpd.users.put(user.id, {
                    password: body.newPassword
                }, setResult);
            });
        });
        break;
    case 'renew-token': // to renew api token before expiration
        cancelUnless(body.id, 'User not specified!');
        dpd.accesstokens.get({
            user: body.id,
            apiKey: ctx.jwt.token
        }, function (tokens, err) {
            cancelUnless(tokens.length, 'Invalid token!');
            // create jwt token
            var token = ctx.jwt.create(tokens[0].user);
            cancelUnless(token, 'Create token failed!');
            // send result
            setResult({
                apiKey: token,
                expires: Date.now() + ctx.jwt.expires.numeric,
                verified: tokens[0].user.verified
            });
            // delete old token
            dpd.accesstokens.del(tokens[0].id, cancelUnless);
            // create new token
            dpd.accesstokens.post({
                user: body.id,
                apiKey: token,
                createdDate: Date.now(),
                expirationDate: Date.now() + ctx.jwt.expires.numeric,
                refreshToken: tokens[0].refreshToken
            }, cancelUnless);
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
        cancelIf(body.hasOwnProperty('confirm') &&
                body.password !== body.confirm, 'Passwords mismatch!');
        var register = function () {
            cancelUnless(ctx.validator.isEmail(body.email), 'Invalid email address!');
            dpd.users.post(body, function (user, err) {
                if (!user) {
                    if (err.errors.username) {
                        err.errors.email = err.errors.username;
                        delete err.errors.username;
                    }
                    return setResult(null, err);
                }
                // log the user in on successful registration
                login({
                    emai: user.email,
                    password: body.confirm
                });
            });
        };
        // check whether should use and check recaptcha
        if (ctx.recaptcha) {
            cancelUnless(body['g-recaptcha-response'], 'You must prove you are not a robot!');
            ctx.recaptcha.validate(body['g-recaptcha-response'])
                    .then(function () {
                        register();
                    })
                    .catch(function (errors) {
                        setResult(null, recaptcha.translateErrors(errors));
                    });
        }
        else register();
        break;
    case 'login': // ajax
        login(body);
        break;
    case 'resend-verification-email': // ajax
        cancelUnless(body.email, 'Email must be specified!');

        // get user with email as username
        dpd.users.get({username: body.email}, function (users) {
            cancelUnless(users && users.length, 'No account found for that email!');
            cancelIf(users[0].verified, 'Account has already been verified!');
            // get template file
            dpd.template.post({"template": 'verify-email.html'}, function (
                    data) {
                // send email
                ctx.utils.sendmail({
                    recipients: [{address: users[0].username}],
                    subject: 'Verify your email for '
                            + ctx.getConfig('name', 'Starter App', true),
                    body: data.html,
                    bodyVariables: {
                        appName: ctx.getConfig('name', 'Starter App', true),
                        link: ctx.appUrls.server + '/user/verify-email/' + users[0].verificationToken
                    },
                    callback: setResult
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
                dpd.template.post({"template": 'reset-password.html'}, function (data) {
                    // send email
                    ctx.utils.sendmail({
                        recipients: [{address: user.username}],
                        subject: 'Reset Password for ' + ctx.getConfig('name', 'Starter App', true),
                        body: data.html,
                        bodyVariables: {
                            appName: ctx.getConfig('name', 'Starter App', true),
                            link: url
                        },
                        callback: setResult
                    });
                });
            });
        });
        break;
    case 'delete-account':
        // cancel if provided id is not the same as the user id in token payload
        cancelIf(body.id !== ctx.user.id, 'Invalid action!');
        // get the user
        dpd.users.get(body.id, function (user) {
            // if account was not created by social login
            cancelIf(!user.profile && (!body.password || !body.email), 'Email and password must be provided!');
            if (body.password) {
                login({email: user.email, password: body.password}, function (session, err) {
                    if (!session)
                        setResult(null, err);
                    dpd.users.del(user.id, setResult);
                });
            }
            else if (body.socialAccountProvider.toLowerCase() !== user.socialAccount.toLowerCase()) {
                cancel('Invalid email address!');
                dpd.users.del(user.id, setResult);
            }
        });
        break;
    default:
        cancel('Not Implemented', 501);
}