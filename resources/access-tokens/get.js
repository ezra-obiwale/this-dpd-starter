// set the user object
dpd.users.get(this.user, function (user, err) {
    cancelUnless(user, err);
    this.user = user;
});