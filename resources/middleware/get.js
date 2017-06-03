var toVerify = ctx.getConfig('jwt.verify.GET');
// not requested with dpd-ssh-key:true in header
// and asked to verify
if (!ctx.isSuperUser && toVerify) {
    // not an array or array and parts[0] is in array
    if (!Array.isArray(toVerify) || toVerify.indexOf(parts[0]) !== -1) {
        // verify token
        ctx.jwt.verify({
            issuer: 'http://smartalumni.io'
        }, function (err, payload) {
            killIf(err, 'Access denied!');
            ctx.user = payload;
            proceed();
        });
    }
    // edge cases
    else proceed();
}
else proceed();