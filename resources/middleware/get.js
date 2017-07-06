var toVerify = ctx.getConfig('jwt.verify.GET');
// not requested with dpd-ssh-key:true in header
// and asked to verify
if (!ctx.user.id && !ctx.isSuperUser && toVerify &&
        // not an array so boolean and true or array and parts[0] is in array
        (!Array.isArray(toVerify) || toVerify.indexOf(parts[0]) !== -1)) {
        kill('Access denied!');
}
// enforce use of paginate endpoint to access list of models
else if ((ctx.getConfig('type') === 'Collection' || ctx.getConfig('type') === 'UserCollection')
        && dpd[resource] && !internal && (!body || !body.id) && !parts.length && !ctx.isSuperUser)
        kill('Endpoint suspended! Use /paginate/' + resource);
else proceed();