var noVerify = ctx.getConfig('jwt.noverify.POST');
// dpd-ssh-key:true is not in headers
// and resource is called internally
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