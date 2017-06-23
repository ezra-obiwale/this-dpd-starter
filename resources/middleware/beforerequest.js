/**
 * Allow super use to act without checking for token.
 * This applies the request with headers `dpd-ssh-key` equal `true` and includes
 * the dashboard.
 * @type Boolean
 */
var ALLOW_SUPER_USER = null;
/**
 * A set of urls required by the app for verification, resetting password, etc 
 * for different app environments.
 * 
 * If null is provided, these are gotten from the project's package.json file.
 * 
 * Keys are the possible environment the app would run on e.g. development
 * The value of the keys is an object with keys:
 * - client: The web client root url
 * - server: The server url on which this app is hosted
 * - resetPassword: The url to the page where passwords will be reset
 * - verifyEmailFailed: The url to redirect to when email verification fails
 * - verifiedEmailAlready: The url to redirect to when an email that has already been verified is retried
 * - verifyEmailSuccess: The url to redirect to when email verification succeeds
 * @type Object
 */
var APP_URLS = null;
/**
 * The secret string to use with JWT
 * 
 * If null, it would be gotten from the project's package.json
 * 
 * @type string
 */
var JWT_SECRET = null;
/**
 * An object containing the amount of time it would take before a JWT token expires
 * Keys include `string` (e.g. "1h") and `numeric` (e.g. 60 * 60 * 1000
 * @type Object
 */
var JWT_EXPIRES = null;
/**
 * The options to create and verify JWT with
 * @see https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
 * @type Object
 */
var JWT_OPTIONS = null;
/**
 * The header name which holds the JWT token
 * @type String
 */
var JWT_HEADER_NAME = null;
/**
 * Keys include sandbox (boolean), key (string), fromAddress (string)
 * @type object
 */
var SPARKPOST = null;
/**
 * Keys are siteKey and secretKey
 * @type object
 */
var RECAPTCHA_CONFIG = null;

// ----------------------- DO NOT EDIT BELOW THIS LINE -------------------------

var Context = require('deployd/lib/context');

/**
 * Evaluates the value of a config path
 * @see ctx.getConfig()
 * @returns {mixed}
 */
Context.prototype.evalConfig = function (path, def, appConfig) {
    var value = ctx.getConfig(path, def, appConfig);
    try {
        return eval(value);
    }
    catch (e) {
        console.error('Eval "' + value + '" failed: ' + e);
        return def;
    }
};
/**
 * The app config object
 * @var {object}
 */
Context.prototype.appConfig = require('../../package.json');
/**
 * The config object the target resource
 * @var {object}
 */
Context.prototype.resourceConfig = resource && dpd[resource] ?
        dpd[resource].getResource().config : {};
/**
 * Fetches the value of the given path from the config
 * @param string path The path to the desired value. Children paths should be joined by dot (.)
 * @param mixed def The default value if the value does not exist in the config
 * @param boolean|string appConfig Indicates whether to get the value from the 
 * appConfig (TRUE) or the resourceConfig (FALSE). If string, it is the resource from
 * which to fetch the value
 * E.g. properties.fullName.required
 */
Context.prototype.getConfig = function (path, def, appConfig) {
    // split path by .
    var parts = path.split('.');
    // set result has the whole config
    if (typeof appConfig === 'string')
        // appConfig is string, therefore a resource name: load config for it.
        result = dpd[appConfig] ? dpd[appConfig].getResource().config :
                null;
    else // appConfig is boolean
        result = appConfig ? this.appConfig : this.resourceConfig;
    while (parts.length && result) {
        result = typeof result === 'object' ? result[parts.shift()] : null;
    }
    return !result && result != 0 ? def : result;
};
/**
 * The app urls for the type of server being run
 * @type {object}
 */
Context.prototype.appUrls = APP_URLS || ctx.getConfig('middleware.urls.' + ctx.server.options.env, {}, true);

// set up variables: override null with package.json settings
if (ALLOW_SUPER_USER === null)
    ALLOW_SUPER_USER = ctx.evalConfig('middleware.allowSuperUser', false, true);

if (JWT_EXPIRES === null || typeof JWT_EXPIRES !== 'object')
    JWT_EXPIRES = {};
if (JWT_EXPIRES.string === undefined || JWT_EXPIRES.string === null)
    JWT_EXPIRES.string = ctx.getConfig('middleware.jwt.expires.string', '1h', true);
if (JWT_EXPIRES.numeric === undefined || JWT_EXPIRES.numeric === null)
    JWT_EXPIRES.numeric = ctx.evalConfig('middleware.jwt.expires.numeric', 60 * 60 * 1000, true);

if (JWT_OPTIONS === null)
    JWT_OPTIONS = ctx.getConfig('middleware.jwt.options', {});

if (JWT_HEADER_NAME === null)
    JWT_HEADER_NAME = ctx.getConfig('middleware.jwt.headerName', 'X-API-TOKEN');

var recaptchaConfig = RECAPTCHA_CONFIG || ctx.getConfig('recaptcha', null, true);
if (recaptchaConfig) {
    // set recaptcaha config
    var reCAPTCHA = require('recaptcha2');
    Context.prototype.recaptcha = new reCAPTCHA(recaptchaConfig);
}
// set super user status
Context.prototype.isSuperUser = ALLOW_SUPER_USER ? !isRoot : false;

