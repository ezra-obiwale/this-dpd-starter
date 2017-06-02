var Context = require('deployd/lib/context');

// Set this to false to disable dashboard access
Context.prototype.isSuperUser = ctx.req.headers['dpd-ssh-key'] || false;

/**
 * The app config object
 * @var {object}
 */
Context.prototype.appConfig = require('../../package.json').app;
/**
 * The config object the target resource
 * @var {object}
 */
Context.prototype.resourceConfig = resource && dpd[resource] ? dpd[resource].getResource().config : {};
/**
 * Fetches the value of the given path from the config
 * @param {string} path The path to the desired value. Children paths should be joined by dot (.)
 * @param {boolean} appConfig Indicates whether to get the value from the appConfig (TRUE) or the resourceConfig (FALSE)
 * E.g. properties.fullName.required
 */
Context.prototype.getConfig = function (path, appConfig) {
    // split path by .
    var parts = path.split('.')
    // set result has the whole config
    result = appConfig ? this.appConfig : this.resourceConfig;
    while (parts.length && result) {
        result = typeof result === 'object' ? result[parts.shift()] : null;
    }
    return result;
}.bind(ctx);
/**
 * The app urls for the type of server being run
 * @type {object}
 */
Context.prototype.appUrls = ctx.getConfig('urls.' + ctx.server.options.env, true) || {};

// JSON Web Token

/**
 * JWT
 * @type {Object}
 */
Context.prototype.jwt = {};
/**
 * The secret to use for signing and verifying tokens.
 * By default, this is gotten from the package.app.jwt.secret
 * @var {string}
 */
Context.prototype.jwt.secret = ctx.getConfig('jwt.secret', true) || '!1a@2b#3c$4d%5e^6f&7g*8h(9i)0j';
/**
 * Expiration time info
 * @var {object}
 */
Context.prototype.jwt.expires = {
    string: '1h',
    numeric: Date.now() + 60 * 60 * 1000
};
/**
 * The API Token sent with the request in the header as X-API-TOKEN
 * @var {string}
 */
Context.prototype.jwt.token = ctx.req.headers['x-api-token'];
/**
 * Creates a token from the given payload and options
 * @param {Object} user The user object from which the payload would be created
 * @param {Object} options The options to use while creating.
 * For keys, @see https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
 * @param {Function} callback Parameters are (string) err and (Object) payload
 * @returns {Promise}
 */
Context.prototype.jwt.create = function (user, options, callback) {
    var jwt = require('jsonwebtoken');
    // ensure callback is a callable function
    callback = callback && typeof callback === 'function'
            ? callback : function () {};
    return new Promise(function (resolve, reject) {
        if (!options.expiresIn && this.expires)
            options.expiresIn = this.expires.string;
        try {
            var token = jwt.sign({
                id: user.id,
                admin: user.admin,
                isAdmin: user.isAdmin,
                roles: user.roles
            }, this.secret, options);
            callback(token);
            resolve(token);
        }
        catch (e) {
            callback(null, e);
            reject(e);
        }
    }.bind(this));
}.bind(ctx.jwt);
/**
 * Verifies the token in the header
 * @param {Object} options The options to use while verifying.
 * For keys, @see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
 * @param {Function} callback Parameters are (string) err and (Object) payload
 * @returns {Promise}
 */
Context.prototype.jwt.verify = function (options, callback) {
    var jwt = require('jsonwebtoken'),
            cJWT = this;
    // ensure callback is a callable function
    callback = callback && typeof callback === 'function'
            ? callback : function () {};
    // no token provided
    if (!this.token) {
        callback('Invalid token');
        return Promise.reject('Invalid token');
    }

    return new Promise(function (resolve, reject) {
        jwt.verify(cJWT.token, cJWT.secret, options || {},
                function (err, payload) {
                    // has error
                    if (err) {
                        callback('Access denied!');
                        return reject('Access denied!');
                    }
                    // add user payload to the request object
                    cJWT.user = payload;
                    // send payload
                    callback(null, payload);
                    resolve(payload);
                });
    });
}.bind(ctx.jwt);
/**
 * Gets the full user object
 * @param {function} callback
 * @retuns {Promise}
 */
Context.prototype.me = function (callback) {
    return dpd.users.get(this.user.id, callback);
}.bind(ctx);
