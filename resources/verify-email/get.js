var urls = require('../package.json').app.urls,
    redirect = function(location) {
        ctx.res.statusCode = 302;
        ctx.res.setHeader("Location", urls.client + location);
        ctx.res.end();
    };
if (!parts.length) {
    redirect(urls.verifyEmailFailed);
}
else {
    dpd.users.get({
        verificationToken: parseInt(parts[0], 10)
    }, function(users, error) {
        if (users.length) {
            if (users[0].verified) {
                redirect(urls.verifiedEmailAlready);
            }
            else {
                dpd.users.put(users[0].id, {
                    verified: true
                }, function(user, error) {
                    console.log(user);
                    
                    if (!user)
                        redirect(urls.verifyEmailFailed);
                    else
                        redirect(urls.verifyEmailSuccess);
                }); 
            }
        }
        else {
            redirect(urls.verifyEmailFailed);
        }
    });
}