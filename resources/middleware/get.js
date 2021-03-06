var toVerify = ctx.getConfig('jwt.verify.GET');
// not requested with dpd-ssh-key:true in header
// and asked to verify
if (!ctx.user.id && !ctx.isSuperUser && toVerify &&
        // not an array so boolean and true or array and parts[0] is in array
                (!Array.isArray(toVerify) || toVerify.indexOf(parts[0]) !== -1)) {
    kill('Access denied!');
}
else proceed();