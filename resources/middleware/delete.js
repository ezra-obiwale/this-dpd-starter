// if not internal and id is not specified or dpd-ssh-key:true in headers, cancel
cancelUnless(ctx.isSuperUser || internal || parts.length || body.id, 'Not Allowed', 403);
// Cancel bulk deleting except when called internally
cancelUnless(internal || (parts.length && typeof parts[0] === 'string')
        || typeof body.id === 'string');
var noVerify = ctx.getConfig('jwt.noVerify.DELETE');
// user exists from token
// request is made with dpd-ssh-key:true
// resource is called internally
if (ctx.user.id || ctx.isSuperUser || internal ||
        //  or not asked to verify
                (!Array.isArray(noVerify) && noVerify) ||
                // or asked to verify but not first part
                        (noVerify && parts.length && noVerify.indexOf(parts[0]) !== -1))
            // allow through without verifying token
            proceed();
// resource is called externally or not asked to not verify
        else {
            kill('Access denied!');
        }
