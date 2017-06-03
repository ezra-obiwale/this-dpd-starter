var noVerify = ctx.getConfig('jwt.noverify.PUT');
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