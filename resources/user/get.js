switch (parts[0]) {
    // without JWT token
    case 'verify-email': // http
        var app = require('../../package.json').app,
                utils = require('node-utils'),
                redirect = utils.redirect;
        if (parts.length < 2) {
            redirect(ctx, ctx.appUrls.client + ctx.appUrls.verifyEmailFailed);
        }
        else {
            dpd.users.get({
                verificationToken: parts[1]
            }, function (users, error) {
                if (users.length) {
                    if (users[0].verified) {
                        redirect(ctx, ctx.appUrls.client + ctx.appUrls.verifiedEmailAlready);
                    }
                    else {
                        dpd.users.put(users[0].id, {
                            verified: true
                        }, function (user, error) {
                            if (!user)
                                redirect(ctx, ctx.appUrls.client + ctx.appUrls.verifyEmailFailed);
                            else
                                redirect(ctx, ctx.appUrls.client + ctx.appUrls.verifyEmailSuccess);
                        });
                    }
                }
                else {
                    redirect(ctx, ctx.appUrls.client + ctx.appUrls.verifyEmailFailed);
                }
            });
        }
        break;
        // with JWT token
    case 'me':
        ctx.me(setResult);
        break;
    case 'delete-token':
        dpd.accesstokens.delete({
            id: {$ne: null},
            user: ctx.user.id,
            apiKey: ctx.jwt.token
        }, setResult);
        break;
    default:
        cancel('Not Implemented', 501);
}