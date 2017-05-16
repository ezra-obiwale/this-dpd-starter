cancelIf(!this.verified, 'Account not verified yet!');
this.lastLogin = Date.now();
// @todo: call for social media login too