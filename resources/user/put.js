cancelUnless(body.id || query.id);
// update the user info
dpd.users.put(body.id || query.id, body, setResult);