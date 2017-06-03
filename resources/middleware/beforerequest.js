/**
 * Allow super use to act without checking for token.
 * This applies the request with headers `dpd-ssh-key` equal `true` and includes
 * the dashboard.
 * @type Boolean
 */
const ALLOW_SUPER_USER = true;
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
const APP_URLS = null;
/**
 * The secret string to use with JWT
 * 
 * If null, it would be gotten from the project's package.json
 * 
 * @type string
 */
const JWT_SECRET = null;
/**
 * An object containing the amount of time it would take before a JWT token expires
 * Keys include `string` (e.g. "1h") and `numeric` (e.g. Date.now() + 60 * 60 * 1000
 * @type Object
 */
const JWT_EXPIRES = {
    string: '1h',
    numeric: Date.now() + 60 * 60 * 1000 // 1 hour from now
};
/**
 * The options to create and verify JWT with
 * @see https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
 * @type Object
 */
const JWT_OPTIONS = {
    issuer: 'http://localhost'
};
/**
 * The header name which holds the JWT token
 * @type String
 */
const JWT_HEADER_NAME = 'X-API-TOKEN';


// ----------------------- DO NOT EDIT BELOW THIS LINE -------------------------


// Set this to false to disable dashboard access
ctx.__proto__.isSuperUser = ALLOW_SUPER_USER ? (ctx.req.headers['dpd-ssh-key'] || false) : false;
/**
 * The app config object
 * @var {object}
 */
ctx.__proto__.appConfig = require('../../package.json').app;
/**
 * The config object the target resource
 * @var {object}
 */
ctx.__proto__.resourceConfig = resource && dpd[resource] ? dpd[resource].getResource().config : {};
/**
 * Fetches the value of the given path from the config
 * @param {string} path The path to the desired value. Children paths should be joined by dot (.)
 * @param {mixed} def The default value if the value does not exist in the config
 * @param {boolean} appConfig Indicates whether to get the value from the appConfig (TRUE) or the resourceConfig (FALSE)
 * E.g. properties.fullName.required
 */
ctx.__proto__.getConfig = function (path, def, appConfig) {
    // split path by .
    var parts = path.split('.');
    // set result has the whole config
    result = appConfig ? this.appConfig : this.resourceConfig;
    while (parts.length && result) {
        result = typeof result === 'object' ? result[parts.shift()] : null;
    }
    return result === null ? def : result;
}.bind(ctx);
/**
 * The app urls for the type of server being run
 * @type {object}
 */
ctx.__proto__.appUrls = APP_URLS || ctx.getConfig('urls.' + ctx.server.options.env, {}, true);

// Utility methods
ctx.__proto__.utils = {
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
        config = config || ctx.getConfig('sparkpost', {}, true);
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
                    err = {
                        statusCode: err.statusCode,
                        errors: err.errors
                    };
                    // remove unnecessary info
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
    redirect: function (url) {
        this.statusCode = 302;
        this.setHeader("Location", url);
        this.end();
    }.bind(ctx.res)
};

// JSON Web Token
ctx.__proto__.jwt = {
    /**
     * Expiration time info
     * @var {object}
     */
    expires: JWT_EXPIRES,
    /**
     * Secret key for signing JWT
     * @type JWT_SECRET|String
     */
    secret: JWT_SECRET || ctx.getConfig('jwt.secret', '!1a@2b#3c$4d%5e^6f&7g*8h(9i)0j', true),
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

if (ctx.jwt.token || !ctx.user) {
// Set current user
    ctx.__proto__.user = ctx.jwt.token ?
            // verify token
            ctx.jwt.verify() : {};
//    console.log(ctx.jwt.token, ctx.user);
}

/**
 * Gets the full user object
 * @param {function} callback
 * @retuns {Promise}
 */
ctx.__proto__.me = function (callback) {
    return this.user.id ? dpd.users.get(this.user.id, callback) : callback(null, 'User not found!');
};
