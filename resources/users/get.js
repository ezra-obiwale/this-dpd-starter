// only show user(s) if any of the following is true
// 1. requested by an internal module
// 2. logged and is an admin
cancelUnless((internal || (ctx.user && (ctx.user.admin || ctx.user.id === this.id))),
        'Not Allowed', 403);
// hide tokens unless getting user by username or verification token
if (!query.username && !query.verificationToken) {
    hide('passwordToken');
    hide('verificationToken');
}
// set username to email and hide username
this.email = this.username;
// keep following keys hidden from public view
hide('profile');
hide('socialAccountId');
hide('username');
hide('lastLogin');