// Utility methods
Context.prototype.utils = {
    /**
     * Sends an email with SparkPost Transmission API
     * @param {object} config Keys include key (string), sandbox (boolean) and
     * fromAddress (string)
     * @param {object} options Keys include:
     * recipients (array): Array of object with keys address and ...
     * subject (string): The subject of the email
     * body (string): The html content to send
     * bodyVariables (object): The variables to parse the body with
     * callback (Function): The callback to call with 2 params: result, error
     * @returns {Promise}
     */
    sendmail: function (options, config) {
        config = config || SPARKPOST || ctx.getConfig('middleware.sparkpost', {}, true);
        options.bodyVariables = options.bodyVariables || {};
        options.callback = options.callback || function () {};
        var SP = require('sparkpost'),
                sparkpost = new SP(config.key),
                utils = this;
        console.log('Send email [' + options.subject + ']:');
        return sparkpost.transmissions.send({
            options: {
                sandbox: config.sandbox
            },
            content: {
                from: config.fromAddress,
                subject: options.subject,
                html: utils.parse(options.body, options.bodyVariables)
            },
            recipients: options.recipients
        })
                .then(data =>
                {
                    console.log('Success!', data);
                    options.callback(null);
                })
                .catch(err =>
                {
                    // recreate err object with only the necessary details
                    err = {
                        statusCode: err.statusCode,
                        errors: err.errors
                    };
                    console.error('Error!', err);
                    options.callback(null, err);
                });
    },
    /**
     * Fetches the mongodb's collection object
     * @param  {object} collection e.g. dpd.users
     * @returns {Promise}
     */
    mongo: function (collection) {
        return collection.getResource().store.getCollection();
    },
    /**
     * Parse the given content with the given variables
     * @param {string} content
     * @param {object} variables
     * @returns {string}
     */
    parse: function (content, variables) {
        for (var key in variables) {
            content = content.replace(new RegExp('{{' + key + '}}', 'g'), variables[key]);
        }
        return content;
    },
    /**
     * Redirects to the given url
     * @param {object} ctx The ctx object
     * @param {string} url The url to redirect to
     * @returns {void}
     */
    redirect: function (ctx, url) {
        ctx.res.statusCode = 302;
        ctx.res.setHeader("Location", url);
        ctx.res.end();
    }
};

// JSON Web Token
Context.prototype.jwt = {
    /**
     * Expiration time info
     * @var {object}
     */
    expires: JWT_EXPIRES,
    /**
     * Secret key for signing JWT
     * @type JWT_SECRET|String
     */
    secret: JWT_SECRET || ctx.getConfig('middleware.jwt.secret', '!1a@2b#3c$4d%5e^6f&7g*8h(9i)0j', true),
    /**
     * The API Token sent with the request in the header as X-API-TOKEN
     * @var {string}
     */
    token: ctx.req.headers[JWT_HEADER_NAME.toLowerCase()],
    /**
     * Creates a token from the given user
     * @param {Object} user The user object from which the payload would be created
     * @param {Function} callback Parameters are (string) err and (Object) payload
     * @returns {Promise}
     */
    create: function (user, callback) {
        var jwt = require('jsonwebtoken');
        if (!JWT_OPTIONS.expiresIn && this.expires)
            JWT_OPTIONS.expiresIn = this.expires.string;
        try {
            return jwt.sign({
                id: user.id,
                admin: user.admin,
                isAdmin: user.isAdmin,
                roles: user.roles
            }, this.secret, JWT_OPTIONS, callback);
        }
        catch (e) {
            if (callback) callback(e);
            return null;
        }
    },
    /**
     * Verifies the token in the header
     * @see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
     * @param {Function} callback Parameters are (string) err and (Object) payload
     * @returns {Object}
     */
    verify: function (callback) {
        var jwt = require('jsonwebtoken');
        try {
            // no token provided
            if (!this.token) throw 'No token received!';
            return jwt.verify(this.token, this.secret, JWT_OPTIONS || {}, callback) || {};
        }
        catch (e) {
            if (callback) callback(e);
            return {};
        }
    }
};

// extend response object
if (!ctx.user) {
    var done = Context.prototype.done;
    Context.prototype.done = function (err, res) {
        // res exists and status isn't 200 and not called internally
        if (res && res.status !== 200 && !this.req.internal
                // and not called for swagger
                && this.req.url.indexOf('swagger') === -1
                && !this.req.headers['dpd-ssh-key']) {
            res = {
                status: 200,
                data: res
            };
        }
        return done.call(this, err, res);
    };
}

// Validator
Context.prototype.validator = require('validator');

/**
 * Gets the full user object
 * @param {function} callback
 * @retuns {Promise}
 */
Context.prototype.me = function (callback) {
    return this.user.id ? dpd.users.get(this.user.id, callback) :
            callback(null, 'User not found!');
};

// Set ctx.user
if (ctx.jwt.token || !ctx.user) {
// Set current user
    Context.prototype.user = ctx.jwt.token ?
            // verify token
            ctx.jwt.verify() : {};
}

// update query for user=me
if (query.user === 'me') {
    query.userId = query.user = ctx.user.id;
}