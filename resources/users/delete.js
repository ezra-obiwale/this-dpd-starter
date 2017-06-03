cancelUnless(internal, 'Not Allowed', 403);
// only allow admins or account owner to delete account
cancelUnless(this.id !== ctx.user.id && !ctx.user.isAdmin, 'You cannot delete another user');

// delete all access tokens
dpd.accesstokens.del({
    id: {$ne: null},
    user: this.id
});