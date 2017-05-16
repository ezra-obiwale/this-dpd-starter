cancelUnless(body.password.trim(), 'Password is required!');
cancelUnless(body.token, 'Invalid token!');
cancelUnless(body.password === body.confirm);
// get user with token
dpd.users.get({passwordToken: body.token}, function(users) {
    cancelUnless(users.length, 'Invalid token!');
    var user = users[0];
    // update user with new password and remove token
    dpd.users.put(user.id, {
        password: body.password,
        passwordToken: null
    }, setResult);
});