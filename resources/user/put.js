switch (parts[0]) {
    case 'me':
        delete body.passwordToken;
        delete body.lastLogin;
        delete body.verificationToken;
        delete body.username;
        delete body.password;
        cancelIf(body.hasOwnProperty('firstName') && !body.firstName, 'First name cannot be empty!');
        cancelIf(body.hasOwnProperty('lastName') && !body.lastName, 'Last name cannot be empty!');
        dpd.users.put(ctx.user.id, body, setResult);
        break;
    default:
        cancelUnless(body.id || query.id);
        // update the user info
        dpd.users.put(body.id || query.id, body, setResult);
}