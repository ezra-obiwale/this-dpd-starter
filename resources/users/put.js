cancelUnless(internal, 'Not Allowed', 403);
// only allow an admin to make another user an admin
cancelIf(this.admin && !ctx.user.admin, 'Not Allowed', 403);