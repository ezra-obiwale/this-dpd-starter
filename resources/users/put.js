cancelUnless(internal, 'Not Allowed', 403);
// only allow an admin to make another user an admin
cancelIf(this.admin && !ctx.user.admin, 'Not Allowed', 403);

// disallow changes to the following:
protect('profile');
protect('passwordToken');
protect('verificationToken');
protect('socialAccount');
protect('socialAccountId');
protect('profile');

// delete old picture
if (this.picture && previous.picture) dpd.files.del(previous.picture);

// remove the following from response
hide('profile');
hide('username');
hide('verificationToken');
hide('passwordToken');
hide('socialAccount');
hide('socialAccountId');
hide('pictureId');
