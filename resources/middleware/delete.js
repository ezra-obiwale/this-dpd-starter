// if not internal and id is not specified or dpd-ssh-key:true in headers, cancel
cancelUnless(ctx.isSuperUser || internal || query.id || body.id, 'Not Allowed', 403);
var noVerify = ctx.getConfig('jwt.noverify.DELETE');
// resource is called internally
if (ctx.isSuperUser || internal ||
        //  or not asked to verify
                (!Array.isArray(noVerify) && noVerify) ||
                // or asked to verify but not first part
                        (noVerify && parts.length && noVerify.indexOf(parts[0]) !== -1))
            // allow through without verifying token
            proceed();
// resource is called externally or not asked to not verify
        else {
            // verify token
            ctx.jwt.verify({
                issuer: 'http://smartalumni.io'
            }, function (err, payload) {
                killIf(err, 'Access denied!');
                ctx.user = payload;
                proceed();
            });
        }