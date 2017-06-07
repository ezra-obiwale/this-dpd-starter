/*
 * ThisJS version 1.0.0 (http://thisjs.com)
 * (c) 2016 Ezra Obiwale
 * License (http://thisjs.com/#license)
 */
(function () {
    var privData = {
        data: {},
        get: function (elem, key) {
            if (!this.data[elem])
                return;
            return this.data[elem][key];
        },
        set: function (elem, key, value) {
            if (!this.data[elem])
                this.data[elem] = {};
            this.data[elem][key] = value;
            return this;
        },
        unset: function (elem, key) {
            if (!this.data[elem])
                return;
            delete this.data[elem][key];
            return this;
        }
    },
            pageAssets = {js: {}, css: {}},
            loadedPageJS = {first: {}, last: {}},
            containedEvents = {},
            crudConnectors = {
                create: '+',
                read: '#',
                update: '!',
                delete: '-'
            };
    FormData.prototype.fromObject = function (object, appendArray) {
        var _this = this;
        function process(data, _key) {
            __.forEach(data, function (key, value) {
                if (_key) // parsing for object
                    key = _key + '[' + (__.isString(key) || !appendArray ? key : '') + ']';
                if (__.isObject(value, true)) {
                    process(value, key);
                }
                else {
                    _this.append(key, value);
                }
            });
            if (_key && data && __.isObject(data, true) && !Object.keys(data).length)
                _this.append(_key, data);
        }
        process(object);
        return this;
    };
    FormData.prototype.toObject = function () {
        var object = {};
        for (var [key, value] of this) {
            var obj = object, last;
            __.forEach(key.split('['), function (i, v) {
                var ky = v.replace(']', '');
                if (!i) {
                    last = ky;
                    return;
                }
                if (!ky || ky.replace(/[^0-9]/g, '') == ky) {
                    if (!__.isArray(obj[last])) {
                        obj[last] = [];
                    }
                    obj = obj[last];
                    if (obj[ky] === undefined) {
                        obj.push(null);
                        last = obj.length - 1;
                    }
                    else {
                        last = ky;
                    }
                }
                else {
                    if (!__.isObject(obj[last], true) || obj[last] === null) {
                        obj[last] = {};
                    }
                    obj = obj[last];
                    last = ky;
                }
            });
            obj[last] = value;
        }
        return object;
    };
    FormData.prototype.toQueryString = function () {
        var str = '';
        for (var [key, value] of this) {
            if (str !== '')
                str += '&';
            str += key + '=' + encodeURIComponent(value);
        }
        return str;
    };
    /**
     * @param {string} name
     */
    var Store = function (name) {
        if (!(this instanceof Store)) {
            return new Store(name);
        }
        else if (name) {
            return this.collection(name);
        }
    };
    Store.prototype.collection = function (name) {
        if (!name) {
            throw 'Collection name not specified';
        }
        this.name = name;
        var save = function (data) {
            if (__.isObject(data, true)) {
                this.length = Object.keys(data).length;
                data = JSON.stringify(data);
            }
            return localStorage.setItem(this.name, data);
        }.bind(this),
                fetch = function () {
                    var data = localStorage.getItem(this.name);
                    try {
                        data = JSON.parse(data);
                    }
                    catch (e) {
                        if (!data && name !== '__cols__') {
                            var cols = fetch('__cols__') || [];
                            cols.push(name);
                            save(cols, '__cols__');
                        }
                    }
                    return data;
                }.bind(this),
                createId = function () {
                    return Math.round(Math.random() * Date.now()) + Date.now()
                },
                localData = fetch() || {},
                process = function (id, data, overwrite) {
                    if (!overwrite && __.isObject(data, true)) {
                        if (__.isArray(data)) {
                            return __.extend(__.isObject(localData[id], true) ? localData[id] : [], data);
                        }
                        else if (__.isObject(data)) {
                            return __.extend(__.isObject(localData[id], true) ? localData[id] : {}, data);
                        }
                    }
                    else {
                        return data;
                    }
                };
        this.length = Object.keys(localData).length;
        this.find = function (id) {
            return id !== undefined ? localData[id] : localData;
        };
        this.save = function (data, id, overwrite) {
            var old = true;
            if (!id && id !== 0) {
                id = createId();
                old = false;
            }
            localData[id] = process(id, data, overwrite);
            save(localData);
            return old ? localData[id] : id;
        };
        this.saveMany = function (data, idKey, overwrite) {
            if (!idKey)
                idKey = 'id';
            var resp = {};
            __.forEach(data, function (i, v) {
                var id = v[idKey] || createId();
                localData[id] = process(id, v, overwrite);
                resp[id] = localData[id];
            });
            save(localData);
            return resp;
        };
        this.remove = function (id) {
            var data = localData[id];
            delete localData[id];
            save(localData);
            return data;
        };
        this.drop = function () {
            localData = {};
            length = 0;
            return Store.dropCollection(this.name);
        };
    };
    Store.toString = function () {
        return 'Store';
    };
    Store.dropCollection = function (name) {
        localStorage.removeItem(name);
        return this;
    };
    Store.collections = function () {
        return Store('__cols__').find();
    };
    function objToQStr(obj, callback) {
        if (!__.isObject(obj))
            return obj;
        var str = '',
                callback = __.callable(callback);
        __.forEach(obj, function (i, v) {
            if (str)
                str += '&';
            callback.call(null, i, v);
            if (__.isObject(v, true)) {
                var isArray = __.isArray(v);
                __.forEach(v, function (j, w) {
                    if (j)
                        str += '&';
                    if (isArray)
                        j = '';
                    if (__.isObject(w, true))
                        str += i + '[' + j + ']=' + parseData(w);
                    else if (('' + w).trim())
                        str += i + '[' + j + ']=' + encodeURIComponent(('' + w).trim());
                });
            }
            else {
                str += i;
                if (v !== undefined && ('' + v).trim())
                    str += '=' + encodeURIComponent(('' + v).trim());
            }
        });
        return str;
    }
    function qStrToObj(str, callback) {
        var obj = {},
                callback = __.callable(callback);
        __.forEach(str.split('&'), function (i, v) {
            var parts = v.split('=');
            try {
                obj[parts[0]] = eval(parts[1]);
                callback.apply(null, parts);
                if (obj[parts[0]] === undefined)
                    throw 'error';
            }
            catch (e) {
                obj[parts[0]] = parts[1];
            }
        });
        return obj;
    }
    function styleToObj(str, callback) {
        var obj = {},
                callback = __.callable(callback);
        __.forEach(str.split(';'), function (i, v) {
            var parts = v.split(':');
            obj[parts[0]] = parts[1];
            callback.apply(null, parts);
        });
        return obj;
    }
    function getElemType(elem) {
        return _(elem).length ?
                (_(elem).this('type') || _(elem).get(0).tagName.toLowerCase())
                : null;
    }
    function getRealData(data) {
// use dataKey if available
        if (this.config.dataKey) {
            return data[this.config.dataKey];
        }
        else {
            return data;
        }
    }
    function analyzeLink(link) {
// remove initial #
        if (link.startsWith('#'))
            link = link.substr(1);
        // remove intitial /
        if (link.startsWith('/'))
            link = link.substr(1);
        var parts = link.split('/'), analysis = {};
        if (parts[0].endsWith('/'))
            parts[0] = parts[0].substr(0, parts[0].length - 1);
        analysis.page = parts.shift();
        if (parts.length) {
            __.forEach(crudConnectors, function (i, v) {
                if (v === parts[0]) {
                    parts.shift();
                    analysis.action = i;
                    return false;
                }
            });
        }
        analysis.model = parts.shift();
        // parameters exist
        if (parts.length) {
            analysis.url = parts.join('/');
        }
        return analysis;
    }
    function when(event, target, callback) {
        var selector = "", targets = target.split(',');
        if (selector)
            selector += ', ';
        __.forEach(targets, function (i, v) {
            switch (target) {
                case "layout":
                    selector += 'layout,[this-type="layout"]';
                    break;
                case "page":
                    selector += 'page,[this-type="page"]';
                    break;
                case "collection":
                    selector += 'collection,[this-type="collection"]';
                    break;
                case "model":
                    selector += 'model,[this-type="model"]';
                    break;
                case "component":
                    selector += 'component,[this-type="component"]';
                    break;
                case "list":
                    selector += 'list,[this-type="list"]';
                    break;
                default:
                    var exp = v.split('#');
                    if (exp.length > 1 && exp[0]) {
                        selector += '[this-type="' + exp[0] + '"][this-id="'
                                + exp[1] + '"]';
                    }
                    else {
                        selector += '[this-id="' + v + '"]';
                    }
            }
        });
        return this.on(event, selector, callback);
    }
    // @todo: Why this function?
    function parseSelector(selector) {
        // @todo: parse attributes as well na
        var obj = {
            tag: null,
            id: null,
            classes: []
        },
                parts = selector.split('#'),
                part1 = parts[0].split('.');
        // selector has id; deal with the first part
        if (parts.length > 1) {
            obj.tag = part1.shift();
            // The rest are classes, if available
            obj.classes = part1;
            // set up id part
            parts = parts[1].split('.');
            obj.id = parts.shift();
        }
        else {
            // nothing before the id
            obj.tag = parts.shift();
        }
        obj.classes = obj.classes.concat(parts);

        return obj;
    }
    function elemToSelector(elem) {
        elem = _(elem);
        // no element found
        if (!elem.length) return '';
        // set selector as the tag name
        var sel = elem.get(0).tagName.toLowerCase(),
                cls = '';
        // get id
        if (elem.attr('id')) sel = '#' + elem.attr('id');
        // parse attributes
        elem.attr().forEach(function (v) {
            // don't add id or style
            if (v.name === 'id' || v.name === 'style') return;
            // keep class for later parsing
            else if (v.name === 'class') {
                cls = v.value;
                return;
            }
            // add attribute to selector
            sel += '[' + v.name;
            if (v.value) sel += '="' + v.value + '"';
            sel += ']';
        });
        // add classes: replace spaces with dots
        sel += cls.replace(/\s/g, '.');
        return sel;
    }
    // update href values of links
    function updateLinkHrefs() {
        var _this = this;
        // update links
        this.container.find('a[this-goto]:not(form)').each(function () {
            var _a = _this._(this), href, hrf = '', connector, _model;
            if (_a.attr('href') && _a.attr('href') !== '#')
                return;
            href = '#/' + _a.this('goto');
            _model = _a.closest('model,[this-type="model"],[this-model]');
            if (_a.hasThis('create')) {
                if (_a.this('create'))
                    hrf += _a.this('create');
                else if (_model.length) {
// get collection's url
                    hrf += _model.hasThis('model') ? _model.this('url')
                            : _model.parent().this('url');
                }
                connector = 'create';
            }
            else if (_a.hasThis('read')) {
                if (_a.this('read'))
                    hrf += _a.this('read');
                else if (_model.length) {
                    hrf += _model.this('url');
                }
                connector = 'read';
            }
            else if (_a.hasThis('update')) {
                if (_a.this('update'))
                    hrf += _a.this('update');
                else if (_model.length) {
                    hrf += _model.this('url');
                }
                connector = 'update';
            }
            else if (_a.hasThis('delete')) {
                if (_a.this('delete'))
                    hrf += _a.this('delete');
                else if (_model.length) {
                    hrf += _model.this('url');
                }
                connector = 'delete';
            }

            if (hrf) {
                href += '/' + crudConnectors[connector] + '/' + (_a.this('model')
                        || _model.this('model') || _model.this('id')) + '/' + hrf;
            }
            _a.attr('href', href);
        });
    }
    /**
     * Creates an AJAX connection
     * @param object config
     * @returns ajax object
     */
    var Ajax = function (config, app) {
        config = __.extend({
            type: 'get',
            url: location.href,
            data: null,
            dataType: 'json',
            headers: {},
            success: function () {
            },
            error: function () {
            },
            complete: function () {
            },
            progress: function (e, loaded, total) {
            },
            crossDomain: true,
            async: true,
            clearCache: false
        }, config);
        config.type = config.type.toLowerCase();
        var httpRequest = new XMLHttpRequest(), contentType;
        // call secureAPI
        if (app && config.api) {
            var secureAPI = ext.record.call(app, 'secureAPI'),
                    key = ext.generateRequestKey.call(app),
                    headers = {},
                    data = {};
            if (false === __.callable(secureAPI || app.secap)
                    .call(app, key, headers, data)) {
                return __.callable(config.error).call(httpRequest);
            }
            __.forEach(headers, function (i, v) {
                config.headers[i] = v;
            });
            __.forEach(data, function (i, v) {
                config.data[i] = v;
            });
        }
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                if (httpRequest.status >= 200 && httpRequest.status < 400) {
                    __.callable(config.success).call(httpRequest, httpRequest.response);
                }
                else {
                    __.callable(config.error).call(httpRequest, httpRequest.response);
                }
                __.callable(config.complete).call(httpRequest, httpRequest.response);
            }
        };
        if (config.ignoreCache) {
            config.url += ((/\?/).test(config.url) ? "&" : "?") + (new Date()).getTime();
        }
// data is object, request method is PUT or PATCH: 
// convert data to query string if put or patch
        if (config.data && __.isObject(config.data)) {
            if (config.data instanceof FormData) {
                if (config.type !== 'post')
                    config.data = config.data.toQueryString();
            }
            else {
                config.data = objToQStr(config.data);
            }
        }

// data is string but no content type has been set
        if (config.data && __.isString(config.data)) {
            if (config.type === 'get') {
                if (config.data.startsWith('&') || config.data.startsWith('?'))
                    config.data = config.data.substr(1);
                config.url += ((/\?/).test(config.url) ? "&" : "?") + config.data;
                config.data = null;
            }
            if (!contentType)
                contentType = 'application/x-www-form-urlencoded';
        }
        httpRequest.open(config.type, config.url, config.async);
        httpRequest.responseType = config.dataType;
        httpRequest.withCredentials = config.crossDomain;
        if (__.isObject(config.headers)) {
            __.forEach(config.headers, function (key, value) {
                httpRequest.setRequestHeader(key, value);
                if (key.toLowerCase() === 'content-type') {
                    contentType = null;
                }
            });
        }
        if (contentType)
            httpRequest.setRequestHeader('Content-Type', contentType);
        __.tryCatch(function () {
            httpRequest.upload.onprogress = function (e) {
                if (e.lengthComputable) {
                    __.callable(config.progress).call(httpRequest, e, e.loaded, e.total);
                }
            };
        });
        httpRequest.send(config.data);
        return httpRequest;
    },
            __ = Object.create({
                debug: true,
                index: 0,
                items: [],
                /**
                 * Adds the given class to matched elements
                 * @param string className
                 * @returns _
                 */
                addClass: function (className) {
                    var _this = this;
                    return this.each(function () {
                        var __this = this;
                        _this.forEach(className.split(' '), function (i, v) {
                            __this.classList.add(v);
                        });
                    });
                },
                /**
                 * Adds an element after the current elements or fetches the sibling after current
                 * items
                 * @param {_}|{HTMLElement}|{String} elem
                 * @returns {_}
                 */
                after: function (elem) {
                    // fetch next sibling
                    if (!elem) return this.next();
                    if (!(elem instanceof _))
                        elem = _(elem, this.debug);
                    if (!elem.length)
                        return this;
                    return this.each(function () {
                        var _this = this;
                        elem.each(function () {
                            _this.insertAdjacentElement('afterEnd', this);
                        });
                    });
                },
                /**
                 * Sends an AJAX request
                 * @param object config
                 * Keys include:
                 * type (string): GET | POST | PATCH | PUT | DELETE
                 * url (string): The url to connect to. Default is current url
                 * data (string|object): The data to send with the request
                 * headers (object): Object of string keys to string values to pass to the request header
                 * success (function): Function to call when a success response is gotten. The response data
                 * is passed as a parameter
                 * error (function) : Function to call when error occurs
                 * complete (function): Function to call when a response has been received, error or success
                 * @returns ajax object
                 */
                ajax: function (config) {
                    config = this.extend({
                        type: 'get',
                        url: location.href,
                        data: {},
                        success: function (data) {
                        },
                        error: function () {
                        },
                        complete: function () {
                        }
                    }, config);
                    return Ajax(config);
                },
                /**
                 * Append content to the elements
                 * @param mixed content
                 * @returns __
                 */
                append: function (content) {
                    if (!content)
                        return this;
                    var _content = content;
                    if (this.isString(content) && !content.trim().startsWith('<'))
                        _content = this.createElement(null, 'span').items[0].innerHTML = content;
                    _content = _(content, this.debug);
                    if (!_content.length)
                        return this;
                    return this.each(function () {
                        var _this = this;
                        _content.each(function () {
                            _this.insertAdjacentElement('beforeEnd', this);
                        });
                    });
                },
                /**
                 * Sets or gets the attr of the elements
                 * @param {string}|{object} attr
                 * @param {mixed} val
                 * @returns __|string
                 */
                attr: function (attr, val) {
                    return this.tryCatch(function () {
                        if (val !== undefined || __.isObject(attr)) {
                            this.each(function () {
                                if (__.isObject(attr)) {
                                    var __this = this;
                                    __.forEach(attr, function (i, v) {
                                        __this.setAttribute(i, v);
                                    });
                                }
                                else
                                    this.setAttribute(attr, val);
                            });
                            return this;
                        }
                        if (!this.items.length)
                            return;
                        if (!attr)
                            return Array.from(this.items[0].attributes);
                        if (this.items[0].getAttribute(attr) !== null)
                            return this.items[0].getAttribute(attr);
                    });
                },
                /**
                 * Adds an element before the current elements or fetches the sibling before current 
                 * items
                 * @param {_}|{HTMLElement}|{String} elem
                 * @returns {_}
                 */
                before: function (elem) {
                    // fetch previous sibling
                    if (!elem) return this.prev();
                    if (!(elem instanceof _))
                        elem = _(elem, this.debug);
                    if (!elem.length)
                        return this;
                    return this.each(function () {
                        var _this = this;
                        elem.each(function () {
                            _this.insertAdjacentElement('beforeBegin', this);
                        });
                    });
                },
                /**
                 * Fetches the callable function
                 * @param function|string callback
                 * @param boolean nullable Indicates if to return nullable instead of empty function if 
                 * not callable
                 * @returns function
                 */
                callable: function (callback, nullable) {
                    if (this.isFunction(callback)) {
                        return callback;
                    }
                    else if (this.isString(callback)) {
                        var split = callback.split('.'), func = window;
                        for (var i = 0; i < split.length; i++) {
                            if (!func[split[i]]) {
                                return this.callable(null, nullable);
                            }
                            func = func[split[i]];
                        }
                        return func === window ? this.callable(null, nullable) : this.callable(func, nullable);
                    }
                    else if (!nullable) {
                        return function () { };
                    }
                    return;
                },
                /**
                 * Gets the immediate descendants of the current items
                 * @param string selector
                 * @returns _
                 */
                children: function (selector) {
                    var result = [];
                    this.each(function () {
                        if (selector) {
                            var id = false, query = '', _this = this;
                            if (!this.id) {
                                this.id = 'rANd' + Math.ceil(Math.random() * 100);
                                id = true;
                            }
                            __.forEach(selector.split(','), function (i, sel) {
                                if (query)
                                    query += ',';
                                query += '#' + _this.id + '>' + sel;
                            });
                            result = result.concat(Array.from(this.querySelectorAll(query)));
                            if (id)
                                this.removeAttribute('id');
                            return;
                        }
                        result = result.concat(Array.from(this.children));
                    });
                    return _(result, this.debug);
                },
                /**
                 * Generates random string 
                 * @returns {string}
                 */
                randomString: function (len) {
                    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefjhijklmnopqrstuvwxyz',
                            str = '';
                    if (!len)
                        len = 6;
                    while (str.length < len) {
                        str += alpha[Math.floor(Math.random() * 52)];
                    }
                    return str + '-' + Date.now();
                },
                /**
                 * Clones the first item
                 * @returns _
                 */
                clone: function () {
                    return this.tryCatch(function () {
                        return _(this.items.length ? this.items[0].cloneNode(true) : [], this.debug);
                    });
                },
                /**
                 * Finds the closest object of the given selector
                 * @param string selector
                 * @returns _
                 */
                closest: function (selector) {
                    return this.tryCatch(function () {
                        var closest = null;
                        if (this.items.length) {
                            closest = this.items[0].closest(selector);
                            if (closest === this.items[0])
                                closest = null;
                        }
                        return _(closest, this.debug);
                    });
                },
                /**
                 * A shortcut for indexOf. Checks if the given item has the given string
                 * @param string|array item
                 * @param string|array str
                 * @param boolean all Only if str is array and indicates if to match all or at
                 *  least one
                 * @returns booelan
                 */
                contains: function (item, str, all) {
                    var _this = this;
                    return this.tryCatch(function () {
                        if (_this.isObject(item, true)) {
                            var found = false;
                            _this.forEach(item, function (i, v) {
                                if (_this.contains(v, str, all)) {
                                    found = true;
                                    return false;
                                }
                            });
                            return found;
                        }
                        if (this.isString(str))
                            return _this.isString(item) && item.indexOf(str) !== -1;
                        else if (this.isArray(str)) {
                            var found = true;
                            this.forEach(str, function (i, v) {
                                found = _this.contains(item, v, all);
                                if (!all && found) {
                                    return false;
                                }
                                else if (all) {
                                    return found;
                                }
                            });
                            return found;
                        }
                    });
                },
                /**
                 * Creates a new element
                 * @param string str
                 * @param string tag The tag to create
                 * @returns _
                 */
                createElement: function (str, tag) {
                    var d = document.createElement(tag || 'div');
                    if (!str)
                        return _(d, this.debug);
                    d.innerHTML = str;
                    return _(Array.from(d.children), this.debug);
                },
                /**
                 * Sets or retrieves a style of the current item(s)
                 * @param {string} attr
                 * @param {string} val
                 * @returns {_}
                 */
                css: function (attr, val) {
                    if (!attr && this.items.length)
                        return this.items[0].style;
                    else if (val === undefined && this.items.length) {
                        if (this.items[0].style[attr]) {
                            return this.items[0].style[attr];
                        }
                        var viewer = this.items[0].ownerDocument.defaultView;
                        if (!viewer || !viewer.opener)
                            viewer = window;
                        return viewer.getComputedStyle(this.items[0])[attr];
                    }
                    this.each(function () {
                        this.style[attr] = val;
                    });
                    return this;
                },
                /**
                 * Sets/Gets a value into/from the dataset
                 * @param {string}|{object} key
                 * @param {mixed} value
                 * @returns {mixed}
                 */
                data: function (key, value) {
                    if (value !== undefined || __.isObject(key)) {
                        this.each(function () {
                            privData.set(this, key, value);
                        });
                        return this;
                    }
                    if (!this.items.length)
                        return;
                    value = privData.get(this.items[0], key);
                    if (value === undefined)
                        value = this.items[0].dataset[key];
                    // ensure that non-string values are returned in their appropriate data types
                    return this.tryCatch(function () {
                        return eval(value);
                    }, function () {
                        return value;
                    });
                },
                /**
                 * Loops through found elements and calls the given callback on each
                 * @param function|string callback
                 * The function receives two parameters: index and item
                 * The this object is also the item
                 * @returns __
                 */
                each: function (callback) {
                    return this.forEach(this.items, callback);
                },
                /**
                 * Logs the error message
                 * @param string message
                 * @returns _
                 */
                error: function (message) {
                    if (this.debug)
                        console.error(message);
                    return this;
                },
                /**
                 * Clones a new object from the given objects. There can be as many as possible objects to 
                 * clone from
                 * @param {object} object
                 * @param {Boolean} deep Indicates deep cloning
                 * @returns object The new object
                 */
                extend: function (object) {
                    var args = Array.from(arguments),
                            newObject = {},
                            newArray = [],
                            _this = this,
                            deep = false;
                    // set to false
                    if (this.isBoolean(args[args.length - 1]))
                        deep = args.pop(args);
                    this.forEach(args, function (i, o) {
                        if (_this.isArray(o)) {
                            _this.forEach(o, function (j, v) {
                                // not first array param
                                // current is object but not the same as the one
                                // from the existing array
                                if (i && newArray[j]
                                        && ((_this.isArray(newArray[j]) && !_this.isArray(v))
                                                || (_this.isObject(newArray[j]) && !_this.isObject(v))
                                                || (!_this.isObject(newArray[j], true) && !_this.isObject(v, true))
                                                || !deep)) {
                                    // overwrite existing value
                                    newArray[j] = v;
                                }
                                // current is not object or
                                // it is an object but is the first array param
                                // or is an object but not the first and deep not allowed
                                else if (!_this.isObject(v, true) || !i || !deep) {
                                    // append to array
                                    newArray.push(v);
                                }
                                // old and new are the objects and deep is allowed.
                                else {
                                    // overwrite existing value with the extension
                                    // of the exiting with the current
                                    newArray[j] = _this.extend(newArray[j], v, deep);
                                }
                            });
                        }
                        else if (_this.isObject(o)) {
                            _this.forEach(o, function (i, v) {
                                // extend if old and new are object but new isn't an array
                                if (newObject[i] && _this.isObject(newObject[i]) &&
                                        _this.isObject(v) && !_this.isArray(v) && deep)
                                    newObject[i] = _this.extend(newObject[i], v, deep);
                                else
                                    newObject[i] = v;
                            });
                        }
                    });
                    return this.isArray(object)
                            ? newArray : newObject;
                },
                /**
                 * Filters matched items through the given function
                 * @param function func parameters include index and value
                 * @returns _ Object containing matched items
                 */
                filter: function (func) {
                    var _this = this,
                            filtered = this.items.filter(function (v, i) {
                                func = _this.callable(func);
                                return func ? func.call(v, i, v) : true;
                            });
                    return _(filtered, this.debug);
                },
                /**
                 * Searches the current items for elements that match the given selector
                 * @param string selector
                 * @returns _
                 */
                find: function (selector) {
                    var result = [], _this = this;
                    this.each(function () {
                        if (_this.items.length > 1) {
                            result = result.concat(Array.from(this.querySelectorAll(selector)));
                        }
                        else
                            result = Array.from(this.querySelectorAll(selector));
                    });
                    return _(result, this.debug);
                },
                /**
                 * Loops through the given array or object and calls the given callback on each item
                 * @param array|object items
                 * @param function|string callback
                 * The function receives two parameters: index and item
                 * The this object is also the item
                 * @returns __
                 */
                forEach: function (items, callback) {
                    return this.tryCatch(function () {
                        if (this.isObject(items) && items instanceof _)
                            items = items.items;
                        if (this.isArray(items))
                            items.every(function (v, i) {
                                return false !== this.callable(callback).call(v, i, v);
                            }.bind(this));
                        else {
                            for (var a in items) {
                                if (!items.hasOwnProperty(a))
                                    continue;
                                if (false === this.callable(callback).call(items[a], a, items[a]))
                                    break;
                            }
                        }
                        return this;
                    });
                },
                /**
                 * Fetches the item at the given index
                 * @param int index
                 * @returns mixed
                 */
                get: function (index) {
                    return this.items[index];
                },
                /**
                 * Checks if an attribute exists
                 * @param string attr
                 * @returns booelan
                 */
                hasAttr: function (attr) {
                    return this.tryCatch(function () {
                        return this.attr(attr) !== null && this.attr(attr) !== undefined;
                    });
                },
                /**
                 * Checks whether
                 * @param string className
                 * @returns boolean
                 */
                hasClass: function (className) {
                    var has = false;
                    if (this.length) {
                        var _this = this,
                                classNames = className.split(' ');
                        this.forEach(Array.from(this.items[0].classList), function (i, v) {
                            var found = 0;
                            _this.forEach(classNames, function (j, w) {
                                if (v === w) {
                                    found++;
                                }
                            });
                            if (found === classNames.length) {
                                has = true;
                                return false;
                            }
                        });
                    }
                    return has;
                },
                /**
                 * Shortcut for hasThis('*')
                 */
                hasThis: function (key) {
                    return this.hasAttr('this-' + key);
                },
                /**
                 * Hides the matched elements
                 * @returns __
                 */
                hide: function () {
                    var _this = this;
                    return this.each(function () {
                        var __this = _(this, _this.debug);
                        if (__this.css('display') && __this.css('display') !== 'none')
                            __this.data('display', this.style.display);
                        this.style.display = 'none';
                    });
                },
                /**
                 * Set or get the html content of an element
                 * @param mixed content
                 * @returns __
                 */
                html: function (content) {
                    if (content === undefined) {
                        return this.tryCatch(function () {
                            return this.items.length ? this.items[0].innerHTML : '';
                        });
                    }
                    var _this = this;
                    if (content instanceof _ || (content && _this.isObject(content)
                            && content['outerHTML'])) {
                        this.html('').append(content);
                        return this;
                    }
                    return this.each(function () {
                        this.innerHTML = content;
                    });
                },
                /**
                 * Wraps the content of the matched elements with the given elem
                 * @param {string} elem
                 * @returns {_}
                 */
                innerWrap: function (elem) {
                    var _this = this;
                    return this.each(function () {
                        var __this = _(this);
                        __this.html(_(elem, _this.debug).html(__this.html()));
                    });
                },
                /**
                 * Checks if the items are of the given selector
                 * @param string selector
                 * @param {Boolean} checkIdOnly Indicates to check the this-id of element
                 * @returns Boolean
                 */
                is: function (selector, checkIdOnly) {
                    if (!this.items.length)
                        return false;
                    if (checkIdOnly && this.items[0].getAttribute('this-id') === selector)
                        return true;
                    var el = this.items[0];
                    return (el.matches || el.matchesSelector || el.msMatchesSelector
                            || el.mozMatchesSelector || el.webkitMatchesSelector
                            || el.oMatchesSelector).call(el, selector);
                },
                /**
                 * Checks if the given value exists in the given array
                 * @param {mixed} value
                 * @param {Array} array
                 * @returns boolean
                 */
                inArray: function (value, array) {
                    var clone = this.extend(array);
                    return this.removeArrayValue(clone, value).length > 0;
                },
                /**
                 * Checks if the given item is an array
                 * @param mixed item
                 * @returns boolean
                 */
                isArray: function (item) {
                    return Array.isArray(item);
                },
                /**
                 * Checks whether the given item is boolean
                 * @param {mixed} item
                 * @returns {Boolean}
                 */
                isBoolean: function (item) {
                    return item === true || item === false;
                },
                /**
                 * Checks if the given item is a function
                 * @param mixed item
                 * @returns boolean
                 */
                isFunction: function (item) {
                    return typeof item === 'function';
                },
                /**
                 * Checks if the given item is an object
                 * @param mixed item
                 * @param boolean allowArray Indicates wether to return array as object too
                 * @returns boolean
                 */
                isObject: function (item, allowArray) {
                    return item && typeof item === 'object' && (allowArray || !Array.isArray(item));
                },
                /**
                 * Checks if the given item is a number
                 * @param mixed item
                 * @returns {Boolean}
                 */
                isNumber: function (item) {
                    return !isNaN(item) && !this.isString(item);
                },
                /**
                 * Checks if the given item is a string
                 * @param mixed item
                 * @returns boolean
                 */
                isString: function (item) {
                    return typeof item === 'string';
                },
                /**
                 * Checks if the given item exists in the given object
                 * @param {mixed} item
                 * @param {object}|{array} object
                 * @returns {Boolean}
                 */
                inObject: function (item, object) {
                    var is = false;
                    this.forEach(object, function (i, v) {
                        if (v === item) {
                            is = true;
                            return false;
                        }
                    });
                    return is;
                },
                /**
                 * Checks if the given key exists in the given object
                 * @param {integer}|{string} key
                 * @param {object}|{array} object
                 * @returns {Boolean}
                 */
                keyExists: function (key, object) {
                    return object.hasOwnProperty(key);
                },
                /**
                 * Fetches the next siblings for the current items
                 * @returns {_}
                 */
                next: function () {
                    var siblings = [];
                    this.each(function () {
                        if (this.nextElementSibling)
                            siblings.push(this.nextElementSibling);
                    });
                    return _(siblings, this.debug);
                },
                /**
                 * Fetches the previous siblings for the current items
                 * @returns {_}
                 */
                prev: function () {
                    var siblings = [];
                    this.each(function () {
                        if (this.previousElementSibling)
                            siblings.push(this.previousElementSibling);
                    });
                    return _(siblings, this.debug);
                },
                /**
                 * Converts an object to query string
                 * @param {Object} obj
                 * @returns {String}
                 */
                objectToQueryString: objToQStr,
                /**
                 * Adds an event listener
                 * @param string event
                 * @param function callback
                 * @returns __
                 */
                on: function (event, selector, callback) {
                    if (this.isFunction(selector) && !callback) {
                        callback = selector;
                        selector = null;
                    }
                    var _this = this;
                    return this.each(function () {
                        var target = this;
                        _this.forEach(event.replace(',', ' ').split(' '), function (i, v) {
                            target.addEventListener(v.trim(), function (e) {
                                // get target from event
                                var _target = e.target;
                                // target is not selector
                                if (selector && _target && !_target.matches(selector)) {
                                    // find target from parents
                                    _target = _target.closest(selector);
                                    // target still not found
                                    if (!_target)
                                        return; // ignore callback
                                }
                                // apply callback on target
                                _this.callable(callback).apply(_target, Array.from(arguments));
                            }, false);
                        });
                    });
                },
                /**
                 * Fetches the outer html of the first item
                 * @returns string
                 */
                outerHtml: function () {
                    return this.tryCatch(function () {
                        return this.items.length ? this.items[0].outerHTML : '';
                    });
                },
                /**
                 * Fetches the parent of the current items
                 * @returns _
                 */
                parent: function () {
                    var parents = [];
                    this.each(function () {
                        parents.push(this.parentElement);
                    });
                    return _(parents, this.debug);
                },
                /**
                 * Prepend content to the elements
                 * @param mixed content
                 * @returns __
                 */
                prepend: function (content) {
                    if (!content)
                        return this;
                    var _content = content;
                    if (this.isString(content) && !content.trim().startsWith('<'))
                        _content = this.createElement(null, 'span').items[0].innerHTML = content;
                    if (!(content instanceof _))
                        _content = _(content, this.debug);
                    if (!_content.length)
                        return this;
                    return this.each(function () {
                        var _this = this;
                        _content.each(function () {
                            _this.insertAdjacentElement('afterBegin', this);
                        });
                    });
                },
                /**
                 * Sets or gets the given property
                 * @param string prop
                 * @param mixed value
                 * @returns __
                 */
                prop: function (prop, value) {
                    return this.tryCatch(function () {
                        if (value !== undefined) {
                            this.each(function (i, v) {
                                v[prop] = value;
                            });
                            return this;
                        }
                        return prop && this.items.length ? this.items[0][prop] : null;
                    });
                },
                /**
                 * Converts a query string to object
                 * @param {String} str
                 * @returns {Object}
                 */
                queryStringToObject: qStrToObj,
                /**
                 * Calls the given function when the dom has been fully loaded
                 * @param {function} callback
                 * @returns {_}
                 */
                ready: function (callback) {
                    _(document, this.debug).on('DOMContentLoaded', callback);
                    return this;
                },
                /**
                 * Removes an element from the DOM
                 * @returns object The removed element
                 */
                remove: function () {
                    var removed = [];
                    this.each(function () {
                        if (this.parentElement)
                            removed.push(this.parentElement.removeChild(this));
                    });
                    return _(removed, this.debug);
                },
                /**
                 * Removes the item at the given index from the given array
                 * @param array array
                 * @param integer index
                 * @returns mixed The removed item
                 */
                removeArrayIndex: function (array, index) {
                    return this.tryCatch(function () {
                        return array.splice(index, 1)[0];
                    });
                },
                /**
                 * Removes the given item from the given array
                 * @param array array
                 * @param mixed item
                 * @param boolean all Indicates whether to remove all occurrences
                 * @returns array|index Index if removing just one
                 */
                removeArrayValue: function (array, item, all) {
                    return this.tryCatch(function () {
                        var index = array.indexOf(item), retArr = [];
                        if (index < 0) {
                            index = array.indexOf(parseInt(item));
                        }
                        if (!all) {
                            return index > -1 ? [this.removeArrayIndex(array, index)] : [];
                        }
                        else {
                            while (index > -1) {
                                var value = this.removeArrayIndex(array, index);
                                if (value || value == 0)
                                    retArr.push(value);
                                index = array.indexOf(item);
                                if (index < 0)
                                    index = array.indexOf(parseInt(item));
                            }
                            return retArr;
                        }
                    });
                },
                /**
                 * Removes the given attr(s) from elements
                 * @param {string}|{array} attr
                 * @returns ThisApp
                 */
                removeAttr: function (attr) {
                    var _this = this;
                    if (attr && !__.isArray(attr)) {
                        attr = [attr];
                    }
                    return this.each(function () {
                        var __this = this;
                        if (!attr) {
                            _this.forEach(Array.from(this.attributes), function () {
                                __this.removeAttribute(this.name);
                            });
                            return;
                        }
                        __.forEach(attr, function (i, v) {
                            __this.removeAttribute(v);
                        });
                    });
                },
                /**
                 * Removes the given class from matched elements
                 * @param string className
                 * @returns _
                 */
                removeClass: function (className) {
                    var _this = this;
                    return this.each(function () {
                        var __this = this;
                        _this.forEach(className.split(' '), function (i, v) {
                            __this.classList.remove(v);
                        });
                    });
                },
                /**
                 * Removes a data key
                 * @param {string} key
                 * @returns {ThisApp}
                 */
                removeData: function (key) {
                    return this.each(function () {
                        privData.unset(this, key);
                        delete this.dataset[key];
                    });
                },
                /**
                 * Shortcut to removeAttr('this-*')
                 */
                removeThis: function (attr) {
                    return this.removeAttr('this-' + attr);
                },
                /**
                 * Replaces current items with the given content
                 * @param mixed content
                 * @returns __
                 */
                replaceWith: function (content) {
                    var replaced = [];
                    content = _(content, this.debug);
                    this.each(function () {
                        var _content = content.items[0];
                        if (!_content)
                            return;
                        this.replaceWith(_content);
                        replaced.push(_content);
                    });
                    this.items = replaced;
                    return this;
                },
                /**
                 * Fetches all siblings of matched elements
                 * @param string selector
                 * @returns _
                 */
                siblings: function (selector) {
                    var siblings = [];
                    this.each(function () {
                        var rId = false, query = '', _this = this;
                        if (!this.id) {
                            this.id = __.randomString();
                            rId = true;
                        }
                        if (selector) {
                            __.forEach(selector.split(','), function (i, sel) {
                                if (query)
                                    query += ',';
                                query += sel + ':not(#' + _this.id + ')';
                            });
                        }
                        else
                            query = ':not(#' + _this.id + ')';
                        siblings = siblings.concat(_(this.parentElement, this.debug)
                                .children(query).items);
                        if (rId)
                            this.removeAttribute('id');
                    });
                    return _(siblings, this.debug);
                },
                /**
                 * Shows the matched elements
                 * @returns __
                 */
                show: function () {
                    var _this = this;
                    return this.each(function () {
                        var __this = _(this, _this.debug);
                        if (__this.data('display') && __this.data('display') !== 'none') {
                            this.style.display = __this.data('display');
                            __this.removeData('display');
                        }
                        else {
                            this.style.display = '';
                        }
                    });
                },
                /**
                 * Set or get the text content of an element
                 * @param mixed content
                 * @returns __
                 */
                text: function (content) {
                    if (content === undefined) {
                        return this.tryCatch(function () {
                            return this.items.length ? this.items[0].innerText : '';
                        });
                    }
                    return this.each(function () {
                        this.innerText = content;
                    });
                },
                /**
                 * Shortcut to calling attr('this-*')
                 */
                this: function (attr, val) {
                    return this.attr('this-' + attr, val);
                },
                /**
                 * Toggles display of matched elements
                 * @returns _
                 */
                toggle: function () {
                    var _this = this;
                    this.each(function () {
                        if (_(this, _this.debug).css('display') === 'none') {
                            _(this, _this.debug).show();
                        }
                        else {
                            _(this, _this.debug).hide();
                        }
                    });
                    return this;
                },
                /**
                 * Toggles an element class
                 * @param {string} className
                 * @returns {_}
                 */
                toggleClass: function (className) {
                    return this.each(function () {
                        var _this = _(this);
                        if (_this.hasClass(className))
                            _this.removeClass(className);
                        else
                            _this.addClass(className);
                    });
                },
                /**
                 * Parses a string to object
                 * @param {string} string
                 * @returns {Array|Object}
                 */
                toJSONObject: function (string) {
                    return this.tryCatch(function () {
                        return JSON.parse(string);
                    }, function () {});
                },
                /**
                 * Parse an object to string
                 * @param {Object} object
                 * @returns {String}
                 */
                toJSONString: function (object) {
                    return this.tryCatch(function () {
                        return JSON.stringify(object);
                    }, function () {});
                },
                /**
                 * Triggers the given event on current items
                 * @param string event
                 * @param object data custom data to add to the event object
                 * @returns __
                 */
                trigger: function (event, detail) {
                    var data = {
                        detail: detail,
                        cancelable: true,
                        bubbles: true
                    }, ev = new CustomEvent(event, data);
                    return this.each(function () {
                        this.dispatchEvent(ev);
                    });
                },
                /**
                 * Calls the given function in a try...catch block and outputs any errors to the console if 
                 * debug mode is enabled.
                 * @param function callback
                 * @param array args Array of parameters to pass into the callback function
                 * @returns mixed
                 */
                tryCatch: function (tryCallback, catchCallback) {
                    try {
                        return this.callable(tryCallback).call(this);
                    }
                    catch (e) {
                        if (!catchCallback)
                            this.error(e.message);
                        else
                            return this.callable(catchCallback).call(this, e);
                    }
                },
                /**
                 * Sets the value of a form element
                 * @param mixed value
                 * @returns __|string
                 */
                val: function (value) {
                    var val;
                    this.each(function () {
                        if (value !== undefined) {
                            this.value = value;
                            _(this).attr('value', value);
                            return;
                        }
                        val = this.value;
                    });
                    return value !== undefined ? this : val;
                },
                /**
                 * A shortcut to method on()
                 * @param string event
                 * @param string target ID of the page to target. It could also be in forms TYPE or TYPE#ID e.g
                 * collection#users. This means the target is a collection of id `users`. Target all collection
                 * by specifying only collection
                 * Multiple elements may be targeted by separating their selectors by a comma.
                 * @param function callback
                 * @returns ThisApp
                 */
                when: function (event, target, callback) {
                    return this.tryCatch(function () {
                        return when.call(this, event, target, callback);
                    });
                },
                /**
                 * Wraps the current elements with the given element
                 * @param {_}|{HTMLElement elem
                 * @returns {_}
                 */
                wrap: function (elem) {
                    var _this = this,
                            elem = _(elem, this.debug);
                    return this.each(function () {
                        _(this, _this.debug).before(elem)
                                .prev().html(this);
                    });
                }
            }),
            /**
             * Creates a wrapper for traversing the DOM
             * @param {string}|{array}|{HTMLCollection}|{object} selector
             * If as string, selector contains tags, they are created unattached to the DOM
             * @param {boolean} debug
             * @returns {_}
             */
            _ = function (selector, debug) {
                if (!(this instanceof _)) {
                    return new _(selector, debug);
                }
                else if (selector instanceof _) {
                    return selector;
                }
                else if (!selector) {
                    this.items = [];
                }
                else if (this.isObject(selector)) {
                    this.items = selector instanceof HTMLCollection ?
                            Array.from(selector) : [selector];
                }
                else if (this.isArray(selector)) {
                    this.items = selector;
                }
                else if (this.isString(selector)) {
                    var _this = this.createElement(selector);
                    if (selector.trim().startsWith('<thead') || selector.trim().startsWith('<tbody')) {
                        return this.createElement(selector, 'table');
                    }
                    else if (selector.trim().startsWith('<tr')) {
                        return this.createElement(selector, 'table').children();
                    }
                    else if (selector.trim().startsWith('<td') || selector.trim().startsWith('<th')) {
                        return this.createElement(selector, 'table').children().children();
                    }
                    else if (_this.length) {
                        return _this;
                    }
                    this.items = Array.from(document.querySelectorAll(selector));
                }
                else {
                    this.error('Invalid selector');
                }
                this.debug = debug !== false ? true : false;
                this.length = this.items.length;
                return this;
            },
            /**
             * Internal (hidden) methods
             */
            ext = {
                records: {},
                /**
                 * Binds the target to the model of the given element
                 * @param {_}|{string} _target
                 * @param {_}|{string} _elem
                 * @param {string} childKey The child key to bind on the target
                 * @returns {Promise}
                 */
                bindToElementModel: function (_target, _elem, childKey) {
                    _target = this._(_target);
                    _elem = this._(_elem);
                    if (!_target.length || !_elem.length)
                        return Promise.reject('Target or Element not found');
                    else if (!_elem.this('mid') ||
                            (!_elem.this('id') && !_elem.this('model'))) {
                        this.error('Element to bind must be already bound to model.');
                        return Promise.reject('Element to bind must be already bound to model.');
                    }
                    var model_name = _elem.this('model') || _elem.this('id'),
                            selector = ext.elementToSelector.call(this, _target, true),
                            _tmpl = this.getCached(selector),
                            app = this;
                    if (_tmpl.length) {
                        if (_target.this('tar'))
                            _tmpl.this('tar', _target.this('tar'));
                        _target = _target.replaceWith(_tmpl);
                    }

                    _target = ext.doTar.call(this, _target, true);
                    return this.promise(function (resolve, reject) {
                        this.collection(model_name)
                                .then(function (collection) {
                                    return collection.model(_elem.this('mid'), {
                                        url: _elem.this('url')
                                    });
                                })
                                .then(function (model) {
                                    if (childKey) {
                                        var data = ext.getVariableValue
                                                .call(app, childKey, model.attributes);
                                        ext.bindToObject
                                                .call(app, _target, data,
                                                        function (elem) {
                                                            resolve(elem);
                                                        });
                                    }
                                    else {
                                        model.bind(_target.this('model', model_name)
                                                .this('mid', _elem.this('mid'))
                                                .this('url', _elem.this('url'))
                                                .this('id-key', _elem.this('id-key')))
                                                .then(resolve)
                                                .catch(reject);
                                    }
                                });
                    });
                },
                /**
                 * Binds an elem to the given object
                 * @param {_}|{HTMLElement} elem
                 * @param {Object} object
                 * @param {string}|{integer} key The unique identifier of the object, if coming
                 * from a list
                 * @returns {_}
                 */
                bindToObject: function (elem, object, callback) {
                    var notWiths = ext.hideNotWiths.call(this, elem);
                    return ext.loadComponents.call(this, function () {
                        return ext.parseData.call(this, object, elem, false, true,
                                function (elem) {
                                    ext.loadFormElements.call(this, elem.find('[this-is]'), object);
                                    ext.showNotWiths.call(this, elem, notWiths);
                                    ext.postLoad.call(app, elem);
                                    elem.trigger('model.binded', {
                                        data: object
                                    });
                                    this.__.callable(callback).apply(this, Array.from(arguments));
                                }.bind(this));
                    }.bind(this), elem.find('[this-component]'));
                },
                /**
                 * Checks beforeCallbacks for the given action to determine if the action should
                 * be continued
                 * @param {String} action
                 * @param {Array} params Parameters to pass to the callback
                 * @param {Object} context
                 * @returns {Boolean}
                 */
                canContinue: function (action, params, context) {
                    var response = true;
                    // check callback of page
                    if (this.page && this.beforeCallbacks[this.page.this('id')]) {
                        response = this.__.callable(this.beforeCallbacks[this.page.this('id')][action])
                                .apply(context || this, params);
                    }
                    // check common callback only if page callback didn't return false or doesn't exist
                    if (response !== false && this.beforeCallbacks['___common']) {
                        response = this.__.callable(this.beforeCallbacks['___common'][action])
                                .apply(context || this, params);
                    }
                    return response || response !== false;
                },
                /**
                 * Check if container is a table's descendant tag
                 * and properly parses it.
                 * @param {_}|{string} container
                 * @returns {array}
                 */
                checkTableContent: function (container) {
                    container = this._(container);
                    // for processing table and its descendants' templates
                    var level = 0,
                            // the template element
                            child = container.get(0);
                    if (child) {
                        // process content properly
                        switch (child.tagName.toLowerCase()) {
                            case "td":
                                level = 3;
                                container = this._('<table />').html(container.outerHtml());
                                break;
                            case "tr":
                                level = 2;
                                container = this._('<table />').html(container.outerHtml());
                                break;
                            case "tbody":
                                level = 1;
                                container = this._('<table />').html(container.outerHtml());
                        }
                    }
                    return {
                        level: level,
                        container: container
                    };
                },
                /**
                 * Called when a component has been loaded
                 * @param {_} components All components being loaded
                 * @param {Function} callback Function to call when all components have been loaded
                 * @param Tracks the remaining components to be loaded befoe callback should be called
                 */
                componentLoaded: function (components, callback, remaining) {
                    if (!remaining) {
                        components = this.container.find('[this-component]');
                        remaining = components.length;
                        if (!remaining)
                            return this.__.callable(callback).call(this);
                    }
                    ext.loadComponent
                            .call(this, components.get(components.length - remaining),
                                    function () {
                                        remaining--;
                                        ext.componentLoaded.call(this, components, callback, remaining);
                                    }.bind(this));
                },
                /**
                 * Dispatches a page event for only the page
                 * @param {String} event
                 * @param {Object} anchor
                 * @param {Array} params
                 */
                dispatchEvent: function (event, anchor, params) {
                    return this.__.callable(containedEvents[event][this.page.this('id')])
                            .apply(anchor, params);
                },
                /**
                 * Does the loading
                 * @param {HTMLElement}|{_} container
                 * @param object data
                 * @param string content
                 * @param {boolean} isModel Indicates whether loading a model or not
                 * @param {Function} callback
                 * @returns ThisApp
                 */
                doLoad: function (container, data, content, isModel, level, callback) {
                    container = this._(container).hide();
                    var uid = container.this('model-id-key') ||
                            container.this('id-key') || '',
                            id = ext.getUIDValue.call(this, data, uid),
                            url = container.this('url') || '',
                            url_parts = url.split('?');
                    url = url_parts[0];
                    if (url && !url.endsWith('/'))
                        url += '/';
                    var _callback = function (_temp) {
                        ext.loadFormElements
                                .call(this, _temp.find('[this-is]'), data);
                        while (level) {
                            _temp = _temp.children();
                            level--;
                        }
                        if (!isModel) {
                            _temp.this('mid', id)
                                    .this('id-key', uid)
                                    .this('type', 'model')
                                    .this('in-collection', '');
                            if (!_temp.this('url'))
                                _temp.this('url', url + id);
                            if (container.this('model'))
                                _temp.this('id', container.this('model'));
                            container[container.hasThis('prepend')
                                    ? 'prepend' : 'append'](_temp.show())
                                    .removeThis('loading');
                        }
                        else {
                            container.this('id-key', uid).this('mid', id);
                            container.html(_temp.html()).show();
                        }
                        this.__.callable(callback).call(this, container);
                    }.bind(this);
                    ext.parseData
                            .call(this, data, isModel ? container : content, false, isModel, _callback);
                    return this;
                },
                /**
                 * Parses temporary attributes
                 * @param _ __this
                 * @param boolean noShow Indicates whether not to show the element
                 * @returns object _ The template object
                 */
                doTar: function (__this, noShow) {
                    __this = this._(__this);
                    var type = getElemType(__this) || '',
                            tar = type + '#' + __this.this('id');
                    if (this.tar[tar]) {
                        this.__.forEach(this.tar[tar], function (i, v) {
                            __this.this('' + i, v);
                        });
                        delete this.tar[tar];
                    }
                    if (__this.this('tar')) {
                        styleToObj(__this.this('tar'), function (key, val) {
                            __this.this(key, val);
                        });
                    }
                    if (!noShow && type !== 'page')
                        __this.show();
                    return __this.removeThis('tar');
                },
                /**
                 * Converts an element to selector string
                 * @param {_} elem
                 * @param {boolean} ignoreType
                 * @returns {string}
                 */
                elementToSelector: function (elem, ignoreType) {
                    elem = this._(elem);
                    var selector = elem.get(0).tagName.toLowerCase();
                    if (elem.this('id'))
                        selector += '[this-id="' + elem.this('id') + '"]';
                    if (!ignoreType && elem.this('type'))
                        selector += '[this-type="' + elem.this('type') + '"]';
                    if (elem.attr('class'))
                        selector += '.' + elem.attr('class').replace(/\s/g, '.');
                    return selector;
                },
                /**
                 * Empty lists, models and collections in the given elem.
                 * When these are being loaded, their content is gotten from the
                 * templates.
                 * @param {_}|{HTMLElement} elem
                 * @param {boolean} emptyLoaded Indicates whether to empty loaded features as well
                 * @returns {ThisApp}
                 */
                emptyFeatures: function (elem, emptyLoaded) {
                    this._(elem)
                            .find(emptyLoaded ?
                                    'list,collection,[this-type="list"],[this-type="model"],[this-type="collection"]'
                                    : 'list:not([this-loaded]),model:not([this-loaded])'
                                    + ',collection:not([this-loaded]),[this-type="list"]:not([this-loaded])'
                                    + ',[this-type="collection"]:not([this-loaded])')
                            .each(function () {
                                this.innerHTML = '';
                            });
                    return this;
                },
                /**
                 * Calls JS eval on the content after parsing it for variables
                 * @param {string} content
                 * @param {object} data
                 * @returns {mixed}
                 */
                eval: function (content, data) {
                    var variables = ext.parseBrackets.call(this, '{{', '}}', content);
                    content = ext.fillVariables.call(this, variables, data, content);
                    return this.tryCatch(function () {
                        return eval(content);
                    }, function () {
                        return;
                    });
                },
                /**
                 * Extends the given layout
                 * @param {_} _layout
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                extendLayout: function (_layout, replaceInState) {
                    var __layout = _layout.clone(), app = this;
                    // load layout assets (css)
                    ext.loadAssets.call(this, __layout);
                    // get existing layout in container
                    _layout = this.reloadLayouts ? _() :
                            this.container.find('layout[this-id="'
                                    + __layout.this('extends')
                                    + '"],[this-type="layout"][this-id="'
                                    + __layout.this('extends') + '"]');
                    // layout doesn't exist in container
                    if (!_layout.length)
                        // get from templates
                        _layout = this.getCached('[this-type="layouts"] [this-id="'
                                + __layout.this('extends') + '"]', 'layout');
                    // doesn't exist in templates
                    if (!_layout.length) {
                        // get from filesystem
                        ext.fullyFromURL.call(this, 'layout', __layout.this('extends'),
                                function (_layout) {
                                    __layout.removeThis('extends');
                                    _layout.removeThis('url')
                                            .find('[this-content]').html(__layout);
                                    if (_layout.this('extends'))
                                        ext.extendLayout
                                                .call(app, _layout, replaceInState);
                                    else
                                        ext.finalizePageLoad
                                                .call(app, _layout, replaceInState);
                                },
                                function () {
                                    app.error('Layout [' + __layout.this('extends')
                                            + '] not found!');
                                    __layout.removeThis('extends');
                                    ext.finalizePageLoad.call(app, __layout, replaceInState);
                                });
                    }
                    else {
                        __layout.removeThis('extends');
                        if (_layout.this('url')) {
                            this.request({
                                url: _layout.this('url'),
                                success: function (data) {
                                    _layout.removeThis('url')
                                            .html(data)
                                            .find('[this-content]')
                                            .html(__layout.show());
                                    if (_layout.this('extends')) {
                                        ext.extendLayout.call(app, _layout, replaceInState);
                                    }
                                    else {
                                        ext.finalizePageLoad.call(app, _layout,
                                                replaceInState);
                                    }
                                },
                                error: function () {
                                },
                                dataType: 'text'
                            });
                        }
                        else {
                            _layout.find('[this-content]')
                                    .html(__layout.removeThis('extends').show());
                            if (_layout.this('extends')) {
                                ext.extendLayout.call(this, _layout, replaceInState);
                            }
                            else {
                                ext.finalizePageLoad.call(this, _layout, replaceInState);
                            }
                        }
                    }
                },
                /**
                 * Fills an autocomplete list with the data given
                 * @param {string} selector
                 * @param {object} data
                 * @param {string} uid
                 * @returns {array} Array of ids added to the list
                 */
                fillAutocompleteList: function (options) {
                    var app = this,
                            ids = [],
                            data_length = Object.keys(options.data).length;
                    // loop through data
                    this.__.forEach(options.data, function (i, v) {
                        // filter list
                        if (options.filter) {
                            var kontinue,
                                    current = {
                                        index: i,
                                        model: v
                                    };
                            try {
                                kontinue = eval(options.filter);
                            }
                            catch (e) {
                            }
                            if (!kontinue)
                                return;
                        }
                        // get unique id value
                        var id = ext.getUIDValue.call(app, v);
                        // don't render elem if already selected
                        var selected = options.list
                                .this('selected') || '';
                        if (selected.indexOf(id + ',') !== -1) {
                            data_length--;
                            return;
                        }
                        ids.push(id);
                        // bind object to element
                        ext.bindToObject
                                .call(app, app
                                        .getCached('[this-type="list"][this-id="'
                                                + options.list.this('id') + '"],list[this-id="'
                                                + options.list.this('id') + '"]')
                                        .children(), v,
                                        function (elem) {
                                            elem.show();
                                            options.list.append(elem
                                                    .this('index', i)
                                                    .this('type', 'listing')
                                                    .this('id', id)).show();
                                        });
                    });
                    if (data_length)
                        options.list.trigger('list.loaded');
                    else
                        options.list.trigger('list.no.data');
                    return ids;
                },
                /**
                 * Fills content variables with data
                 * @param array variables
                 * @param array data
                 * @param string content
                 * @returns string
                 */
                fillVariables: function (variables, data, content) {
                    var app = this;
                    if (variables && data && content) {
                        this.__.forEach(variables, function (i, v) {
                            var value = ext.getVariableValue.call(app, v, data);
                            content = content.replace(v, value || value == 0 ? value : v);
                        });
                    }
                    return content;
                },
                /**
                 * Finalizes page load after layouts have been loaded
                 * @param {_} _layout
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                finalizePageLoad: function (_layout, replaceInState) {
                    this.removedAssets = {};
                    ext.loadAssets.call(this, _layout);
                    var app = this;
                    if (_layout && _layout.length) {
                        if (!_layout.hasThis('loaded'))
                            this.container.html(_layout.show());
                        _layout.trigger('layout.loaded');
                    }
                    else
                        this.container.html(this.page);
                    this.page = this.container
                            .find('page[this-id="' + this.page.this('id')
                                    + '"]:not([this-dead]),'
                                    + '[this-type="page"][this-id="'
                                    + this.page.this('id')
                                    + '"]:not([this-dead])')
                            .this('current', '')
                            .removeThis('layout').hide();
                    this.container.find('[this-type]:not([this-type="page"]):not(page)'
                            + ':not(layout):not([this-type="layout"])'
                            + ':not(component):not([this-type="component"])').hide();
                    // delete pageModel for last page
                    delete this.pageModel;
                    this.pageIsLoaded = false;
                    // callback for when page assets have been loaded
                    var loadedAssets = function () {
                        ext.loadComponents.call(this, function () {
                            this.page = ext.doTar.call(this, this.page).hide();
                            // load page as model if attached to a model
                            if (this.page.this('url') && this.page.this('model')
                                    && this.page.this('do') !== 'create') {
                                // get page model's collection
                                this.collection(this.page.this('model'))
                                        .then(function (collection) {
                                            return collection.model(this.page.this('mid'), {
                                                url: this.page.this('url'),
                                                ignoreCache: this.page.hasThis('ignore-cache')
                                                        || !this.config.cacheData
                                            });
                                        }.bind(this))
                                        .then(function (model) {
                                            this.pageModel = model;
                                            // load page model. data provided
                                            ext.loadModel.call(this, this.page, function () {
                                                ext.showPage.call(this, replaceInState);
                                            }.bind(this), model.attributes || {});
                                        }.bind(this))
                                        .catch(function () {
                                            // load page model. no data provided. request anew
                                            ext.loadModel.call(app, this.page, function () {
                                                ext.showPage.call(this, replaceInState);
                                            }.bind(app), null);
                                        });
                            }
                            else {
                                // load page as a model. no data provided
                                ext.showPage.call(this, replaceInState);
                            }
                        }.bind(this));
                    }.bind(this);
                    // load page content from elsewhere
                    if (this.page.this('path')) {
                        this.request({
                            url: this.page.this('path'),
                            success: function (data) {
                                app.page.html(data).show()
                                        .find('[this-type]'
                                                + ':not(component):not([this-type="component"])')
                                        .hide();
                                ext.loadAssets.call(app, app.page, loadedAssets);
                            },
                            error: function () {
                            },
                            dataType: 'text'
                        });
                    }
                    // just load the page assets
                    else {
                        ext.loadAssets.call(this, this.page, loadedAssets);
                    }
                },
                /**
                 * Loads a type fully from URL
                 * @param {string} type page || layout || component
                 * @param {string} idOrPath
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                fullyFromURL: function (type, idOrPath, success, error) {
                    if (!this.config.paths) {
                        this.__.callable(error).call(this);
                        return;
                    }
                    var app = this,
                            pathConfig = this.config.paths[type + 's'];
                    if (!this.__.isObject(pathConfig)) {
                        this.__callable(error).call(this);
                        return;
                    }
                    var url = pathConfig.dir + idOrPath + pathConfig.ext;
                    this.request({
                        url: url,
                        success: function (data) {
                            var elem = app.__.createElement(data),
                                    prep4Tmpl = function (elem) {
                                        var content = ext.removeComments.call(app, elem.html());
                                        elem.html(content);
                                        elem.find('[this-type="collection"]:not([this-model]),'
                                                + 'collection:not([this-model])')
                                                .each(function () {
                                                    app._(this).this('model', app._(this).this('id'));
                                                });
                                        elem.find('[this-autocomplete][this-list]')
                                                .each(function () {
                                                    var __this = app._(this);
                                                    elem.find('list[this-id="' + __this.this('list')
                                                            + '"],[this-type="list"][this-id="' + __this.this('list')
                                                            + '"]')
                                                            .this('autocompleting', __this.this('id'));
                                                });
                                        elem.find('img[src]').each(function () {
                                            var __this = app._(this);
                                            if (!__this.attr('src'))
                                                return;
                                            __this.attr('this-src', __this.attr('src'))
                                                    .removeAttr('src');
                                        });
                                    },
                                    done = function () {
                                        app.__.callable(success).call(this, elem.clone());
                                    }.bind(this);
                            // components
                            if (type === 'component') {
                                if (elem.length > 1 || (elem.hasThis('type') && elem.this('type') !== 'component'))
                                    elem = app._('<div/>').html(elem);
                                elem.this('component-url', idOrPath);
                                prep4Tmpl(elem);
                                ext.loadCollections.call(app,
                                        function () {
                                            app.addToCache(app._('<div this-type="component"'
                                                    + ' this-url="' + idOrPath + '" />')
                                                    .html(elem.clone().removeThis('url')));
                                            done();
                                        }, elem.find('[this-type="collection"][this-static],'
                                        + 'collection[this-static]'));
                            }
                            // pages and layouts
                            else {
                                if (!elem.length || elem.length > 1) {
                                    elem = app._('<div this-type="' + type + '" />')
                                            .html(data);
                                }
                                else if (!elem.is(type) && elem.this('type') !== type) {
                                    if (elem.this('type'))
                                        elem = elem.wrap('<div this-type="page" />').parent();
                                    else
                                        elem.this('type', type);
                                }
                                // overwrite id from idOrPath
                                elem.this('id', idOrPath.replace(/\/\\/g, '-'));
                                if (type === 'page') {
                                    if (idOrPath.indexOf('/') !== -1)
                                        elem.this('path', idOrPath);
                                    prep4Tmpl(elem);
                                }
                                app.addToCache(elem);
                                done();
                            }
                        },
                        error: function (e) {
                            app.__.callable(error).call(this, e);
                        },
                        dataType: 'text'
                    });
                },
                /**
                 * Generates a key for the request
                 */
                generateRequestKey: function () {
                    if (!ext.isRunning.call(this))
                        return;
                    var key = this.__.randomString(12);
                    ext.record.call(this, 'requestKey', key);
                    return key;
                },
                /**
                 * Fetches all the comments in the content denoted by {:...:}
                 * @param {string} content
                 * @returns {Array}
                 */
                getComments: function (content) {
                    return ext.parseBrackets.call(this, '{:', ':}', content);
                },
                /**
                 * Fetches the value of the variable on a deep level
                 * @param string variable May contain dots (.) which denote children keys
                 * @param object data The object from which to get the value
                 * @returns string
                 */
                getDeepValue: function (variable, data) {
                    var value = data, vars = __.isObject(variable, true) ? variable : variable.split('.');
                    __.forEach(vars, function (i, v) {
                        if (!value)
                            return false;
                        value = value[v];
                    });
                    return value || value == 0 ? value : '';
                },
                /**
                 * Fetches all the expressions in the content
                 * @param {string} content
                 * @returns {Array}
                 */
                getExpressions: function (content) {
                    var exps = [];
                    this.__.forEach(content.split('({'), function (i, v) {
                        if (!i)
                            return;
                        exps.push('({' + v.split('})')[0] + '})');
                    });
                    return exps;
                },
                /**
                 * Fetches and clears the generated request key
                 * @returns {string}
                 */
                getRequestKey: function () {
                    if (!ext.isRunning.call(this))
                        return;
                    var key = ext.record.call(this, 'requestKey');
                    delete ext.records[this.container.this('id')].requestKey;
                    return key;
                },
                /**
                 * Fetches the value of the uid of the given data
                 * @param {object} data
                 * @param {string} uid If not provided, the default in the config is fallen
                 * back to
                 * @returns {mixed}
                 */
                getUIDValue: function (data, uid) {
                    return ext.getDeepValue.call(this, uid || this.config.idKey, data);
                },
                /**
                 * Retrieves the value of the variable from the data and filters it if required
                 * @param {string} variable
                 * @param {object} data
                 * @returns {mixed}
                 */
                getVariableValue: function (variable, data) {
                    if (!variable)
                        return;
                    var app = this,
                            // remove brackets
                            vars = variable.replace(/{*}*/g, '')
                            // replace escaped pipes
                            .replace(/\\\|/g, '__fpipe__').split('|'),
                            // the first element is the variable name
                            varname = vars.shift(0),
                            // get the variable value
                            value = this.__.contains(varname, '.') ?
                            ext.getDeepValue.call(null, varname, data) : data[varname];
                    // go through filters
                    this.__.forEach(vars, function (i, v) {
                        // changed escaped pipes to real pipes
                        v = v.replace(/__fpipe__/g, '|');
                        // get filter parts
                        var parts = v.split('='),
                                // the first element is the filter name
                                filter = parts.shift(0);
                        // check filter exists
                        if (Filters[filter])
                            // run filter
                            value = Filters[filter](value, parts.join(';'));
                    });
                    if (!value && value != 0)
                        return;
                    return value;
                },
                /**
                 * Hides elements that should not be loaded with the given element
                 */
                hideNotWiths: function (elem) {
                    // hold not withs
                    var _not_with = elem.find('[this-not-with="'
                            + elem.this('id') + '"]'),
                            cnt = 0,
                            notWiths = {};
                    if (!elem.this('id'))
                        elem.this('id', this.__.randomString());
                    while (_not_with.length) {
                        var name = elem.this('id') + '-' + cnt;
                        notWiths[name] = _not_with.get(0);
                        this._(_not_with.get(0)).replaceWith('<div this-with="'
                                + name + '" />');
                        // find next notWith
                        _not_with = elem.find('[this-not-with="'
                                + elem.this('id') + '"]');
                        cnt++;
                    }
                    return notWiths;
                },
                /**
                 * Does things on looped objects
                 * @param {object} current Object containing the key/index and the value/model 
                 * currently being processed
                 * @param {string} filter Expression to evaluate on content
                 * @param {string} content
                 * @returns {_}
                 */
                inLoop: function (current, filter, content, returnObject) {
                    /* evaluates filter */
                    var good = this.tryCatch(function () {
                        if (filter && !eval(filter))
                            return false;
                        return true;
                    }, function () {
                        return false;
                    });
                    if (!good)
                        return;
                    content = this._('<div/>').html(content);
                    var app = this, level = 0, matched = {};
                    content.find('collection,model,list,[this-repeat-for],'
                            + '[this-type="collection"],[this-type="model"],[this-type="list"]')
                            .each(function () {
                                var __this = app._(this);
                                __this.html(__this.html()
                                        .replace(/\{\{/g, '__obrace__')
                                        .replace(/\}\}/g, '__cbrace__')
                                        .replace(/\(\{/g, '__obrace2__')
                                        .replace(/\}\)/g, '__cbrace2__'));
                                if (__this.this('this-repeat-for')) {
                                    __this.find('[this-if], [this-else-if], [this-else]')
                                            .this('ignore', '').this('muted', '');
                                }
                            });
                    content.find('[this-if],[this-else-if],[this-else]')
                            .each(function () {
                                var __this = app._(this);
                                if (__this.hasThis('ignore'))
                                    return;
                                else if (__this.this('if')) {
                                    try {
                                        level++;
                                        matched[level] = false;
                                        if (eval(__this.this('if').trim())) {
                                            __this.removeThis('if');
                                            matched[level] = true;
                                        }
                                        else {
                                            __this.remove();
                                        }
                                    }
                                    catch (e) {
                                        __this.remove();
                                    }
                                    if (__this.hasThis('end-if')) {
                                        __this.removeThis('end-if');
                                        delete matched[level];
                                        level--;
                                    }
                                }
                                else if (__this.this('else-if')) {
                                    try {
                                        if (!__.isBoolean(matched[level])) {
                                            app.error('Branching error: Else-if without If!');
                                            return;
                                        }
                                        if (matched[level] || !eval(__this.this('else-if').trim()))
                                            __this.remove();
                                        else {
                                            __this.removeThis('else-if');
                                            matched[level] = true;
                                        }
                                    }
                                    catch (e) {
                                        __this.remove();
                                    }
                                    if (__this.hasThis('end-if')) {
                                        __this.removeThis('end-if');
                                        delete matched[level];
                                        level--;
                                    }
                                }
                                else if (__this.hasThis('else')) {
                                    try {
                                        if (!__.isBoolean(matched[level])) {
                                            app.error('Branching error: Else without If!');
                                            return;
                                        }
                                        if (matched[level])
                                            __this.remove();
                                        else {
                                            __this.removeThis('else');
                                        }
                                    }
                                    catch (e) {
                                        __this.remove();
                                    }
                                    if (__this.hasThis('end-if'))
                                        __this.removeThis('end-if');
                                    delete matched[level];
                                    level--;
                                }
                            });
                    content.find('[this-ignore]').removeThis('ignore');
                    return returnObject ? content.children() : content.html();
                },
                /**
                 * Checks that the type of container matches the given type
                 * @param string type
                 * @param string|_ container
                 * @returns booean
                 */
                is: function (type, container) {
                    return this._(container).this('type') === type || this._(container).is(type);
                },
                /**
                 * Check if an app is running
                 */
                isRunning: function () {
                    var record;
                    if (this.container)
                        record = ext.record.call(this);
                    return record && record.running;
                },
                /**
                 * Loads the given type of asset on the given elementF
                 * @param {string} type js|css
                 * @param {string} name Asset filename, or full path to file if remote
                 * @param {_} elem
                 * @param {Function} callback
                 * @returns {ext}
                 */
                loadAsset: function (type, name, elem, callback) {
                    name = name.trim();
                    var url = (name.indexOf('://') !== -1 && name.startsWith('//')) ?
                            name : this.config.paths[type] + name,
                            app = this,
                            load = function (url) {
                                if (type === 'js') {
                                    eval(pageAssets['js'][url]);
                                }
                                else if (type === 'css') {
                                    elem.prepend('<style type="text/css">' + pageAssets['css'][url] + '</style>');
                                }
                                this.__.callable(callback).call(this, pageAssets[type][url]);
                            }.bind(this);
                    // ensure url ends with .type (.js|.css|...)
                    if (!url.endsWith('.' + type))
                        url += '.' + type;
                    if (!pageAssets[type])
                        pageAssets[type] = {};
                    if (ext.record.call(this, 'debug') || !pageAssets[type][url]) {
                        this.request({
                            dataType: type,
                            url: url,
                            success: function (content) {
                                pageAssets[type][url] = content;
                            },
                            complete: function () {
                                load(url);
                            }
                        });
                    }
                    else {
                        load(url);
                    }
                    return ext;
                },
                /**
                 * Loads the assets (css|js) for the given element
                 * @param {_} elem
                 * @returns {ext}
                 */
                loadAssets: function (elem, callback) {
                    var app = this,
                            elemType = getElemType(elem) || '',
                            leaveUnrequired,
                            loading = 0,
                            allChecked = false,
                            done = function () {
                                if (allChecked && !loading) {
                                    this.__.callable(callback).call(this);
                                }
                            }.bind(this);
                    if (elem.this('load-css') && !elem.hasThis('with-css')) {
                        loading++;
                        var csses = elem.this('load-css').split(',');
                        // load comma-separated css files
                        this.__.forEach(csses,
                                function (i, css) {
                                    ext.loadAsset.call(app, 'css', css, elem, function () {
                                        if (csses.length - 1 === i) {
                                            loading--;
                                            done();
                                        }
                                    });
                                });
                        elem.this('with-css', '').removeThis('load-css');
                    }

                    // mark all scripts as old by removing attribute `this-loaded`
                    if (!Object.keys(this.removedAssets).length)
                        this._('script[this-app="' + this.container.this('id') + '"]')
                                .removeThis('loaded');
                    if (elem.this('load-js-first') && !loadedPageJS.first[this.page.this('id')]) {
                        leaveUnrequired = true;
                        loading++;
                        var jses = elem.this('load-js-first').split(','),
                                removedAssets = this.removedAssets[elemType];
                        // load comma-separated css files
                        this.__.forEach(jses, function (i, js) {
                            ext.loadAsset.call(app, 'js', js, elem, function () {
                                // loaded js is last js
                                if (jses.length - 1 === i) {
                                    // remove elem-type css and js files that don't belong to
                                    // the elem type
                                    if (!removedAssets)
                                        app._('script[this-app="' + app.container.this('id')
                                                + '"][this-for="' + elemType + '"]:not([this-loaded])')
                                                .remove();
                                    loading--;
                                    done();
                                }
                            });
                        });
                        loadedPageJS.first[this.page.this('id')] = true;
                    }
                    // remove elem-type js files that don't belong to the elem type
                    if (!leaveUnrequired && !this.removedAssets[elemType])
                        this._('script[this-app="' + this.container.this('id')
                                + '"][this-for="' + elemType + '"]:not([this-loaded])')
                                .remove();
                    // indicate that unrequired js have been removed to avoid removal of currently
                    // required assets
                    this.removedAssets[elemType] = true;
                    allChecked = true;
                    done();
                    return ext;
                },
                /**
                 * Loads a collection
                 * @param {_}|{HTMLElement} __this
                 * @param {Function} callback
                 * @param {Object} data The data to load into the collection. If available and a url
                 * exists on __this, it is monitored for changes to the data.
                 * @param {boolean} replaceState
                 * @returns {void}
                 */
                loadCollection: function (__this, callback, data, replaceState) {
                    __this = this._(__this).this('loading', '');
                    // collection must have id
                    if (!__this.this('id')) {
                        __this.removeThis('loading');
                        this.__.callback(callback).call(this);
                        return;
                    }
                    if (!__this.this('model'))
                        __this.this('model', __this.this('id'));
                    // ensure collection content is grouped together
                    if (!__this.hasThis('loaded') && __this.children().length > 1) {
                        __this.innerWrap('<div/>');
                    }
                    // get collection content
                    var content = this.getCached('[this-id="'
                            + __this.this('id') +
                            '"]', 'collection')
                            .children()
                            .clone().outerHtml(),
                            app = this,
                            model_name = __this.this('model');
                    __this = ext.doTar.call(this, __this, true);
                    if (!__this.hasThis('paginate') ||
                            !__this.children(':first-child').this('mid')) {
                        __this.html('');
                    }
                    var requestData = {}, save = true, success, error;
                    if (app.page.this('query')) {
                        requestData['query'] = app.page.this('query');
                        /* don't save search response requestData */
                        save = false;
                    }
                    if (__this.this('search'))
                        requestData['keys'] = __this.this('search');
                    // paginate collection
                    if (__this.hasThis('paginate')) {
                        // update pagination
                        if (!__this.this('pagination-page')) {
                            __this.this('pagination-page', 0);
                        }
                        // add request data with pagination info
                        if (__this.this('pagination-page') !== undefined) {
                            requestData['page'] = parseInt(__this.this('pagination-page')) + 1;
                            __this.this('pagination-page', requestData['page']);
                            // add limit
                            if (__this.this('paginate')) {
                                requestData['limit'] = __this.this('paginate');
                            }
                            else if (this.config.pagination && this.config.pagination.limit) {
                                requestData['limit'] = this.config.pagination.limit;
                            }
                        }
                    }
                    // callbacks for request
                    success = function (data, uid, handled) {
                        if (uid)
                            __this.this('model-id-key', uid);
                        if (handled) {
                            ext.postLoad.call(app, __this);
                            app.__.callable(callback).call(app, data);
                            return;
                        }
                        ext.loadData
                                .call(app, __this, data, content, false, save,
                                        function (elem) {
                                            if (elem) {
                                                elem.this('loaded', '')
                                                        .removeThis('loading')
                                                        .trigger('collection.loaded');
                                            }
                                            ext.postLoad.call(app, elem);
                                            this.__.callable(callback).call(this, data);
                                        }.bind(app));
                    },
                            error = function () {
                                // revert pagination page to former page count
                                if (__this.this('pagination-page') !== undefined) {
                                    __this.this('pagination-page', parseInt(__this.this('pagination-page')) - 1);
                                }
                                __this.removeThis('loading');
                                app.__.callable(callback).call(app);
                            };
                    ext.loadOrRequestData.call(this, {
                        elem: __this,
                        content: content,
                        data: data,
                        success: success,
                        error: error,
                        replaceState: replaceState,
                        requestData: Object.keys(requestData).length ? requestData : null
                    });
                    return this;
                },
                /**
                 * Loads all collections in the current page
                 * @param boolean replaceState
                 * @returns ThisApp
                 */
                loadCollections: function (callback, collections, replaceState) {
                    var app = this,
                            chain = collections === null,
                            collections = collections || this.container.find('collection:not([this-loaded])'
                                    + ':not([this-data]):not([this-loading]),'
                                    + '[this-type="collection"]:not([this-loaded])'
                                    + ':not([this-data]):not([this-loading])'),
                            length = collections.length,
                            done = function () {
                                if (chain) {
                                    ext.loadForms.call(this, null, null, replaceState, chain);
                                }
                                else {
                                    app.__.callable(callback).call(app);
                                }
                            }.bind(this);
                    if (!length)
                        done();
                    else
                        collections.each(function () {
                            var __this = this;
                            ext.loadCollection.call(app, this, function () {
                                length--;
                                if (!length) {
                                    done();
                                }
                            }.bind(app), null, replaceState);
                        });
                    return this;
                },
                /**
                 * Loads a single component
                 * @param {_} __this The component placeholder
                 * @param {function} callback To be called when all components have been loaded
                 * @param {_} component The component template
                 * @returns {void}
                 */
                loadComponent: function (__this, callback, component) {
                    __this = this._(__this);
                    var app = this;
                    // component does not exist
                    if (!component || !this._(component).length) {
                        if (__this.this('url')) {
                            var cached = this
                                    .getCached('[this-url="' + __this.this('url') + '"]', 'component');
                            if (cached.length)
                                ext.loadComponent.call(this, __this, callback, cached.children().clone().show());
                            else {
                                ext.fullyFromURL
                                        .call(app, 'component', __this.this('url'),
                                                function (data) {
                                                    ext.loadComponent
                                                            .call(app, __this, callback, app._(data)
                                                                    .clone());
                                                },
                                                function () {
                                                    __this.remove();
                                                    app.__.callable(callback).call(app);
                                                });
                            }
                        }
                        else {
                            component = this.getCached('[this-id="'
                                    + __this.this('component') + '"]', 'component');
                            if (!component.length) {
                                this.__.callable(callback).call(this);
                            }
                            else
                                ext.loadComponent.call(this, __this, callback, component);
                        }
                        return ext;
                    }
                    component = this._(component).clone();
                    if (component.is('component') || component.this('type') === 'component')
                        component.removeThis('url');
                    // load component
                    __this.replaceWith(component.show()).trigger('component.loaded');
                    ext.postLoad.call(this, __this);
                    this.__.callable(callback).call(this);
                },
                /**
                 * Loads all components in the current page
                 * @param function callback To be called when all components have been loaded
                 * @returns ThisApp
                 */
                loadComponents: function (callback, components) {
                    var app = this,
                            components = components || this.container.find('[this-component]'),
                            length = components.length;
                    if (!length) {
                        this.__.callable(callback).call(this);
                    }
                    else {
                        ext.loadComponent.call(app, components.get(0), function () {
                            length--;
                            ext.componentLoaded.call(this, components, callback, length);
                        }.bind(this));
                    }
                    return this;
                },
                /**
                 * Loads the response data into the container
                 * @param mixed container
                 * @param mixed data Object or data. If object, the array of data key must be set with 
                 * setDataKey()
                 * @param string content Template content to use
                 * @param boolean model Indicates whether the data is just model
                 * @param boolean save Indicates whether to save the data to store or not. Default is TRUE
                 * @param {Function} callback What to do after loading the data
                 * @returns ThisApp
                 */
                loadData: function (container, data, content, isModel, save, callback) {
                    container = this._(container);
                    var hidePaginationBtns = function () {
                        // was paginating
                        if (container.hasThis('paginate')) {
                            // next button
                            var selector = '[this-paginate-next="'
                                    + container.this('id')
                                    + '"],[this-paginate-previous="'
                                    + container.this('id') + '"]',
                                    selector2 = '[this-paginate-next=""],[this-paginate-previous=""]';
                            setTimeout(function () {
                                // hide pagination button selector 
                                this.container.find(selector).hide();
                                // hide sibling buttons
                                container.siblings(selector2).hide();
                            }.bind(this));
                            // reset page index to previous
                            container.this('pagination-page', parseInt(container.this('pagination-page')) - 1);
                        }
                    }.bind(this);
                    // trigger invalid.response trigger if no data
                    if (!data) {
                        hidePaginationBtns();
                        container.trigger('invalid.response');
                        this.__.callable(callback).call(this);
                        return;
                    }
                    // default data structure
                    var _data = {
                        data: {},
                        // set expiration timestamp to 24 hours
                        expires: new Date().setMilliseconds(1000 * 3600 * 24)
                    },
                            real_data = getRealData.call(this, data);
                    // get expiration if set and data from dataKey if specified
                    if (this.config.dataKey) {
                        // set data expiration timestamp too.
                        if (!isNaN(data.expires))
                            // expiration is a number. Must be milliseconds
                            _data.expires = new Date().setMilliseconds(1000 * data.expires);
                        else if (this.__.isString(data.expires))
                            // expiration is a string. Must be date
                            _data.expires = new Date(data.expires).getTime();
                        data = real_data;
                    }
                    // trigger empty.response trigger if no data
                    if (!data || !this.__.isObject(data, true) || !Object.keys(data).length) {
                        hidePaginationBtns();
                        container.trigger('empty.response');
                        this.__.callable(callback).call(this);
                        return;
                    }
                    var save_as = container.this('model') || container.this('id'),
                            _callback = function () {
                                container.removeThis('filter').show();
                                if (container.hasThis('static')) {
                                    var id = container.this('id'),
                                            type = getElemType(container);
                                    // replace template with the loaded element
                                    this.replaceCached(type + '[this-id="' + id
                                            + '"],[this-type="' + type + '"][this-id="'
                                            + id + '"]', container.this('loaded', ''));
                                }
                                this.__.callable(callback).apply(this, Array.from(arguments));
                            }.bind(this);
                    // loading a collection
                    if (this.__.isArray(data) || isModel === false) {
                        // check if can continue with rendering
                        var __data = ext.canContinue
                                .call(this, 'collection.render', [data], container.get(0));
                        // rendering canceled
                        if (!__data) {
                            return this;
                        }
                        // rendering continues. Overwrite data with returned value if object 
                        else if (this.__.isObject(__data, true))
                            data = __data;
                        var app = this,
                                // filter for the collection
                                filter = container.this('filter'),
                                // unique id key for models
                                uid = container.this('model-id-key') || this.config.idKey,
                                tab_cont = ext.checkTableContent.call(this, content),
                                level = tab_cont.level,
                                content = tab_cont.container.outerHtml();
                        this.collectionData = Object.keys(this.cacheTargets || data).length;
                        var done = function () {
                            // was paginating
                            if (container.hasThis('paginate')) {
                                // next button
                                var selector = '[this-paginate-next="'
                                        + container.this('id')
                                        + '"]',
                                        selector2 = '[this-paginate-next=""]';
                                // overwrite is on
                                if ((container.hasThis('paginate-overwrite')
                                        && container.this('paginate-overwrite') === 'true')
                                        || (!container.hasThis('paginate-overwrite')
                                                && this.config.pagination
                                                && this.config.pagination.overwrite)
                                        // and current page is the first
                                        && container.this('pagination-page') === 1) {
                                    // hide previous button too
                                    selector += ',[this-paginate-previous="'
                                            + container.this('id') + '"]';
                                    selector2 += ',[this-paginate-previous=""]';
                                }
                                // hide pagination button selector 
                                this.container.find(selector).hide();
                                // hide sibling buttons
                                container.siblings(selector2).hide();
                                // reset page index to previous
                                container.this('pagination-page', parseInt(container.this('pagination-page')) - 1);
                            }
                        }.bind(this);
                        // data is not empty
                        if (this.collectionData) {
                            // inline overwrite command exist
                            if (container.hasThis('paginate-overwrite')) {
                                // empty collection element if true
                                if (container.this('paginate-overwrite') === 'true') {
                                    container.html('');
                                }
                            }
                            // inline command not exist. check config pagination command
                            else if (this.config.pagination && this.config.pagination.overwrite) {
                                container.html('');
                            }
                            // the indices of the all models in collection
                            var indices = [],
                                    doneLoading = function () {
                                        if (!--this.collectionData) {
                                            delete this.collectionData;
                                            this.__.callable(_callback).call(this, container);
                                        }
                                    }.bind(this);
                            // needed for subsequent pagination attempts
                            this.__.forEach(this.cacheTargets || data, function (_index, _model) {
                                var index, model;
                                if (app.cacheTargets) {
                                    index = _model;
                                    model = data[index];
                                }
                                else {
                                    model = _model;
                                    index = ext.getUIDValue.call(app, _model);
                                }
                                var _tmpl = app._(content),
                                        __data = ext.canContinue
                                        .call(app, 'collection.model.render',
                                                [model, container.get(0)],
                                                _tmpl.get(0));
                                // remove model if already exists in collection element
                                container.children('[this-mid="' + index + '"]').remove();
                                // get id from model with uid
                                var id = ext.getUIDValue.call(app, model, uid);
                                // keep index for later cached pagination
                                indices.push(id || index);
                                if (!__data) {
                                    doneLoading();
                                    return;
                                }
                                else if (app.__.isObject(__data))
                                    model = __data;
                                // if saving data is allowed
                                if (save !== false) {
                                    // set model into data to save. use id if available,
                                    // or else index
                                    if (container.hasThis('paginate')) {
                                        model.__page = container.this('pagination-page');
                                    }
                                    _data.data[id || index] = model;
                                }
                                // process content as being in a loop
                                var _content = ext.inLoop.call(app, {
                                    index: index,
                                    model: model
                                }, filter,
                                        _tmpl.outerHtml().replace(/{{_index}}/g, index));
                                // if there's no content, go to the next model
                                if (!_content) {
                                    app.__.callable(callback).call(app);
                                    return;
                                }
                                // process expressions in content
                                _content = app._(ext.processExpressions.call(app,
                                        _content, {
                                            index: index,
                                            model: model
                                        }), model);
                                if (!uid)
                                    uid = app.config.idKey;
                                var uid_parts = uid.split('.').reverse(),
                                        _id = {},
                                        top_uid = uid_parts.pop();
                                // uid must exist in model
                                if (!model[top_uid]) {
                                    $.each(uid_parts, function (i, v) {
                                        if (!i)
                                            _id[v] = id || index;
                                        else
                                            _id[v] = _id;
                                    });
                                    model[top_uid] = _id;
                                }
                                // continue loading
                                ext.doLoad.call(app, container, model, _content,
                                        false, level, doneLoading);
                            });
                            delete this.cacheTargets;
                            var pageIndex = container.this('pagination-page');
                            if (pageIndex !== undefined) {
                                // first page loaded
                                if (pageIndex == 1) {
                                    // hide previous button
                                    this.container.find('[this-paginate-previous="'
                                            + container.this('id') + '"]').hide();
                                    container.siblings('[this-paginate-previous=""]').hide();
                                }
                                // overwrite is one
                                else if ((container.hasThis('paginate-overwrite')
                                        && container.this('paginate-overwrite') === 'true')
                                        || (!container.hasThis('paginate-overwrite')
                                                && this.config.pagination
                                                && this.config.pagination.overwrite)) {
                                    // show previous button
                                    this.container.find('[this-paginate-previous="'
                                            + container.this('id') + '"]').show();
                                    container.siblings('[this-paginate-previous=""]').show();
                                }
                                // show next button
                                this.container.find('[this-paginate-next="'
                                        + container.this('id') + '"]').show();
                                container.siblings('[this-paginate-next=""]').show();
                            }
                            // if saving data is allowed
                            if (save !== false && container.hasThis('paginate')) {
                                // save pagination index
                                _data.pagination = {};
                                _data.pagination[pageIndex] = indices;
                            }
                            // mark pagination done if length of last result is not
                            // equal to the expected limit
                            if ((container.this('paginate') && indices.length != container.this('paginate'))
                                    || (!container.this('paginate') && this.config.pagination
                                            && this.config.pagination.limit && indices.length != this.config.pagination.limit)) {
                                done();
                            }
                        }
                        // data is empty
                        else {
                            done();
                            save = false;
                            delete this.collectionData;
                            this.__.callable(_callback).call(this, container);
                        }
                        if (container.hasThis('paginate')) {
                            this.container.find('[this-paginate-next="'
                                    + container.this('id')
                                    + '"],[this-paginate-previous="'
                                    + container.this('id') + '"]')
                                    .removeAttr('disabled');
                            container.siblings('[this-paginate-next=""],[this-paginate-previous=""]')
                                    .removeAttr('disabled');
                        }
                        // saving is allowed
                        if (save !== false) {
                            ext.store.call(this, save_as).saveMany(_data.data, uid);
                            ext.expirationStore.save(_data.expires, save_as);
                            ext.paginationStore.save(_data.pagination, save_as);
                        }
                    }
                    // loading a model
                    else if (data && isModel) {
                        // check if can continue rendering
                        var __data = ext.canContinue
                                .call(this, 'model.render', [data], container.get(0));
                        // rendering canceled
                        if (!__data) {
                            return this;
                        }
                        // continue rendering. update data with returned value if object
                        else if (this.__.isObject(__data))
                            data = __data;
                        // saving is allowed
                        if (save !== false) {
                            var id = ext.getUIDValue
                                    .call(this, data, container.this('id-key'));
                            ext.store.call(this, save_as).save(data, id);
                        }
                        // add url to model data for parsing
                        data['_url'] = container.this('url');
                        // continue loading
                        ext.doLoad.call(this, container, data, content, true, null, _callback);
                    }
                    // remove filter attribute and show
                    container.removeThis('filter');
                    return this;
                },
                /**
                 * Loads the given form elements with the model
                 * @param array elements
                 * @param object model
                 * @returns ThisApp
                 */
                loadFormElements: function (elements, model) {
                    if (elements.length && model) {
                        var app = this;
                        this.__.forEach(elements, function () {
                            var __this = app._(this),
                                    key = __this.this('is');
                            if (!key)
                                return;
                            var data = ext.getVariableValue.call(app, key, model);
                            if (!data)
                                return;
                            if (!__this.hasThis('autocomplete') && app.__.isObject(data)) {
                                data = ext.getUIDValue.call(app, data);
                            }
                            __this.removeThis('is');
                            if (__this.attr('type') === 'radio' || __this.attr('type') === 'checkbox') {
                                // using attribute so that redumping content 
                                // would still work fine
                                if (__this.attr('value') == data || data == on)
                                    __this.attr('checked', 'checked');
                            }
                            else if (__this.is('select')) {
                                __this.children().each(function () {
                                    var val = app._(this).attr('value') || app._(this).html().trim();
                                    if (val == data)
                                        app._(this).attr('selected', 'selected');
                                    else
                                        app._(this).removeAttr('selected');
                                });
                                // using attribute so that redumping content 
                                // would still work fine
                                __this.find('[value="' + data + '"]').attr('selected', 'selected');
                            }
                            else if (__this.is('textarea')) {
                                __this.html(data);
                            }
                            else if (__this.hasThis('autocomplete')) {
                                var _dropDownList = app.container
                                        .find('list[this-id="' + __this.this('list')
                                                + '"],[this-type="list"][this-id="'
                                                + __this.this('list') + '"]'),
                                        _selectedList = app.container
                                        .find('list[this-id="'
                                                + _dropDownList.this('selection-list')
                                                + '"],[this-type="list"][this-id="'
                                                + _dropDownList.this('selection-list')
                                                + '"]');
                                var gotData = function (data) {
                                    var ids = [];
                                    if (data) {
                                        // data isn't an object
                                        if (!app.__.isObject(data, true)) {
                                            if (__this.this('value-key')) {
                                                // set data as value
                                                __this.val(data);
                                                return;
                                            }
                                            // data must be a string and therefore the uid
                                            // create an object with the uid => the data
                                            var id = data;
                                            data = {};
                                            data[app.config.idKey || 'id'] = id;
                                        }
                                        if (!__this.hasThis('multiple')) {
                                            // ensure data is an array
                                            if (app.__.isObject(data)) {
                                                data = [data];
                                            }
                                            __this.hide();
                                        }
                                        ids = ext.fillAutocompleteList.call(this, {
                                            list: _selectedList.html(''),
                                            data: data
                                        });
                                    }
                                    _dropDownList.this('selected', ids.join(',') + ',');
                                }.bind(app);
                                // refill list from provided function
                                if (_selectedList.this('refill')) {
                                    return app.__.callable(_selectedList.this('refill'))
                                            .call(this, data, gotData);
                                }
                                // refill list from
                                else if (_selectedList.this('refill-url')) {
                                    return app.request({
                                        dataType: 'json',
                                        type: 'POST',
                                        url: _selectedList.this('refill-url'),
                                        data: {ids: data},
                                        success: function (data) {
                                            gotData(getRealData.call(app, data));
                                        }
                                    });
                                }
                                gotData(data);
                            }
                            else {
                                // using attribute so that redumping content 
                                // would still work fine
                                __this.attr('value', data || '');
                            }
                        });
                    }
                    return this;
                },
                /**
                 * Loads all forms
                 * @param {_} forms Required if to load specific forms
                 * @param {Object} model Data to load into the forms
                 * @returns {ThisApp}
                 */
                loadForms: function (forms, model, replaceState, chain) {
                    var app = this, isPage = false;
                    // load all forms in container or page
                    if (!forms) {
                        isPage = this.page.is('form');
                        forms = isPage ? this.page : this.container.find('form');
                    }
                    forms.each(function () {
                        var __this = app._(this);
                        if (__this.is('form')) {
                            // pass form action type from page to form if not exist on form                 
                            if (!__this.hasThis('do') && app.page.this('do'))
                                __this.this('do', app.page.this('do'));
                            // is search form. no need loading except for search field
                            if ((__this.this('do') === 'search' ||
                                    app.page.this('do') === 'search') &&
                                    app.page.this('query')) {
                                __this.find('[this-search]').attr('value', app.page.this('query'));
                                return;
                            }
                            // parse tar
                            ext.doTar.call(app, __this, true);
                        }
                        var mid = __this.this('mid') || app.page.this('mid'),
                                model_name = __this.this('model') || app.page.this('model');
                        if (!mid)
                            return;
                        if (!model)
                            model = ext.modelFromStore.call(app, mid, model_name);
                        ext.loadFormElements.call(app, __this.find('[this-is]'), model);
                        if (__this.is('form'))
                            __this.this('loaded', '').trigger('form.loaded');
                    });
                    if (chain)
                        ext.pageLoaded.call(this, replaceState);
                    return this;
                },
                /**
                 * Loads all layouts for the page
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                loadLayouts: function (replaceInState) {
                    var _layout = _(), app = this;
                    if (this.config.layout || this.page.this('layout')) {
                        var layout = this.page.this('layout') || this.config.layout;
                        // get existing layout in container if not asked to reload layouts
                        _layout = this.reloadLayouts ? _layout :
                                this.container.find('layout[this-id="' + layout
                                        + '"],[this-type="layout"][this-id="'
                                        + layout + '"]');
                        // layout does not exist in container
                        if (!_layout.length) {
                            // get layout template
                            _layout = this.getCached('[this-id="' + layout + '"]', 'layout')
                                    .this('loaded', '');
                            // layout doesn't exist
                            if (!_layout.length) {
                                ext.fullyFromURL.call(this, 'layout', layout,
                                        function (_layout) {
                                            _layout.removeThis('url')
                                                    .find('[this-content]').html(app.page);
                                            if (_layout.this('extends'))
                                                ext.extendLayout
                                                        .call(app, _layout, replaceInState);
                                            else {
                                                ext.finalizePageLoad
                                                        .call(app, _layout.clone(), replaceInState);
                                            }

                                        },
                                        function () {
                                            app.error('Layout [' + layout + '] not found!');
                                            ext.finalizePageLoad.call(app, _layout,
                                                    replaceInState);
                                        });
                            }
                            else {
                                if (_layout.this('url')) {
                                    this.request({
                                        url: _layout.this('url'),
                                        success: function (data) {
                                            _layout.removeThis('url')
                                                    .html(data)
                                                    .find('[this-content]')
                                                    .html(app.page);
                                            if (_layout.this('extends'))
                                                ext.extendLayout.call(app, _layout,
                                                        replaceInState);
                                            else {
                                                ext.finalizePageLoad.call(app, _layout,
                                                        replaceInState);
                                            }
                                        },
                                        error: function () {
                                            app.error('Layout [' + layout + '] not found!');
                                            ext.finalizePageLoad.call(app, _layout,
                                                    replaceInState);
                                        },
                                        dataType: 'text'
                                    });
                                }
                                else {
                                    _layout.find('[this-content]').html(app.page);
                                    if (_layout.this('extends'))
                                        ext.extendLayout.call(this, _layout, replaceInState);
                                    else {
                                        ext.finalizePageLoad.call(this, _layout, replaceInState);
                                    }
                                }
                            }
                        }
                        else {
                            if (!this.page.hasThis('loaded'))
                                _layout.find('[this-content]').html(this.page);
                            ext.finalizePageLoad.call(this, _layout, replaceInState);
                        }
                    }
                    else {
                        ext.finalizePageLoad.call(this, _layout, replaceInState);
                    }
                },
                /**
                 * Loads a model on the current page
                 * @param {HTMLElement}|{_} target
                 * @param {Function} callback
                 * @param boolean binding Indicates whether to currently binding model to a collection
                 * @param boolean replaceState Indicates whether to overwrite current state
                 *  after loading model
                 * @returns void
                 */
                loadModel: function (target, callback, data, replaceState) {
                    var __this = this._(target),
                            app = this,
                            type = getElemType(__this),
                            common_selector = '';
                    __this.this('loading', '')
                            .find('collection,[this-type="collection"]')
                            .this('loading', '');
                    if (__this.this('id'))
                        common_selector += '[this-id="' + __this.this('id') + '"]';
                    else if (__this.this('model'))
                        common_selector += '[this-model="' + __this.this('model') + '"]';
                    __this = ext.doTar.call(this, __this, true);
                    if (!data && !__this.this('url')) {
                        this.__.callable(callback).call(this);
                        return;
                    }

                    if (type !== 'page') {
                        // necessary in case of binding and target has already been used
                        __this.html(this.getCached(common_selector, type).hide()
                                .html());
                    }
                    function loadedComponents(content) {
                        this.notWiths = ext.hideNotWiths.call(this, __this);
                        if (Object.keys(this.notWiths).length) {
                            content = __this.outerHtml();
                        }
                        var success = function (data, uid, handled) {
                            __this.removeThis('loading');
                            if (handled) {
                                ext.postLoad.call(app, __this);
                                app.__.callable(callback).call(app, data);
                                return;
                            }
                            ext.loadData.call(app, __this, data, content, true,
                                    // only save the data if not loading page
                                    type !== 'page',
                                    function (elem) {
                                        if (elem) {
                                            elem.this('loaded', '')
                                                    .removeThis('loading')
                                                    .trigger('model.loaded')
                                                    .show();
                                        }
                                        ext.postLoad.call(app, elem);
                                        this.__.callable(callback).call(this, data);
                                    }.bind(app));
                        },
                                error = function () {
                                    __this.removeThis('loading');
                                    app.__.callable(callback).call(app);
                                };
                        if (data) {
                            success(data);
                        }
                        else {
                            ext.loadOrRequestData.call(this, {
                                elem: __this,
                                content: content,
                                data: data,
                                success: success,
                                error: error,
                                replaceState: replaceState
                            });
                        }
                    }
                    ext.loadComponents.call(this, function () {
                        loadedComponents.call(app, __this.outerHtml());
                    }, __this.find('[this-component]'));
                    return app;
                },
                /**
                 * Loads all models in the current page
                 * @param boolean replaceState
                 * @returns ThisApp
                 */
                loadModels: function (replaceState, chain) {
                    var app = this;
                    var models = this.page
                            .find('model:not([this-in-collection]),'
                                    + '[this-type="model"]:not([this-in-collection])'),
                            length = models.length;
                    if (chain && !length)
                        ext.loadCollections.call(this, null, null, replaceState);
                    models.each(function () {
                        ext.loadModel.call(app, this,
                                function () {
                                    length--;
                                    if (chain && !length) {
                                        ext.loadCollections.call(this, null, null, replaceState);
                                    }
                                }.bind(app),
                                {}, replaceState);
                    });
                    return this;
                },
                /**
                 * Loads the given data or requests and loads it.
                 * @param {object} config
                 * @returns {void}
                 */
                loadOrRequestData: function (config) {
                    var app = this,
                            isCollection = ext.is.call(this, 'collection', config.elem),
                            type = isCollection ? 'collection' : 'model',
                            ignore = app.page.this('ignore-cache') || '',
                            model_name = config.elem.this('model') || config.elem.this('id'),
                            expires = ext.expirationStore.find(model_name),
                            cache_expired = (expires && expires < Date.now()) || !expires,
                            cache, fromCache;
                    if (this.config.cacheData) {
                        if (!isCollection) {
                            cache = ext.store.call(app, model_name).find(config.elem.this('mid'));
                        }
                        else {
                            cache = ext.store.call(app, model_name).find();
                            // check pagination page data exists in cached data for collection
                            if (config.elem.hasThis('paginate') &&
                                    // cached data exists and no pagination exists already
                                    cache) {
                                var pagination = ext.paginationStore.find(model_name);
                                if ((!pagination
                                        // or paginaion exists but the page meta doesn't exist yet
                                        || pagination[config.elem.this('pagination-page')] === undefined
                                        // or paginaion exists and page meta exists but limit has changed
                                        || pagination[config.elem.this('pagination-page')].length
                                        !== config.requestData.limit))
                                    cache = null;
                                else
                                    this.cacheTargets = pagination[config.elem.this('pagination-page')];
                            }
                        }
                    }

                    var success = function () {
                        app.__.callable(config.success)
                                .apply(config.elem, Array.from(arguments));
                        config.elem.trigger('load.content.success');
                        config.elem.trigger('load.content.complete');
                    }.bind(this),
                            error = function () {
                                if (!loadDataOrCache(config, true)) {
                                    this.__.callable(config.error)
                                            .apply(config.elem, Array.from(arguments));
                                    config.elem.trigger('load.content.error');
                                    config.elem.trigger('load.content.complete');
                                }
                            }.bind(this),
                            loadDataOrCache = function (config, ignoreError) {
                                // if no data and no explicit ignore-cache on collection config.elem
                                // and cache exists
                                if (!config.data && cache) {
                                    if (config.looping)
                                        this.__proto__[type + 's']--;
                                    config.data = cache;
                                    fromCache = true;
                                }
                                // if data exists/found
                                if (config.data) {
                                    var _data = {};
                                    // use dataKey if available
                                    if (this.config.dataKey) {
                                        _data[this.config.dataKey] = config.data;
                                        config.data = _data;
                                    }
                                    // watch for updates
                                    ext.watch.call(this, config.elem);
                                    // loads the data
                                    ext.loadData.call(this, config.elem, config.data, config.content,
                                            !isCollection, false, function (elem) {
                                                if (elem && fromCache) {
                                                    // trigger expired.cache.loaded event
                                                    if (cache_expired) {
                                                        elem.trigger('expired.' + type + '.cache.loaded');
                                                    }
                                                    // trigger cache.loaded event
                                                    else {
                                                        elem.trigger(type + '.cache.loaded');
                                                    }
                                                    // mark as loaded and trigger event
                                                    elem.removeThis('loading').this('loaded', '');
                                                }
                                                this.__.callable(success).call(this, config.data, null, true);
                                            }.bind(this));
                                    return true;
                                }
                                // Cannot load type. Move on.
                                else if (!ignoreError) {
                                    this.__.callable(config.error).call(this);
                                }
                                return false;
                            }.bind(this);
                    // if no data is provided and collection has url 
                    if (!config.data
                            // and no cache or cache exists but is expired
                            && (!cache || (cache && cache_expired) ||
                                    // or page says ignore cache
                                    app.__.contains(ignore, type + '#'
                                            + config.elem.this('id'))
                                    // or elem itself says ignore cache
                                    || config.elem.hasThis('ignore-cache'))) {
                        var type;
                        try {
                            type = app.config.crud.methods.read;
                        }
                        catch (e) {
                            type = 'get';
                        }

                        return ext.request.call(this, config.elem,
                                function () {
                                    if (!config.elem.hasThis('no-updates') && this.watchCallback)
                                        ext.watch.call(this, config.elem);
                                    config.elem.removeThis('no-updates');
                                    return {
                                        elem: config.elem,
                                        type: type,
                                        id: config.elem.this('mid'),
                                        url: config.elem.this('url'),
                                        isCollection: isCollection,
                                        data: config.requestData,
                                        success: success,
                                        error: error
                                    };
                                },
                                function () {
                                    return {
                                        type: type,
                                        url: config.elem.this('url'),
                                        data: config.requestData,
                                        success: success,
                                        error: error
                                    };
                                },
                                function () {
                                    loadDataOrCache(config);
                                });
                    }
                    loadDataOrCache(config);
                },
                /**
                 * The function called when logging a message
                 * @param {string} method
                 * @param {string}|{array} param
                 * @returns {ThisApp}
                 */
                log: function (method, param) {
                    if (ext.record.call(this, 'debug')) {
                        console[method].apply(null, this.__.isArray(param) ? param : [param]);
                    }
                    return this;
                },
                /**
                 * Loops elem through the given data
                 * @param {type} data
                 * @param {_}|HTLElement elem
                 * @param {string} filter
                 * @param {string} content
                 * @returns {_}
                 */
                loop: function (data, elem, filter, content, model) {
                    if (!data)
                        return;
                    elem = this._(elem);
                    if (!content)
                        content = elem.outerHtml();
                    var child = this._(content).get(0),
                            app = this,
                            level;
                    if (child) {
                        switch (child.tagName.toLowerCase()) {
                            case "td":
                                level = 3;
                                content = this._('<table />').html(content).outerHtml();
                                break;
                            case "tr":
                                level = 2;
                                content = this._('<table />').html(content).outerHtml();
                                break;
                        }
                    }
                    content = '<div>' + this._(content).show().outerHtml() + '</div>';
                    this.__.forEach(data, function (key, value) {
                        var __data = {
                            key: key,
                            value: value
                        },
                                _content = ext.inLoop.call(app, __data, filter, content);
                        if (!_content)
                            return;
                        _content = ext.processExpressions.call(app, _content, __data, model);
                        var _variables = ext.parseBrackets.call(app, '{{', '}}', _content),
                                _content = app._(ext.fillVariables
                                        .call(app, _variables, __data, _content)
                                        .replace(/{{key}}/g, key)),
                                thisLevel = level;
                        while (thisLevel) {
                            _content = _content.children();
                            thisLevel--;
                        }
                        // check for loops within current loop and execute
                        if (app.__.isObject(value, true)) {
                            app.__.forEach(value, function (i, v) {
                                if (!app.__.isObject(v, true))
                                    return;
                                _content.find('[this-repeat-for="value.' + i + '"]')
                                        .each(function () {
                                            var __this = app._(this),
                                                    __filter = __this.this('filter'),
                                                    __content = __this.removeThis('muted')
                                                    .removeThis('this-repeat-for').removeThis('filter')
                                                    .clone().outerHtml()
                                                    .replace(/__obrace__/g, '{{')
                                                    .replace(/__cbrace__/g, '}}')
                                                    .replace(/__obrace2__/g, '({')
                                                    .replace(/__cbrace2__/g, '})');
                                            ext.loop.call(app, v, this, __filter, __content, model);
                                        });
                            });
                        }
                        if (elem.hasThis('prepend'))
                            elem.after(_content.children());
                        else
                            elem.before(_content.children());
                    });
                    elem.remove();
                },
                /**
                 * Fetches a model from a collection store
                 * @param string model_id
                 * @param string collection_id
                 * @returns object|null
                 */
                modelFromStore: function (model_id, model_name) {
                    return this.tryCatch(function () {
                        var model = ext.store.call(this, model_name).find(model_id),
                                expires = ext.expirationStore.find(model_name);
                        return expires && expires < Date.now() ? null : model;
                    });
                },
                /**
                 * Saves a model to a collection store
                 * @param {string} model_name
                 * @param {string}|{int} model_id
                 * @param {object} model
                 * @param {boolean} expireCollection
                 * @returns {object}
                 */
                modelToStore: function (model_name, model_id, model, expireCollection) {
                    return this.tryCatch(function () {
                        var modelStore = ext.store.call(this, model_name);
                        if (expireCollection) {
                            ext.expirationStore.save(Date.now(), model_name);
                            ext.paginationStore.remove(model_name);
                        }
                        return modelStore.save(model, model_id
                                || ext.getUIDValue.call(this, model));
                    });
                },
                /**
                 * Called when the target page is not found a page
                 * @param {string} page Page ID
                 * @returns {ThisApp}
                 */
                notAPage: function (page) {
                    this.error('Page [' + page + '] not found');
                    this.container.trigger('page.not.found', {
                        pageId: page
                    });
                    if (this.__.isString(this.notFound)) {
                        page = this.getCached(ext.selector.call(this, this.notFound
                                .startsWith('page#') ? this.notFound : 'page#' + this.notFound));
                        if (!page.length) {
                            return this.error('Page [' + this.notFound + '] also not found');
                        }
                        ext.pageFound.call(this, page, true);
                        return this;
                    }
                    else {
                        delete this._params;
                        return this.__.callable(this.notFound).call(this, page);
                    }
                },
                /**
                 * Called when the target page is found
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                pageFound: function (page, replaceInState) {
                    if (ext.is.call(this, 'page', page)) {
                        if (!ext.canContinue
                                .call(this, 'page.load', [], page.get(0))) {
                            return this;
                        }
                        if (this.page) {
                            this.oldPage = this.page.this('dead', '')
                                    .trigger('page.leave');
                            if (this.oldPage.this('id') === page.this('id'))
                                replaceInState = true;
                        }
                        this.page = page.clone().show();
                        this.__proto__.modelParams = this._params || [];
                        delete this._params;
                        ext.loadLayouts.call(this, replaceInState);
                    }
                    else {
                        delete this._params;
                        this.error('Load page failed: ' + page.this('id'));
                        page.trigger('page.load.failed');
                    }
                },
                /**
                 * Parses the url hash
                 * @returns {string} Target page ID
                 */
                pageIDFromLink: function (link, prepParams) {
                    if (!this.linkAnalytics)
                        this.linkAnalytics = {};
                    if (!this.linkAnalytics[link])
                        this.linkAnalytics[link] = analyzeLink(link);
                    var analytics = this.linkAnalytics[link],
                            id = analytics.page;
                    this._params = analytics.url ? analytics.url.split('/') : [];
                    if (analytics.model)
                        this._params.unshift(analytics.model);
                    if (prepParams) {
                        var parts = id.split('?');
                        this.params = {};
                        this.pageAction = analytics.action;
                        if (parts.length > 1) {
                            this.params = qStrToObj(parts[1]);
                        }
                        this.GETParams = location.search ? qStrToObj(location.search.substr(1)) : {};
                        return parts[0];
                    }
                    return id;
                },
                /**
                 * Called after the page has been fully loaded
                 * @param {Boolean} replaceState Indicates whether to overwrite current state
                 * @param {Boolean} restored Indicates whether the page was only restored and not 
                 * generated
                 * @returns {ThisApp}
                 */
                pageLoaded: function (replaceState, restored) {
                    if (this.__proto__.modelCollections)
                        // still loading. can't mark as loaded
                        return this;
                    var app = this;
                    // load required if not already loaded js
                    if (this.page.this('load-js')
                            && !loadedPageJS.last[this.page.this('id')]) {
                        var jses = this.page.this('load-js').split(',');
                        // load comma-separated css files
                        this.__.forEach(jses, function (i, js) {
                            ext.loadAsset.call(app, 'js', js, app.page);
                        });
                        loadedPageJS.last[this.page.this('id')] = true;
                    }
                    this.loadedPartial = !this.firstPage;
                    delete this.linkAnalytics;
                    // page was just loaded and not restored from history
                    if (!restored) {
                        this.restored = false;
                        if (this.notWiths) {
                            ext.showNotWiths.call(this, this.page, this.notWiths);
                            delete this.notWiths;
                        }
                        ext.postLoad.call(this, this.container);
                        this.page.find('[this-type="template"]').remove();
                        this.page.trigger('page.loaded');
                        ext.saveState.call(this, replaceState);
                    }
                    // page was restored from history
                    else {
                        this.page.this('restored', '');
                        ext.updatePage.call(this, true);
                        this.restored = true;
                        this.page.trigger('page.loaded');
                    }

                    if (this.firstPage) {
                        if (restored)
                            // watch collections and models on current page
                            this.container.find('collection[this-loaded],[this-type="collection"]'
                                    + '[this-loaded],model[this-loaded],[this-type="model"]'
                                    + '[this-loaded]').each(function () {
                                ext.watch.call(app, this);
                            });
                        // get all previously watched collections and models
                        var watching = ext.recordsStore.find('watching');
                        if (watching) {
                            // watch collections and models not on page
                            this.__.forEach(watching, function (id, obj) {
                                ext.watch.call(app, app._('<div this-id="' + id
                                        + '" this-type="' + obj.type + '" this-url="'
                                        + obj.url + '" this-mid="' + obj.mid + '" />'));
                            });
                        }
                        delete this.firstPage;
                    }
                    ext.recordsStore.save(this.watching, 'watching');
                    this.pageIsLoaded = true;
                    return this;
                },
                /**
                 * Fetches everything between the oBrace and cBrace as an array and trims each
                 * @param {string} oBrace Brace opener e.g. {
                 * @param {string} cBrace Brace closer e.g. }
                 * @param {string} content
                 * @returns {object}
                 */
                parseBrackets: function (oBrace, cBrace, content) {
                    if (!content)
                        return [];
                    return this.__.tryCatch(function () {
                        return content.match(new RegExp(oBrace + '\\s*[^' + cBrace + ']+\\s*'
                                + cBrace, 'gi')) || [];
                    });
                },
                /**
                 * Parse the given data into the given content based on the given variables
                 * @param array|object data
                 * @param {_}|HTMLElement container
                 * @param string|int forCollection If parsing data for a collection model, this is the
                 * index (or id) of the model in the collection
                 * @param boolean isModel Indicates whether parsing data for a model or not
                 * @returns ThisApp
                 */
                parseData: function (data, container, forCollection, isModel, callback) {
                    var app = this, custom = false, tab_cont, level;
                    if (this.__.isString(container)) {
                        container = this._('<div/>').html(container);
                        custom = true;
                    }
                    else {
                        container = this._(container);
                        // for processing table and its descendants' templates
                        tab_cont = ext.checkTableContent.call(this, container);
                        container = tab_cont.container;
                        level = tab_cont.level;
                    }
                    // reset resettables
                    container.find('[this-reset]')
                            .each(function () {
                                var __this = app._(this);
                                __this.replaceWith(app.getCached(this));
                            });
                    var prObj = data;
                    if (forCollection) {
                        prObj = {
                            index: forCollection,
                            model: data
                        };
                    }
                    container = ext.inLoop.call(this, prObj, true, container.outerHtml(), true);
                    var _each = container.find('[this-repeat-for]'),
                            current = 0;
                    while (_each.length) {
                        var __this = _each.get(current),
                                each = __this.this('repeat-for').trim(),
                                _data = ext.getVariableValue.call(app, each, data, false),
                                filter = __this.this('filter'),
                                content = __this.removeThis('muted').removeThis('filter')
                                .removeThis('repeat-for').clone().outerHtml()
                                .replace(/__obrace__/g, '{{').replace(/__cbrace__/g, '}}')
                                .replace(/__obrace2__/g, '({').replace(/__cbrace2__/g, '})');
                        __this.html('');
                        // this-repeate-with is not a model key
                        if (!_data) {
                            // do each on a variable value
                            if (each.startsWith('{{')) {
                                // get the value
                                _data = ext.getVariableValue.call(app, each, data, true);
                            }
                            // do each on an expression
                            else {
                                if (each.startsWith('({')) {
                                    each = each.substr(1, each.length - 2);
                                }
                                _data = ext.eval
                                        .call(app, each, data);
                            }
                        }
                        if (app.__.isObject(_data, true)) {
                            ext.loop.call(app, _data, __this, filter, content, data);
                        }
                        _each = container.find('[this-repeat-for]');
                        current++;
                    }
                    content = ext.processExpressions.call(this, container.outerHtml(), prObj, data);
                    var variables = ext.parseBrackets.call(this, '{{', '}}',
                            this.__.isString(content) ? content : content.outerHtml());
                    content = ext.fillVariables.call(this, variables, data, content);
                    container.replaceWith(content);
                    var done = function () {
                        if (custom)
                            container = container.children();
                        container.find('[this-muted]').removeThis('muted');
                        while (level) {
                            container = container.children();
                            level--;
                        }
                        ext.renderSrc.call(this, container);
                        this.__.callable(callback).call(this, container);
                    }.bind(this);
                    if (isModel) {
                        var collections = container.find('collection:not([this-loaded]),'
                                + '[this-type="collection"]:not([this-loaded])');
                        if (collections.length) {
                            this.__proto__.modelCollections = collections.length;
                            collections.each(function () {
                                var __this = app._(this);
                                data = ext.getVariableValue.call(app,
                                        __this.this('data'), data, true);
                                ext.loadCollection.call(app, __this, function () {
                                    __this.removeThis('loading').this('loaded', '');
                                    if (!--this.__proto__.modelCollections) {
                                        delete this.__proto__.modelCollections;
                                        done();
                                    }
                                }, data);
                            });
                            return;
                        }
                    }
                    done();
                    return this;
                },
                /**
                 * Called after any element is loaded for post load operations
                 * @param {_} elem
                 */
                postLoad: function (elem) {
                    elem = this._(elem);
                    var app = this;
                    ext.renderSrc.call(this, elem);
                    elem.find('[this-inline-code]').each(function () {
                        var __this = app._(this);
                        __this.replaceWith(app._('<code this-code />').html(__this.html()));
                    });
                    elem.find('[this-block-code]').each(function () {
                        var __this = app._(this);
                        __this.replaceWith(app._('<pre />').html(__this.html()))
                                .innerWrap('<code this-code />');
                    });
                    elem.find('[this-code]').each(function () {
                        var __this = app._(this),
                                tags = ext.parseBrackets.call(app, '<', '>', __this.html()),
                                content = __this.html();
                        app.__.forEach(tags, function (i, v) {
                            content = content
                                    .replace(v, '&lt;' + v.substr(1, v.length - 2) + '&gt;');
                        });
                        content = content.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
                        __this.html(content).removeThis('code');
                    });
                    elem.find('[this-hidden]').hide()
                            .removeThis('hidden');
                },
                /**
                 * Processes all expressions in the content
                 * @param {string} content
                 * @param {object} current Object available to expressions
                 * @returns {mixed}
                 */
                processExpressions: function (content, current, model, removeUnresolved) {
                    var app = this,
                            exps = ext.getExpressions.call(this, content);
                    this.__.forEach(exps, function (i, v) {
                        app.tryCatch(function () {
                            content = content.replace(v, eval(v.trim().substr(2, v.trim().length - 4)));
                        }, function (e) {
                            ext.log.call(app, 'error', e.message);
                            if (removeUnresolved)
                                content = content.replace(v, '');
                        });
                    });
                    return content;
                },
                /**
                 * Processes the link to load the next page
                 */
                processLink: function (link) {
                    var analytics = analyzeLink(link),
                            target_page = analytics.page,
                            params = analytics.url ? analytics.url.split('/') : null;
                    if (analytics.model) {
                        // keep attributes for page
                        this.tar['page#' + target_page] = {
                            model: analytics.model,
                            url: analytics.url
                        };
                        if (analytics.url) {
                            this.tar['page#' + target_page]['url'] = analytics.url;
                            this.tar['page#' + target_page]['mid'] = params[params.length - 1];
                        }
                        if (analytics.action === 'read') {
                            this.tar['page#' + target_page]['reading'] = '';
                        }
                        else {
                            this.tar['page#' + target_page]['do'] = analytics.action;
                        }
                    }
                    return target_page;
                },
                /**
                 * Fetch current app records
                 * @param {string} key
                 * @praram mixed value
                 * @returns mixed
                 */
                record: function (key, value) {
                    // set a record
                    if (key && value !== undefined && this.container) {
                        ext.records[this.container.this('id')][key] = value;
                        return this;
                    }
                    var records = this.container ? ext.records[this.container.this('id')] : null;
                    return records && key ? records[key] : records;
                },
                /**
                 * Escapes a regex string
                 * @param {string} str
                 * @returns {string}
                 */
                regEsc: function (str) {
                    return str.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, "\\$&");
                },
                /**
                 * Removes comments from the content
                 * @param {string} content
                 * @returns {string}
                 */
                removeComments: function (content) {
                    var exps = ext.getComments.call(this, content);
                    this.__.forEach(exps, function (i, v) {
                        content = content.replace(v, '');
                    });
                    return content;
                },
                /**
                 * Turns this-src to src on images
                 * @param {_} container
                 */
                renderSrc: function (container) {
                    var app = this;
                    this._(container).find('img[this-src]').each(function () {
                        var __this = app._(this);
                        if (__this.attr('this-src').indexOf('{{') !== -1)
                            return;
                        __this.attr('src', __this.attr('this-src'))
                                .removeAttr('this-src');
                    });
                },
                /**
                 * Decides which transporter to run
                 * @param {_}|{HTMLElement} Element on which the request is being
                 * made
                 * @param {function} custom Function to get the config for the
                 * custom transporter
                 * @param {function} def Function to get the config for the default
                 * tranporter
                 * @param {function} neither Function to run when neither the 
                 * custom nor the default can be run
                 */
                request: function (elem, custom, def, neither) {
                    elem = this._(elem);
                    // Data transport exists
                    if (!elem.hasThis('default-transport') && this.dataTransport) {
                        return this.__.callable(this.dataTransport)
                                .call(this, this.__.callable(custom).call(this));
                    }
                    else {
                        // get default request config
                        var config = this.__.callable(def).call(this);
                        // url exists
                        if (config.url) {
                            // load request
                            this.request(config);
                        }
                        // url does not exist:
                        else {
                            // run neither function
                            return this.__.callable(neither).call(this);
                        }
                    }

                },
                /**
                 * Resets a form wisely without removing values from buttons
                 * and hidden input elements
                 */
                resetForm: function (form) {
                    var app = this;
                    this._(form)
                            .find('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"])'
                                    + ',textarea,select,[this-resettable]')
                            .each(function () {
                                var __this = app._(this);
                                if (__this.this('resettable')) {
                                    styleToObj(__this.this('resettable'), function (key, val) {
                                        __this.attr(key, val);
                                    });
                                }
                                if (this.type === 'radio' || this.type === 'checkbox') {
                                    app._(this).prop('checked', false)
                                            .removeAttr('checked');
                                }
                                this.value = '';
                                if (this.tagName.toLowerCase() === 'select') {
                                    app._(this).children(':nth-child(1)')
                                            .prop('selected', true)
                                            .attr('selected', 'selected')
                                            .siblings('[selected="selected"]').
                                            prop('selected', false)
                                            .removeAttr('selected');
                                }
                            });
                    return this;
                },
                /**
                 * Restores a saved state
                 * @param object state
                 * @returns ThisApp
                 */
                restoreState: function (state) {
                    var app = this;
                    this.container.html(state.content);
                    this.page = this.container.find('page[this-id="' + state.id
                            + '"],[this-type="page"][this-id="'
                            + state.id + '"]').removeThis('dead');
                    if (this.config.titleContainer)
                        this.config.titleContainer.html(state.title);
                    ext.recordsStore.save(state.url, 'last_page');
                    this.removedAssets = {};
                    this.container.find('[this-type="layout"]')
                            .each(function () {
                                ext.loadAssets.call(app, app._(this));
                            });
                    delete this.pageModel;
                    // page is bound to a model
                    if (this.page.this('mid')) {
                        // save page model for later use in the app
                        this.collection(this.page.this('model'))
                                .then(function (collection) {
                                    return  collection.model(this.page.this('mid'));
                                }.bind(this))
                                .then(function (model) {
                                    this.pageModel = model;
                                }.bind(this));
                    }
                    ext.loadAssets.call(this, this.page, function () {
                        ext.pageLoaded.call(this, null, true);
                    }.bind(this));
                },
                /**
                 * Saves the app state
                 * @param boolean replace Indicates whether to replace the current state
                 * @returns ThisApp
                 */
                saveState: function (replace) {
                    var action = 'pushState';
                    if (replace || this.firstPage)
                        action = 'replaceState';
                    var url = '#/' + this.page.this('id');
                    if (this.config.keepParamsInURL && Object.keys(this.params).length)
                        url += '?' + objToQStr(this.params);
                    if (this.__proto__.modelParams && this.__proto__.modelParams.length)
                        url += '/' + crudConnectors[this.pageAction] + '/' + this.__proto__.modelParams.join('/');
                    history[action]({
                        id: this.page.this('id'),
                        title: this.page.this('title'),
                        content: this.container.html(),
                        url: url
                    }, this.page.this('title'), url);
                    ext.recordsStore.save(url, 'last_page');
                    return this;
                },
                /**
                 * Provide function to ensure api requests are secured by providing either
                 * headers or request body data, or both.
                 * @param {Function} func The function to be called when making api
                 * requests. The function would receive 3 parameters: (string) key, 
                 * (object) header, (object) body
                 * @returns {ThisApp}
                 */
                secureAPI: function (func) {
                    if (ext.isRunning.call(this))
                        return;
                    this.secap = func;
                    return this;
                },
                /**
                 * Fetches the selector for a ThisApp type
                 * @param string id May contain dot (.) in the format type.id
                 * @param string append
                 * @returns string
                 */
                selector: function (id, append) {
                    id = id.split('#');
                    if (!append)
                        append = '';
                    var attrs = id[id.length - 1].split('[');
                    id[id.length - 1] = attrs[0];
                    this.__.removeArrayIndex(attrs, 0);
                    if (attrs.length)
                        append += '[' + attrs.join('[');
                    return id.length > 1 ? '[this-type="' + id[0] + '"][this-id="' + id[1] + '"]' + append + ',' + id[0] + '[this-id="' + id[1] + '"]' + append : '[this-id="' + id[0] + '"]' + append;
                },
                /**
                 * Setups the app events
                 * @returns ThisApp
                 */
                setup: function () {
                    this.tryCatch(function () {
                        var app = this;
                        // save page state before leaving
                        this.when('page.leave', 'page', function () {
                            ext.saveState.call(app, true);
                        });
                        // save page state before leaving
                        this._(window).on('beforeunload', function () {
                            ext.saveState.call(app, true);
                        });
                        // ensure paths end with /
                        if (this.config.paths) {
                            this.__.forEach(this.config.paths, function (i, v) {
                                if (app.__.isString(v) && !v.endsWith('/'))
                                    app.config.paths[i] += '/';
                                else if (app.__.isObject(v))
                                    if (v.dir && !v.dir.endsWith('/'))
                                        app.config.paths[i].dir += '/';
                            });
                        }
                        // create default function to call when a page isn't found
                        if (!this.notFound)
                            this.notFound = function () {
                                if (app.firstPage) {
                                    var last_page = ext.recordsStore.find('last_page');
                                    if (last_page) {
                                        ext.recordsStore.remove('last_page');
                                        app.loadPage(last_page);
                                    }
                                    else if (app.config.startWith) {
                                        if (this.getCached('[this-id="'
                                                + app.config.startWith
                                                + '"]', 'page').length)
                                            app.loadPage(app.config.startWith);
                                    }
                                    else {
                                        var startWith = app._('[this-default-page]');
                                        if (startWith.length)
                                            app.loadPage(startWith.this('id'));
                                    }
                                }
                            };
                        // look for the app container
                        this.container = this.config.container ?
                                this._('[this-id="' + this.config.container + '"]') :
                                this._('[this-app-container]');
                        // use the body tag if no container is set
                        if (!this.container.length || this.container.is('body')) {
                            // always use an app container and not the body
                            this._('body').append('<div this-app-container />');
                            this.container = this._('[this-app-container]');
                        }
                        else if (!this.container.this('id'))
                            this.container.this('id', __.randomString());
                        // remove comments
                        var content = ext.removeComments.call(this, this.container.html());
                        this.container.html(content);
                        // setup record for this app
                        ext.records[this.container.this('id')] = {
                            running: true,
                            secureAPI: this.secap || function () {},
                            uploader: this.setup || null
                        };
                        delete this.secap;
                        delete this.setup;
                        // set debug mode
                        ext.record.call(this, 'debug', this.config.debug || false);
                        // get necessary stores up
                        ext.recordsStore = ext.store.call(this, '___records');
                        ext.createdStore = ext.store.call(this, '___created');
                        ext.updatedStore = ext.store.call(this, '___updated');
                        ext.deletedStore = ext.store.call(this, '___deleted');
                        ext.expirationStore = ext.store.call(this, '___expiration');
                        ext.paginationStore = ext.store.call(this, '___pagination');
                        // mark layouts in container as loaded
                        this.container.find('layout,[this-type="layout"]')
                                .this('loaded', '');
                        // create templates container if not exists
                        if (!this._('[this-type="templates"][this-app="' +
                                this.container.this('id') + '"]').length)
                            this._('body').append('<div this-type="templates" this-app="' +
                                    this.container.this('id') + '" style="display:none"/>');
                        this.templates = this._('[this-type="templates"][this-app="' +
                                this.container.this('id') + '"]')
                                // put all unloaded element into appropriat template section
                                .html(
                                        // hide all types not loaded (pages, models, collections, layouts,
                                        // components, etc)
                                        this.container.find('page:not([this-loaded]),model:not([this-loaded]),'
                                                + 'collection:not([this-loaded]),layout:not([this-loaded]),list:not([this-loaded]),'
                                                + 'component:not([this-loaded]),'
                                                + '[this-type="page"]:not([this-loaded]),'
                                                + '[this-type="model"]:not([this-loaded]),'
                                                + '[this-type="collection"]:not([this-loaded]),'
                                                + '[this-type="layout"]:not([this-loaded]),'
                                                + '[this-type="list"]:not([this-loaded]),'
                                                + '[this-type="component"]:not([this-loaded])'
                                                + '[this-paginate-next],[this-paginate-previous]')
                                        .hide());
                        this.addToCache(this.container.find('page,[this-type="page"],layout,[this-type="layout"]'));
                        // remove templates
                        this.container.find('[this-type="template"]').remove();
                        ext.emptyFeatures.call(this, this.container);
                        if (this.config.titleContainer)
                            this.config.titleContainer = this._(this.config.titleContainer,
                                    ext.record.call(this, 'debug'));
                        var autocomplete_timeout;
                        this.container
                                .on('click', '[href="#"]', function (e) {
                                    e.preventDefault();
                                })
                                /* reload current page or loaded collection|model */
                                .on('click', '[this-reload],[this-reload-page],[this-reload-layouts]',
                                        function (e) {
                                            e.preventDefault();
                                            var __this = app._(this);
                                            // reload only page
                                            if (__this.hasThis('reload-page')) {
                                                app.reload();
                                                return;
                                            }
                                            // reload page and layouts
                                            else if (__this.hasThis('reload-layouts')) {
                                                app.reload(false, true);
                                                return;
                                            }
                                            // If reload has no value
                                            else if (!__this.this('reload')) {
                                                // reload the page and all resources
                                                app.reload(true);
                                                return;
                                            }
                                            // reload value: collection| 
                                            var reload = __this.this('reload'),
                                                    // template to reload
                                                    toReload = app.getCached(ext.selector
                                                            .call(app, reload)),
                                                    // target to reload
                                                    _reload = app.container.find(ext.selector
                                                            .call(app, reload, '[this-loaded]'));
                                            if (!toReload.length) {
                                                app.error('Reload target not found');
                                                return;
                                            }
                                            if (__this.this('attributes'))
                                                styleToObj(__this.this('attributes'), function () {
                                                    var attrs = Array.from(arguments),
                                                            name = app.__.removeArrayIndex(attrs, 0);
                                                    attrs = attrs.join(':');
                                                    toReload.attr(name, attrs);
                                                });
                                            _reload.replaceWith(toReload.clone());
                                            ext.loadCollection.call(app, _reload, null, null, true);
                                        })
                                /* go to the default page */
                                .on('click', '[this-go-home]', function (e) {
                                    app.home();
                                    e.stop = true;
                                })
                                /* go back event */
                                .on('click', '[this-go-back]', function (e) {
                                    app.back(e);
                                    e.stop = true;
                                })
                                /* go forward event */
                                .on('click', '[this-go-forward]', function (e) {
                                    app.forward(e);
                                    e.stop = true;
                                })
                                /*
                                 * READ event
                                 * 
                                 * Target must have attributes `this-read` and `this-goto`. Attribute 
                                 * `this-read` may have the url of the model as its value.
                                 * Optionally, target should also have attributes `this-model` and `this-mid`.
                                 * The are required if target isn't in a model container.
                                 */
                                .on('click', '[this-goto][this-read]', function (e) {
                                    var __this = app._(this),
                                            _model = __this
                                            .closest('model,[this-type="model"],[this-model][this-binding]'),
                                            model_id = __this.this('model-id') ||
                                            _model.this('mid'),
                                            model_name = __this.this('model') ||
                                            _model.this('model') || _model.this('id'),
                                            url = __this.this('read')
                                            || _model.this('url')
                                            || '#',
                                            goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    // keep attributes for page
                                    app.tar['page#' + pageId] = {
                                        reading: '',
                                        url: url,
                                        model: model_name
                                    };
                                    app.tar['page#' + pageId]['mid'] = model_id;
                                    __this.this('goto', goto + '/#/' + model_name + '/' + url);
                                })
                                /*
                                 * UPDATE event
                                 * 
                                 * Target must have attributes `this-update` and `this-goto`. `this-update`
                                 * may have the url of the model as its value.
                                 * 
                                 * If target isn't in a model container or intends to update another model 
                                 * other than it's container model, it must also have attributes `this-model`
                                 * and `this-mid`.
                                 * If model is a part of a collection, target must also have attribute.
                                 */
                                .on('click', '[this-goto][this-update]', function () {
                                    var __this = app._(this),
                                            model = __this.closest('model,[this-type="model"]'),
                                            model_id = __this.this('model-id') ||
                                            model.this('mid'),
                                            model_name = __this.this('model')
                                            || model.this('id'),
                                            url = __this.this('update')
                                            || model.this('url') || '#',
                                            goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    app.tar['page#' + pageId] = {
                                        "do": "update",
                                        mid: model_id,
                                        action: url,
                                        model: model_name
                                    };
                                    if (__this.this('model-id-key'))
                                        app.tar['page#' + pageId]['model-id-key'] =
                                                __this.this('model-id-key');
                                    else if (model.this('id-key'))
                                        app.tar['page#' + pageId]['model-id-key'] = model
                                                .this('id-key');
                                    __this.this('goto', __this.attr('href'));
                                })
                                /*
                                 * CREATE event
                                 * 
                                 * Target must have attributes `this-goto` and `this-create`. Attributes
                                 * `this-create` must have the url of the collection as its value.
                                 * 
                                 * If CREATION must update model, then attributes 
                                 * `this-model` must be provided unless the target
                                 * form already has the required attributes.
                                 */
                                .on('click', '[this-goto][this-create]', function () {
                                    var __this = app._(this),
                                            url = __this.this('create') || '#';
                                    var goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    app.tar['page#' + pageId] = {
                                        "do": "create",
                                        action: url
                                    };
                                    if (__this.this('model'))
                                        app.tar['page#' + pageId]['model'] = __this
                                                .this('model');
                                    if (__this.this('model-id-key'))
                                        app.tar['page#' + pageId]['model-id-key'] = __this
                                                .this('model-id-key');
                                    __this.this('goto', __this.attr('href'));
                                })
                                /*
                                 * CREATE event
                                 * 
                                 * Target must have attributes `this-form`, which is the id of the 
                                 * target form, and `this-create`, which is the url to submit to.
                                 * 
                                 * If CREATION must update model, then attributes 
                                 * `this-model` must be provided unless the target
                                 * form already has the required attributes.
                                 */
                                .on('click', '[this-create][this-form]', function () {
                                    var __this = app._(this),
                                            selector = 'form[this-id="'
                                            + __this.this('form') + '"]'
                                            ,
                                            _target = app.container.find(selector)
                                            .removeAttr([
                                                "this-binding", "this-mid", "this-id-key",
                                                "this-url"
                                            ]),
                                            _tmpl = app.getCached(selector);
                                    _target.html(_tmpl.html());
                                    ext.bindToObject.call(app, _target, {}, function (elem) {
                                        elem.attr({
                                            "this-do": "create",
                                            "this-action": __this.this('create'),
                                            "this-model": __this.this('model') || '',
                                            "this-model-id-key": __this.this('model-id-key') || '',
                                            "this-binding": ""
                                        }).show();
                                        ext.resetForm.call(this, elem.get(0));
                                        elem.trigger('create.form.cleared');
                                    }.bind(app));
                                })
                                /*
                                 * DELETE event - Show Page
                                 * 
                                 * Target must have attributes `this-goto` and `this-delete`. Attributes
                                 * `this-delete` must have the url of the model as its value.
                                 * 
                                 * If DELETE must update model, then attributes 
                                 * `this-model` may be provided if target isn't
                                 * in a model container or target page doesn't have these attributes.
                                 */
                                .on('click', '[this-goto][this-delete]', function () {
                                    var __this = app._(this),
                                            _model = __this.closest('model,[this-type="model"]'),
                                            url = __this.this('delete')
                                            || _model.this('url') || '#',
                                            model_name = __this.this('model')
                                            || _model.this('id'),
                                            uid = _model.this('id-key'),
                                            goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    app.tar['page#' + pageId] = {
                                        "do": "delete",
                                        action: url,
                                        uid: uid
                                    };
                                    if (_model) {
                                        app.tar['page#' + pageId]['model'] = model_name;
                                        __this.this('goto', goto + '/#/' +
                                                (_model.this('mid') || __this.this('model-id')));
                                    }
                                    __this.this('goto', __this.attr('href'));
                                })
                                /*
                                 * Load page
                                 * 
                                 * Target must have attribute `this-goto`
                                 * 
                                 * Event page.leave is triggered
                                 */
                                .on('click', '[this-goto]:not(form)', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this);
                                    if (!__this.this('goto'))
                                        return;
                                    var goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    if (!app.tar['page#' + pageId])
                                        app.tar['page#' + pageId] = {};
                                    if (__this.this('page-title'))
                                        app.tar['page#' + pageId]['title'] =
                                                __this.this('page-title');
                                    if (__this.this('ignore-cache'))
                                        app.tar['page#' + pageId]['ignore-cache'] =
                                                __this.this('ignore-cache');
                                    ext.processLink.call(app, __this.this('goto'));
                                    app.loadPage(__this.this('goto'));
                                    e.stop = true;
                                })
                                /*
                                 * Click event
                                 * Bind model to target
                                 */
                                .on('click', '[this-bind-to]', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this),
                                            bind = __this.this('bind-to'),
                                            _model = __this.closest('model,'
                                                    + '[this-type="model"],'
                                                    + '[this-model]');
                                    if (!bind || !_model.length)
                                        return;
                                    var _target = app.container.find(ext.selector
                                            .call(app, bind, ':not([this-in-collection])'));
                                    if (!_target.length)
                                        return;
                                    _target.this('model', _model.this('model')
                                            || _model.this('id'))
                                            .this('binding', '')
                                            .this('id-key', _model.this('id-key') || '')
                                            .this('url', _model.this('url') || '')
                                            .removeThis('action');
                                    if (__this.hasThis('read')) {
                                        app.container.find('[this-model="'
                                                + (_model.this('model')
                                                        || _model.this('id'))
                                                + '"][this-binding]').hide();
                                        if (__this.this('read'))
                                            _target.this('url',
                                                    __this.this('read'));
                                        _target.removeThis('do');
                                    }
                                    else if (__this.hasThis('update')) {
                                        _target.this('tar', 'do:update');
                                        if (__this.this('update'))
                                            _target.this('url',
                                                    __this.this('update'));
                                    }
                                    else if (__this.hasThis('delete')) {
                                        _target.this('tar', 'do:delete');
                                        if (__this.this('delete'))
                                            _target.this('url',
                                                    __this.this('delete'));
                                        __this.this('treated', '');
                                        setTimeout(function () {
                                            __this.removeThis('treated');
                                        });
                                    }
                                    ext.bindToElementModel
                                            .call(app, _target, _model, __this.this('bind'));
                                })
                                /*
                                 * DELETE event
                                 * 
                                 * This is where the actual DELETE request is sent.
                                 * 
                                 * Target must have attribute `this-delete` which may contain 
                                 * the url of the model.
                                 * 
                                 * If DELETE must update model and/or collection, then attributes 
                                 * `this-model` must be provided if target isn't
                                 *  within a model or page loaded as a result of a previous 
                                 *  delete click.
                                 */
                                .on('click', '[this-delete]', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this);
                                    if (__this.hasThis('treated'))
                                        return;
                                    var _model = __this.closest('model,[this-type="model"],'
                                            + '[this-model]'),
                                            _do = __this.closest('[this-do="delete"]'),
                                            model_url = __this.this('delete') ||
                                            _model.this('url') ||
                                            _do.this('action'),
                                            model_id = _model.this('mid') ||
                                            _do.this('mid');
                                    if (!ext.canContinue
                                            .call(app, 'model.delete',
                                                    [], _model.get(0))) {
                                        return;
                                    }
                                    app.collection(__this.this('model') ||
                                            _model.this('model') ||
                                            _model.this('id') ||
                                            _do.this('model'), {
                                        uid: _model.this('id-key') ||
                                                _do.this('id-key')
                                    })
                                            // got collection
                                            .then(function (collection) {
                                                return collection.model(model_id, {
                                                    url: model_url
                                                });
                                            })
                                            // got model
                                            .then(function (model) {
                                                return model.remove({
                                                    complete: function () {
                                                        _model.trigger('delete.complete', {
                                                            response: this,
                                                            model: model
                                                        });
                                                    }
                                                });
                                            })
                                            // removed
                                            .then(function (data) {
                                                var crudStatus = app.config.crud.status;
                                                if ((crudStatus &&
                                                        data[crudStatus.key] === crudStatus.successValue)
                                                        || !crudStatus) {
                                                    if (app.page.this('do') === 'delete'
                                                            || _model.this('type') === 'page')
                                                        app.back();
                                                    else {
                                                        app.container.find('[this-model="'
                                                                + (_model.this('model')
                                                                        || _model.this('id'))
                                                                + '"][this-binding]').hide();
                                                    }
                                                    data = getRealData.call(app, data);
                                                    _model.trigger('delete.success', {
                                                        response: this,
                                                        responseData: data,
                                                        model: model
                                                    });
                                                }
                                                else
                                                    _model.trigger('delete.failed', {
                                                        response: this,
                                                        responseData: data,
                                                        model: model
                                                    });
                                            })
                                            // remove failed
                                            .catch(function (data) {
                                                _model.trigger('delete.error', {
                                                    response: this,
                                                    responseData: data,
                                                    model: model
                                                });
                                            });
                                })
                                /*
                                 * Click event
                                 * Toggles target on and off
                                 */
                                .on('click', '[this-toggle]', function (e) {
                                    e.preventDefault();
                                    app.container.find(ext.selector.call(app,
                                            app._(this).this('toggle'))).toggle();
                                })
                                /*
                                 * Hides target elements
                                 */
                                .on('click', '[this-hide]', function (e) {
                                    e.preventDefault();
                                    app.__.forEach(app._(this)
                                            .this('hide').split(','), function (i, v) {
                                        app.container.find('[this-id="' + v.trim() + '"]').hide();
                                    });
                                })
                                /*
                                 * Shows target elements
                                 */
                                .on('click', '[this-show]', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this);
                                    app.__.forEach(__this.this('show').split(','),
                                            function (i, v) {
                                                var _target = app.container
                                                        .find(ext.selector.call(app,
                                                                v.trim()));
                                                if (__this.this('create')) {
                                                    var form = _target.is('form[this-model="'
                                                            + __this.this('model')
                                                            + '"]') ? _target :
                                                            _target.find('form[this-model="'
                                                                    + __this
                                                                    .this('model')
                                                                    + '"]');
                                                    if (form.length) {
                                                        form.this('do', 'create')
                                                                .this('url',
                                                                        __this
                                                                        .this('create'))
                                                                .this('binding', '');
                                                        if (__this.this('model-id-key'))
                                                            form.this('model-id-key',
                                                                    __this
                                                                    .this('model-id-key'));
                                                        form.removeThis('mid');
                                                        ext.resetForm.call(app, form.get(0));
                                                    }
                                                }
                                                _target.show();
                                            });
                                })
                                /**
                                 * Autocomplete
                                 */
                                .on('keyup', '[this-autocomplete][this-list]', function (e) {
                                    var __this = app._(this),
                                            val = __this.val().trim(),
                                            min_chars = __this.this('min-chars') || 3,
                                            url = __this.this('autocomplete')
                                            || __this.this('url'),
                                            _list = app.container
                                            .find('[this-type="list"][this-id="'
                                                    + __this.this('list')
                                                    + '"],list[this-id="'
                                                    + __this.this('list')
                                                    + '"]');
                                    // list element must exist
                                    if (!_list.length) {
                                        app.error('List #' + __this.this('list')
                                                + ' not found');
                                        return;
                                    }

                                    // do nothing if chars are less than required
                                    if (val.length < min_chars) {
                                        var _list = app.container
                                                .find('[this-type="list"][this-id="'
                                                        + __this.this('list')
                                                        + '"],list[this-id="'
                                                        + __this.this('list')
                                                        + '"]');
                                        _list.hide();
                                        if (_list.children().length)
                                            _list.html('').trigger('list.emptied');
                                        __this.removeThis('last-query');
                                        ext.recordsStore.remove('autocompleting');
                                        clearTimeout(autocomplete_timeout);
                                        return;
                                    }
                                    // block searching for same thing multiple times
                                    else if (val === __this.this('last-query')) {
                                        // enter button pressed
                                        if (e.keyCode === 13 && _list.children().length) {
                                            // select the first result from the dropdown list
                                            _list.children(':first-child').trigger('click');
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                        return;
                                    }
                                    clearTimeout(autocomplete_timeout);
                                    autocomplete_timeout = setTimeout(function () {
                                        __this.this('last-query', val);
                                        var type;
                                        try {
                                            type = app.config.crud.methods.read;
                                        }
                                        catch (e) {
                                            type = 'get';
                                        }
                                        var success = function (data) {
                                            data = getRealData.call(app, data);
                                            if (!data)
                                                return;
                                            if (!__this.this('id'))
                                                __this.this('id', app.__.randomString());
                                            _list.this('autocompleting', __this.this('id'))
                                                    .html('').trigger('list.emptied');
                                            ext.fillAutocompleteList
                                                    .call(app, {
                                                        list: _list,
                                                        filter: _list.this('filter'),
                                                        data: data
                                                    });
                                            ext.recordsStore.save(data, 'autocompleting');
                                        },
                                                config = {
                                                    type: type,
                                                    url: url,
                                                    success: success,
                                                    data: {}
                                                };
                                        config.data[__this.this('query-key') || 'q'] = val;
                                        ext.request.call(app, __this,
                                                function () {
                                                    return config;
                                                },
                                                function () {
                                                    return config;
                                                });
                                    },
                                            __this.this('delay') || 300);
                                })
                                .on('click', '[this-autocompleting]>*', function () {
                                    var __this = app._(this),
                                            id = __this.this('id'),
                                            index = __this.this('index'),
                                            _dropDownList = __this.parent(),
                                            _input = app.container
                                            .find('[this-autocomplete][this-id="'
                                                    + _dropDownList
                                                    .this('autocompleting') +
                                                    '"]'),
                                            selectionList = _dropDownList.this('selection-list'),
                                            valueKey = _input.this('value-key'),
                                            // get the saved data from the autcompletion
                                            list = ext.recordsStore.find('autocompleting') || {},
                                            // get the data for the currnt selection
                                            data = list[index] || {};
                                    if (!selectionList) {
                                        if (valueKey) {
                                            // set value of autocomplete as the value of valueKey in data
                                            _input.val(ext.getVariableValue.call(app, valueKey, data));
                                            // selection made: empty the list
                                            _dropDownList.html('').trigger('list.emptied');
                                            // remove autocompletion data
                                            ext.recordsStore.remove('autocompleting');
                                        }
                                        // don't process
                                        return;
                                    }
                                    var selectedListSelector = '[this-type="list"][this-id="'
                                            + selectionList + '"],list[this-id="'
                                            + selectionList + '"]',
                                            _selectedList = app.container
                                            .find(selectedListSelector),
                                            elem = app.getCached(selectedListSelector)
                                            .children();
                                    // empty selected list if nothing had
                                    // been selected
                                    if (!_dropDownList.this('selected')) {
                                        _selectedList.html('');
                                    }
                                    ext.bindToObject
                                            .call(app, elem, data, function (elem) {
                                                elem.this('type', 'listing')
                                                        .this('id', id)
                                                        .show();
                                                _dropDownList.this('selected',
                                                        (_dropDownList.this('selected') || '')
                                                        + id + ',');
                                                _selectedList.append(elem).show();
                                                __this.trigger('list.option.selected', {
                                                    data: data,
                                                    selection: elem.get(0),
                                                    autocompleteInput: _input.get(0)
                                                });
                                                if (!_input.hasThis('multiple')) {
                                                    _input.hide();
                                                    _dropDownList.hide();
                                                }
                                                else {
                                                    __this.remove();
                                                    if (!_dropDownList.children().length)
                                                        _dropDownList.trigger('list.emptied');
                                                }
                                            });
                                })
                                .on('click', 'list [this-remove],'
                                        + '[this-type="list"] [this-remove]',
                                        function () {
                                            var __this = app._(this).closest('[this-type="listing"]'),
                                                    _list = __this.parent(),
                                                    _dropDownList = app.container
                                                    .find('[this-type="list"][this-selection-list="'
                                                            + _list.this('id')
                                                            + '"],list[this-selection-list="'
                                                            + _list.this('id') + '"]');
                                            _dropDownList.this('selected',
                                                    _dropDownList.this('selected')
                                                    .replace(__this.this('id')
                                                            + ',', '')).show();
                                            var _input = app.container
                                                    .find('[this-autocomplete][this-id="'
                                                            + _dropDownList
                                                            .this('autocompleting') +
                                                            '"]').show();
                                            __this.remove();
                                            if (!_list.children().length)
                                                _list.trigger('list.emptied');
                                            if (_input.hasThis('multiple')) {
                                                _input.this('last-query', '')
                                                        .trigger('keyup');
                                            }
                                        })
                                /*
                                 * CREATE and UPDATE events
                                 * Form submission
                                 * 
                                 */
                                .on('submit', 'form[this-do="create"]:not([this-ignore-submit]),'
                                        + ' form[this-do="update"]:not([this-ignore-submit])',
                                        function (e) {
                                            e.preventDefault();
                                            var __this = app._(this),
                                                    creating = __this.this('do')
                                                    === 'create',
                                                    method = __this.this('method')
                                                    || (creating ? 'post' : 'put');
                                            if (!this.reportValidity()) {
                                                __this.trigger('form.invalid.submission');
                                                return;
                                            }
                                            __this.trigger('form.valid.submission');
                                            var id = null, _model;
                                            if (__this.this('mid'))
                                                id = __this.this('mid');
                                            app.collection(__this.this('model') ||
                                                    app.page.this('model'))
                                                    // got collection
                                                    .then(function (collection) {
                                                        return collection.model(id);
                                                    })
                                                    // got model
                                                    .then(function (model) {
                                                        _model = model;
                                                        return model.save({
                                                            form: __this.get(0),
                                                            url: __this.this('url') ||
                                                                    __this.this('action') ||
                                                                    app.page.this('url') ||
                                                                    app.page.this('action'),
                                                            ignoreDOM: __this.hasThis('ignore-dom'),
                                                            method: method,
                                                            complete: function () {
                                                                __this.trigger('form.submission.complete',
                                                                        {
                                                                            response: this,
                                                                            method: method.toUpperCase(),
                                                                            create: creating,
                                                                            model: _model
                                                                        });
                                                            }
                                                        });
                                                    })
                                                    // saved
                                                    .then(function (data) {
                                                        var model = getRealData.call(app, data),
                                                                crudStatus = app.config.crud.status;
                                                        if (((crudStatus &&
                                                                data[crudStatus.key] ===
                                                                crudStatus.successValue)
                                                                || !crudStatus) && model) {
                                                            if (creating) {
                                                                ext.resetForm.call(app, __this.get(0));
                                                                if (!__this.hasThis('binding') &&
                                                                        !__this.closest('[this-binding]')
                                                                        .length)
                                                                    app.back();
                                                                // hide creation form if binding
                                                                else if (__this.hasThis('binding'))
                                                                    __this.hide();
                                                            }
                                                            __this.trigger('form.submission.success',
                                                                    {
                                                                        responseObject: this,
                                                                        responseData: data,
                                                                        method: method.toUpperCase(),
                                                                        create: creating,
                                                                        model: _model
                                                                    });
                                                        }
                                                        else {
                                                            __this.trigger('form.submission.failed',
                                                                    {
                                                                        response: this,
                                                                        responseData: data,
                                                                        method: method.toUpperCase(),
                                                                        create: creating,
                                                                        model: _model
                                                                    });
                                                        }
                                                    })
                                                    // not saved
                                                    .catch(function (data) {
                                                        __this.trigger('form.submission.error',
                                                                {
                                                                    response: this,
                                                                    responseData: data,
                                                                    method: method.toUpperCase(),
                                                                    create: creating,
                                                                    model: _model
                                                                });
                                                    });
                                        })
                                .on('submit', 'form[this-handle-submit]:not([this-do])', function (e) {
                                    e.preventDefault();
                                    var _form = app._(this);
                                    if (!this.reportValidity()) {
                                        _form.trigger('form.invalid.submission');
                                        return;
                                    }
                                    _form.trigger('form.valid.submission');
                                    var fd = new FormData(this), headers = {};
                                    var data = ext.canContinue
                                            .call(app, 'form.send', [headers], this);
                                    if (!data) {
                                        return;
                                    }
                                    else if (app.__.isObject(data))
                                        fd.fromObject(data);
                                    var success = function (data) {
                                        _form.trigger('form.submission.success', {
                                            response: this,
                                            responseData: data
                                        });
                                        _form.trigger('form.submission.complete', {
                                            response: this
                                        });
                                    },
                                            error = function (data) {
                                                _form.trigger('form.submission.error', {
                                                    response: this,
                                                    responseData: data
                                                });
                                                _form.trigger('form.submission.complete', {
                                                    response: this
                                                });
                                            };
                                    ext.request.call(app, _form,
                                            function () {
                                                return {
                                                    type: _form.attr('method'),
                                                    url: _form.attr('action'),
                                                    data: fd,
                                                    success: success,
                                                    error: error,
                                                    headers: headers,
                                                    form: _form.get(0)
                                                };
                                            },
                                            function () {
                                                if (_form.attr('enctype') === 'application/x-www-form-urlencoded')
                                                    fd = fd.toQueryString();
                                                return {
                                                    url: _form.attr('action'),
                                                    type: _form.attr('method'),
                                                    dataType: _form.this('response-type'),
                                                    data: fd,
                                                    success: success,
                                                    error: error,
                                                    headers: headers
                                                };
                                            });
                                })
                                /*
                                 * Search Event
                                 * Form submissiom 
                                 */
                                .on('submit', 'form[this-do="search"]', function (e) {
                                    e.preventDefault();
                                    var _form = app._(this),
                                            _search = _form.find('[this-search]');
                                    if (!_search.this('search')) {
                                        app.error('Invalid search target');
                                        return;
                                    }
                                    var exp = _search.this('search').split(':'),
                                            selector = 'collection[this-id="' + exp[0]
                                            + '"],[this-type="collection"][this-id="' + exp[0] + '"]',
                                            keys = exp[1],
                                            page = _form.this('type') === 'page' ?
                                            _form : _form.closest('page,[this-type="page"]'),
                                            goto = _form.attr('goto') || page.this('id'),
                                            filter = '', _collection,
                                            /* same page and query. don't duplicate state */
                                            replaceState = app.page.this('id') === goto &&
                                            app.page.this('query') === _search.val().trim();
                                    if (keys)
                                        keys = keys.split(',');
                                    app.__.forEach(keys, function (i, key) {
                                        if (filter)
                                            filter += ' || ';
                                        filter += 'app.__.contains(filters.lcase(model#' + key
                                                + '),filters.lcase("' + _search.val() + '"))';
                                    });
                                    // reload only the collection
                                    if (_form.this('reload')) {
                                        _collection = page.find(ext.selector.call(app,
                                                _form.this('reload')));
                                        _collection.this('filter', filter).this('search',
                                                keys.join(','));
                                        page.this('query', _search.val().trim());
                                        ext.loadCollection.call(app, _collection, null, null, replaceState);
                                    }
                                    // load a page and the collection in it
                                    else {
                                        var _goto = analyzeLink(goto).page,
                                                // necessary in case _goto is a url and not an id
                                                pageId = _goto.replace(/\/\\/g, '-'),
                                                _page = app.getCached('[this-id="'
                                                        + _goto + '"]', 'page'),
                                                _component = _page.find('[this-component="'
                                                        + exp[0] + '"]');
                                        _component.this('filter', 'collection#' + exp[0] + ':'
                                                + filter).this('search', 'collection#'
                                                + exp[0] + ':' + keys.join(','));
                                        app.tar['page#' + pageId] = {
                                            query: _search.val().trim()
                                        };
                                        if (_search.this('ignore-cache'))
                                            app.tar['page#' + pageId]['ignore-cache'] =
                                                    _search.this('ignore-cache');
                                        _collection = _page.find(selector);
                                        _collection.this('filter', filter).this('search',
                                                keys.join(','));
                                        app.loadPage(goto, replaceState);
                                    }
                                })
                                /**
                                 * Load next set of results on a paginated collection
                                 */
                                .on('click', '[this-paginate-next]', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this),
                                            _collection;
                                    // collection not specified. Target sibling collection
                                    if (!__this.this('paginate-next'))
                                        _collection = __this.siblings('collection,[this-type="collection"]');
                                    // collection is specified. get it
                                    else
                                        _collection = app.container.find('collection[this-id="'
                                                + __this.this('paginate-next')
                                                + '"],[this-type="collection"][this-id="'
                                                + __this.this('paginate-next') + '"]');
                                    // collection must have attribute `this-paginate`
                                    if (!_collection.hasThis('paginate'))
                                        return;
                                    __this.attr('disabled', 'disabled');
                                    // load target collection
                                    // page is already set right
                                    app.load(_collection, function () {
                                        updateLinkHrefs.call(this);
                                    }.bind(app));
                                })
                                /**
                                 * Load previous set of results on a paginated collection
                                 */
                                .on('click', '[this-paginate-previous]', function (e) {
                                    e.preventDefault();
                                    var __this = app._(this),
                                            _collection;
                                    // collection not specified. Target sibling collection
                                    if (!__this.this('paginate-previous'))
                                        _collection = __this.siblings('collection,[this-type="collection"]');
                                    // collection is specified. get it
                                    else
                                        _collection = app.container.find('collection[this-id="'
                                                + __this.this('paginate-previous')
                                                + '"],[this-type="collection"][this-id="'
                                                + __this.this('paginate-previous') + '"]');
                                    // if page is 0, can't before to previous anymore
                                    if (_collection.this('pagination-page') == 0
                                            // collection must have attribute `this-paginate`
                                            || !_collection.hasThis('paginate'))
                                        return;
                                    __this.attr('disabled', 'disabled');
                                    // reduce page by 2
                                    _collection.this('pagination-page', parseInt(_collection.this('pagination-page')) - 2);
                                    // load collection
                                    app.load(_collection, function () {
                                        updateLinkHrefs.call(this);
                                    }.bind(app));
                                })
                                .on('click', '[this-clear-page-cache]', function () {
                                    app.clearPageCache(app._(this).this('clear-page-cache') === 'true');
                                });
                        this.when('page.loaded', 'page', function () {
                            if (!app.page.hasThis('restored'))
                                document.scrollingElement.scrollTop = 0;
                            updateLinkHrefs.call(app);
                        })
                                .when('component.loaded', 'component', function () {
                                    var elem = app._(this);
                                    // page is already loaded
                                    if (app.pageIsLoaded) {
                                        // load unloaded bits
                                        elem.find('[this-type]:not([this-loaded])')
                                                .each(function (i, v) {
                                                    this.load(v, function () {
                                                        updateLinkHrefs.call(this);
                                                    }.bind(this));
                                                }.bind(app));
                                    }
                                });
                        /*
                         * State resuscitation
                         */
                        this._(window).on('popstate', function (e) {
                            if (e.state) {
                                if (this.page) {
                                    this.page.trigger('page.leave');
                                }
                                location.replace(e.state.url);
                                ext.pageIDFromLink.call(this, e.state.url, true);
                                this.__proto__.modelParams = this._params;
                                delete this._params;
                                ext.restoreState.call(this, e.state);
                            }
                        }.bind(this));
                        /*
                         * Container events activation
                         */
                        this.__.forEach(this.events, function () {
                            app.container.on(this.event, this.selector, this.callback);
                        });
                        delete this.__proto__.events;
                    });
                    return this;
                },
                /**
                 * Sets the funtion to call when there are files to be upload in a form
                 * @param {Function} func
                 * @returns {ThisApp}
                 */
                setUploader: function (func) {
                    if (ext.isRunning.call(this))
                        return;
                    this.setup = func;
                    return this;
                },
                /**
                 * Shows the target page and hides the current
                 * @param {boolean} replaceInState Indicates whether to replace
                 * the current page in history or create a new layer
                 * @return {void}
                 */
                showPage: function (replaceInState) {
                    var transit = this.__.callable(this.config.transition, true),
                            wait;
                    if (transit)
                        wait = transit.call(null, this.oldPage.removeThis('current'),
                                this.page, this.config.transitionOptions);
                    else if (this.__.isString(this.config.transition)) {
                        if (!Transitions[this.config.transition])
                            this.config.transition = 'switch';
                        this.oldPage = this._(this.oldPage);
                        wait = Transitions[this.config.transition](this.oldPage
                                .removeThis('current'),
                                this.page, this.config.transitionOptions);
                    }
                    setTimeout(function () {
                        if (this.oldPage)
                            this.oldPage.remove();
                        delete this.oldPage;
                    }.bind(this), this.__.isNumber(wait) ? wait : 0);
                    if (this.config.titleContainer)
                        this.config.titleContainer.html(this.page.this('title'));
                    // this ensures that only expressions and variables for the page
                    // are run
                    ext.emptyFeatures.call(this, this.container);
                    var content = ext.inLoop.call(this, {}, true, this.container.html());
                    content = ext.processExpressions.call(this, content, {}, {});
                    content = ext.removeComments.call(this, content);
                    this.container.html(content);
                    this.page = this.container.find('page[this-id="' + this.page.this('id')
                            + '"]:not([this-dead]),[this-type="page"][this-id="'
                            + this.page.this('id') + '"]:not([this-dead])');
                    // load models
                    ext.loadModels.call(this, replaceInState, true);
                },
                /**
                 * Shows all hiden elements that were not to be loaded with the 
                 * given element
                 */
                showNotWiths: function (elem, notWiths) {
                    this.__.forEach(notWiths, function (i, v) {
                        elem.find('[this-with="' + i + '"]')
                                .replaceWith(v);
                    });
                },
                /**
                 * Fetches the storage for the given name
                 * @returns {Store}
                 */
                store: function (name) {
                    return name ? new Store(name) : null;
                },
                /**
                 * Updates a retrieved saved page
                 * @returns ThisApp
                 */
                updatePage: function () {
                    var deleted = ext.deletedStore.find() || {},
                            created = ext.createdStore.find() || {},
                            updated = ext.updatedStore.find() || {},
                            app = this,
                            _collections = this.container.find('collection,'
                                    + '[this-type="collection"]'),
                            _models = this.container.find('model,[this-type="model"]'),
                            touched = {
                                deleted: false,
                                created: false,
                                updated: false,
                                back: false,
                                cancel: false
                            };
                    /* Add created models to collection list */
                    if (_collections.length) {
                        this.__.forEach(created, function (model_name, arr) {
                            var _collection = app.container.find('collection[this-model="'
                                    + model_name
                                    + '"],[this-type="collection"][this-model="'
                                    + model_name + '"]');
                            if (!_collection.length)
                                return;
                            touched.created = true;
                            var __collection = ext.store(model_name),
                                    uid = __collection.uid || '';
                            app.__.forEach(arr, function (i, v) {
                                var tmpl = app.getCached('[this-id="'
                                        + _collection.this('id')
                                        + '"]', 'collection').children(),
                                        action = _collection.this('prepend-new') ?
                                        'prepend' : 'append',
                                        data = __collection.find(v),
                                        __data = ext.canContinue
                                        .call(app, 'collection.model.render',
                                                [data, _collection.get(0)],
                                                tmpl.get(0));
                                if (!__data) {
                                    return;
                                }
                                else if (app.__.isObject(__data))
                                    data = __data;
                                ext.parseData.call(app, data,
                                        tmpl, true, null,
                                        function (tmpl) {
                                            if (!tmpl.this('url'))
                                                tmpl.this('url', _collection.this('url') + v);
                                            ext.loadFormElements.call(this, tmpl.find('[this-is]'), data);
                                            _collection[action](tmpl.this('mid', v)
                                                    .this('id-key', uid)
                                                    .this('type', 'model')
                                                    .this('id', model_name)
                                                    .this('in-collection', '')
                                                    .outerHtml()).show();
                                            this.__.removeArrayIndex(arr, i);
                                        }.bind(app));
                            });
                            if (!created[model_name].length) {
                                ext.createdStore.remove(model_name);
                                if (!app.config.cacheData)
                                    ext.store(model_name).drop();
                            }
                            else
                                ext.createdStore.save(arr, model_name, true);
                        });
                    }
                    if (_models.length) {
                        this.__.forEach(updated, function (model_name, arr) {
                            var _model = app.container.find('model[this-id="' + model_name
                                    + '"],[this-type="model"][this-id="'
                                    + model_name + '"],'
                                    + 'collection[this-model="' + model_name
                                    + '"]>model,'
                                    + '[this-type="collection"][this-model="' + model_name
                                    + '"]>[this-type="model"]'),
                                    in_collection = false;
                            if (!_model.length)
                                return;
                            touched.updated = true;
                            app.__.forEach(arr, function (id, v) {
                                // update page model if part of update models
                                if (app.pageModel && app.pageModel.name === model_name
                                        && app.pageModel.id === id) {
                                    app.pageModel.attributes = app.__.extend(app.pageModel.attributes, v);
                                }
                                _model.filter(function () {
                                    var __model = app._(this);
                                    // render if model id is the updated id
                                    return (__model.this('mid') == id
                                            // and not updated before
                                            && (!__model.hasThis('updated')
                                                    // or updated before
                                                    || (__model.hasThis('updated')
                                                            // but has newer update
                                                            && parseInt(__model.this('updated')) < v.timestamp)));
                                })
                                        .each(function () {
                                            var __model = app._(this),
                                                    _clone;
                                            if (__model.hasThis('in-collection')) {
                                                in_collection = true;
                                                var _collection = __model.parent();
                                                _clone = app.getCached('[this-id="'
                                                        + _collection.this('id')
                                                        + '"]', 'collection').children();
                                            }
                                            else {
                                                _clone = app.getCached('[this-id="'
                                                        + __model.this('id')
                                                        + '"]', 'model');
                                            }

                                            var data = v.data,
                                                    __data = ext.canContinue
                                                    .call(app, in_collection ?
                                                            'collection.model.render'
                                                            : 'model.render',
                                                            in_collection ? [data, _model.parent()] : [data],
                                                            _clone);
                                            if (!__data) {
                                                return;
                                            }
                                            else if (app.__.isObject(__data))
                                                data = __data;
                                            // replace clone model's collections with existing
                                            // model collections
                                            _clone.find('collection,[this-type="collection"]')
                                                    .each(function () {
                                                        var _cl_col = app._(this),
                                                                // loaded collection
                                                                selector = 'collection[this-id="'
                                                                + _cl_col.this('id') + '"],'
                                                                + '[this-type="collection"][this-id="'
                                                                + _cl_col.this('id') + '"]',
                                                                _rl_col = _model.find(selector);
                                                        if (_rl_col.length)
                                                            _cl_col.replaceWith(_rl_col.clone());
                                                        else
                                                            _cl_col.remove();
                                                    });
                                            // put back current model's url
                                            _clone.this('url', __model.this('url'));
                                            ext.parseData.call(app, data,
                                                    _clone, false, true, function (tmpl) {
                                                        delete arr[id];
                                                        ext.loadFormElements.call(app, tmpl.find('[this-is]'), data);
                                                        __model.html(tmpl.html()).show()
                                                                .this('updated', v.timestamp)
                                                                .this('url', tmpl.this('url'));
                                                    });
                                        });
                            });
                            if (!updated[model_name].length) {
                                ext.updatedStore.remove(model_name);
                            }
                            else
                                ext.updatedStore.save(arr, model_name, true);
                        });
                        this.__.forEach(deleted, function (model_name, arr) {
                            app.__.forEach(arr, function (i, mid) {
                                var _model = app.container.find('[this-id="' + model_name
                                        + '"][this-mid="' + mid + '"],'
                                        + '[this-model="' + model_name
                                        + '"][this-mid="' + mid + '"]');
                                if (!_model.length)
                                    return;
                                touched.deleted = true;
                                _model.each(function () {
                                    var __model = app._(this);
                                    if (__model.hasThis('in-collection')) {
                                        __model.remove();
                                    }
                                    else {
                                        __model.hide();
                                        // delete page model read from another 
                                        // page's collection
                                        if (!__model.hasThis('binding')
                                                && app.page.this('reading')
                                                && _models.length === 1) {
                                            touched.back = true;
                                            return false;
                                        }
                                        // deleting binded model
                                        else {
                                            __model.removeThis('url')
                                                    .removeThis('mid');
                                        }
                                    }
                                });
                            });
                            if (!deleted[model_name].length) {
                                ext.deletedStore.remove(model_name);
                            }
                            else
                                ext.deletedStore.save(arr, model_name, true);
                        });
                    }

                    if (touched.created || touched.updated || touched.deleted) {
                        ext.saveState.call(this, true);
                    }
                    if (touched.back)
                        return this.back();
                },
                /**
                 * Watches an element (collection | model) for updates
                 * @param {_} elem
                 * @returns {ThisApp}
                 */
                watch: function (elem) {
                    elem = this._(elem);
                    if (!elem.this('id') || this.watching[elem.this('id')]
                            || !elem.this('url'))
                        return this;
                    var isCollection = ext.is.call(this, 'collection', elem),
                            model_name = elem.this('model') || elem.this('id');
                    this.watching[elem.this('id')] = {
                        type: isCollection ? 'collection' : 'model',
                        url: elem.this('url'),
                        mid: elem.this('mid')
                    };
                    this.__.callable(this.watchCallback)(elem.this('url'),
                            function (resp) {
                                // save model to collection
                                var actionStore = ext[resp.event + 'Store'],
                                        action = actionStore.find(model_name) || [];
                                switch (resp.event) {
                                    case 'created':
                                        ext.modelToStore
                                                .call(this, model_name, resp.id, resp.data);
                                        /* Remove model uid if exists to avoid duplicates */
                                        this.__.removeArrayValue(action, resp.id, true);
                                        action.push(resp.id);
                                        break;
                                    case 'updated':
                                        var data = resp.data, id = resp.id;
                                        // if update model, id is model attribute. Update real model
                                        if (!isCollection && elem.this('mid')) {
                                            var id = ext.getUIDValue
                                                    .call(this, data, elem.this('id-key'));
                                            delete data[id];
                                            var _data = {};
                                            _data[id] = data;
                                            data = _data;
                                            id = elem.this('mid');
                                        }
                                        data = ext.modelToStore
                                                .call(this, model_name, id, data);
                                        if (!action.length)
                                            action = {};
                                        action[id] = {
                                            data: data,
                                            timestamp: Date.now()
                                        };
                                        break;
                                    case 'deleted':
                                        ext.store.call(this, model_name).remove(resp.id);
                                        /* Indicate model as deleted */
                                        this.__.removeArrayValue(action, resp.id, true);
                                        action.push(resp.id);
                                        break;
                                }
                                actionStore(action, model_name);
                                // update current page
                                ext.updatePage.call(this);
                                elem.trigger('dom.updated', {
                                    event: resp.event,
                                    response: resp
                                });
                            }.bind(this));
                    return this;
                }
            },
            /**
             * Variable filters
             */
            Filters = Object.create({
                /**
                 * Helper function to check array or str and call function only on str
                 * @param {string}|{array} str
                 * @param {string} options
                 * @param {function} funcA Try this function
                 * @param {function} funcB Do this if first failed
                 * @returns {string}|{array}
                 */
                __factory: function (str, options, funcA, funcB) {
                    if (__.isArray(str)) {
                        var arr = [], _this = this;
                        __.forEach(str, function (i, v) {
                            arr.push(_this.__factory(v, options, funcA, funcB));
                        });
                        return arr;
                    }
                    else if (__.isString(str)) {
                        options = options ? this.__opts(options) : null;
                        return __.tryCatch(function () {
                            return __.callable(funcA).call(this, str, options);
                        }.bind(this),
                                function () {
                                    return __.callable(funcB).call(this, str, options);
                                }.bind(this));
                    }
                },
                /**
                 * Processes options string to array
                 * @param {string} options Format is a:b;c:d;e:f ...
                 * @returns {Array}
                 */
                __opts: function (options) {
                    // replace escaped semicolons
                    options = options.replace(/\\;/g, '__fsemicolon__')
                            // replace escaped colons
                            .replace(/\\:/g, '__fcolon__')
                            // split by semicolons into parts
                            .split(';');
                    var finalOptions;
                    __.forEach(options, function (i, v) {
                        // parts also have parts: options would be an object
                        if (v.indexOf(':') !== -1) {
                            if (!finalOptions) finalOptions = {};
                            // in case the previous value(s) doesn't have :
                            if (__.isArray(finalOptions)) {
                                var obj = {};
                                // convert to object
                                finalOptions.forEach(function (v, i) {
                                    obj[i] = v;
                                });
                                finalOptions = obj;
                            }
                            var parts = v.split(':');
                            finalOptions[parts[0]
                                    .replace(/__fsemicolon__/g, ';')
                                    .replace(/__fcolon__/g, ':')] = parts[1]
                                    .replace(/__fsemicolon__/g, ';')
                                    .replace(/__colon__/g, ':');
                        }
                        // options would be an array
                        else {
                            if (!finalOptions) finalOptions = [];
                            v = v.replace(/__fsemicolon__/g, ';')
                                    .replace(/__colon__/g, ':');
                            if (__.isArray(finalOptions))
                                finalOptions.push(v);
                            else
                                finalOptions[i] = v;
                        }
                    });
                    return finalOptions;
                },
                /**
                 * Changes camel case to hypen case
                 * @param string|array item
                 * @returns string|array
                 */
                camelToHyphen: function (item) {
                    return this.__factory(item, null, function (item) {
                        var _item = item.replace(/([A-Z])/g, function (i) {
                            return '-' + i.toLowerCase();
                        });
                        return this.lcfirst(_item);
                    });
                },
                /**
                 * Changes camel case to snake case
                 * @param string|array item
                 * @returns string|array
                 */
                camelToSnake: function (item) {
                    return this.__factory(item, null, function (item) {
                        var _item = item.replace(/([A-Z])/g, function (i) {
                            return '_' + i.toLowerCase();
                        });
                        return this.lcfirst(_item);
                    });
                },
                /**
                 * Shortcut to ucwords
                 * @param string|array item
                 * @param string options
                 * @returns string|array
                 */
                capitalize: function (item, options) {
                    return this.ucwords(item, options);
                },
                /**
                 * Filters items out of the object or array
                 * @param object|array obj
                 * @param functionName func
                 * @returns object|array
                 */
                filter: function (obj, funcName) {
                    var func = __.callable(funcName, true);
                    if (func) {
                        if (__.isArray(obj)) {
                            return obj.filter(func);
                        }
                        else {
                            var newObj = {};
                            __.forEach(obj, function (i, v) {
                                if (true === func.call(null, v, i)) {
                                    newObj[i] = v;
                                }
                            });
                            return newObj;
                        }
                    }
                    return obj;
                },
                /**
                 * Joins the array into a string with the given separator
                 * @param {object}|{array} obj
                 * @param {string} separator
                 * @returns {Array}
                 */
                join: function (obj, separator) {
                    if (!__.isArray(obj))
                        return obj;
                    return obj.join(separator);
                },
                /**
                 * Shortcut to lowercase()
                 * @param {string} item
                 * @returns {Array}
                 */
                lcase: function (item) {
                    return this.lowercase(item);
                },
                /**
                 * Changes the item's first letter to lower case
                 * @param string|array item
                 * @returns string|array
                 */
                lcfirst: function (item) {
                    return this.__factory(item, null, function (item) {
                        return item[0].toLowerCase() + item.substr(1);
                    });
                },
                /**
                 * Changes the item to lower case
                 * @param string|array item
                 * @returns string|array
                 */
                lowercase: function (item) {
                    return this.__factory(item, null, function (item) {
                        return item.toLowerCase();
                    });
                },
                /**
                 * Turns new lines into <br />
                 * @param {string} item
                 */
                nl2br: function (item) {
                    return this.__factory(item, null, function (item) {
                        return (item + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
                    });
                },
                /**
                 * Provides a default value to the variable if it is not available
                 * @param mixed item
                 * @param mixed def The default value
                 */
                or: function (item, def) {
                    return item || item === 0 ? item : def;
                },
                /**
                 * Performs a replace operation on the given string
                 * @param {string}|{array} str
                 * @param {string} options search:replacement;search2:replacement2;...
                 * @returns {String}|{array}
                 */
                replace: function (str, options) {
                    return this.__factory(str, options,
                            function (str, options) {
                                str = str.replace(/_/g, '-u-');
                                __.forEach(options, function (search, replace) {
                                    search = search.replace(/_/g, '-u-');
                                    str = str.replace(new RegExp(eval(search), 'g'), replace);
                                });
                                return str.replace(/-u-/g, '_');
                            },
                            function (str, options) {
                                __.forEach(options, function (search, replace) {
                                    str = str.replace(new RegExp(search, 'g'), replace);
                                });
                                return str;
                            });
                },
                /**
                 * Shortcut to lcfirst
                 * @param {string} item
                 * @returns {Array}
                 */
                smallize: function (item) {
                    return this.lcfirst(item);
                },
                /**
                 * Changes snake case to camel case
                 * @param string|array item
                 * @param boolean ucfirst
                 * @returns string|array
                 */
                snakeToCamel: function (item, ucfirst) {
                    return this.__factory(item, null, function (item) {
                        var _item = item.replace(/(\_\w)/g, function (w) {
                            return w[1].toUpperCase();
                        });
                        return ucfirst ? this.ucfirst(_item) : _item;
                    });
                },
                /**
                 * Splits the str into an array by the given separator
                 * @param {string}|{array} str
                 * @param {string} separator
                 * @returns {Array}                  */
                split: function (str, separator) {
                    return this.__factory(str, null, function (str) {
                        return str.split(separator);
                    });
                },
                /**
                 * Trims the given string or array of strings
                 * @param {Array}|{String} str
                 * @returns {Array}|{String}
                 */
                trim: function (str) {
                    return this.__factory(str, null, function (str) {
                        return str.trim();
                    });
                },
                /**
                 * Shortcut to uppercase()
                 * @param {string} item
                 * @returns {Array}
                 */
                ucase: function (item) {
                    return this.__factory(item, null, function (item) {
                        return this.uppercase(item);
                    });
                },
                /**
                 * Changes the item's first letter to upper case
                 * @param string|array item
                 * @returns string|array
                 */
                ucfirst: function (item) {
                    return this.__factory(item, null, function (item) {
                        return item[0].toUpperCase() + item.substr(1);
                    });
                },
                /**
                 * Capitalizes the first letter of each word
                 * @param string|array item
                 * @param string options Only option is - which indicates that first letter after 
                 * hyphens should
                 * be changed to upper case too
                 * @returns string|array
                 */
                ucwords: function (item, options) {
                    return this.__factory(item, null, function (item) {
                        return item.replace(options === '-' ? /[^-'\s]+/g : /[^\s]+/g, function (word) {
                            return word.replace(/^./, function (first) {
                                return first.toUpperCase();
                            });
                        });
                    });
                },
                /**
                 * Changes the item to upper case
                 * @param string|array item
                 * @returns string|array
                 */
                uppercase: function (item) {
                    return this.__factory(item, null, function (item) {
                        return item.toUpperCase();
                    });
                }
            }),
            /**
             * Page transition effects
             * 
             * Effect function would be passed three parameters:
             * 
             * currentPage - current page been navigated away from
             * newPage - new page been navigated to
             * options - POJO of options passed by app developer
             * 
             * The function is expected to return an integer which is the number of seconds to wait
             * before currentPage is removed from the dom
             */
            Transitions = Object.create({
                "switch": function (currentPage, newPage) {
                    newPage.show();
                    return 0;
                }
            }),
            /**
             * Model Object
             * @param {string} id The unique id of the model
             * @param {object} attributes Attributues of the model
             * @param {object} props Model properties like name, app (ThisApp), uid, url,
             * collection (Collection)
             * @returns {Model}
             */
            Model = function (id, attributes, props) {
                var _Model = Object.create({
                    app: props && props.app ? props.app : null,
                    attributes: __.isObject(attributes) ? attributes : {},
                    id: id,
                    collection: props && props.collection ? props.collection : null,
                    method: props && props.method ? props.method : null,
                    name: props && props.name ? props.name : null,
                    uid: props && props.uid ? props.uid : '',
                    url: props && props.url ? props.url : null,
                    /**
                     * Binds the model to the given element
                     * @param {string}|{HTMLElement}|{_} elem
                     * @returns {Promise}
                     */
                    bind: function (elem) {
                        elem = this.app._(elem);
                        if (!elem.length) {
                            this.app.error('Target element not found!');
                            return Promise.reject('Target element not found!');
                        }
                        if (this.id)
                            elem.this('mid', this.id);
                        if (this.uid)
                            elem.this('id-key', this.uid);
                        if (this.url)
                            elem.this('url', this.url);
                        var type = getElemType(elem),
                                _template = this.app
                                .getCached('[this-id="' + elem.this('id') + '"]', type);
                        if (_template.length)
                            elem.html(_template.html());
                        return this.app.promise(function (resolve) {
                            ext.loadModel.call(this.app, elem,
                                    function () {
                                        elem.show();
                                        var attr = {
                                            "this-type": "model",
                                            "this-id-key": this.uid,
                                            "this-mid": this.id,
                                            "this-url": this.url,
                                            "this-model": this.name
                                        };
                                        if (!elem.is('form')) {
                                            elem.attr(attr);
//                                elem.find('form[this-loaded]').remove();
                                            var _elem = elem.find('form');
                                            if (_elem.length)
                                                elem = _elem;
                                        }
                                        if (elem.is('form')) {
                                            delete attr['this-type'];
                                            delete attr['this-id'];
                                            elem.attr(attr);
                                        }
                                        resolve();
                                    }.bind(this),
                                    this.attributes);
                        }.bind(this));
                    },
                    /**
                     * Checks if the given key exists in the model
                     * @param {string} key
                     * @returns boolean
                     */
                    has: function (key) {
                        return this.attributes && this.attributes[key] !== undefined;
                    },
                    /**
                     * Initailizes Model attributes, creating setters and getters for them.
                     * @param {Object} attr
                     * @returns {void}
                     */
                    init: function (attr) {
                        var camelCased = Filters.snakeToCamel(attr, true);
                        this['get' + camelCased] = function (key) {
                            var value = this.attributes[attr];
                            if (this.app.__.isObject(value, true) && key !== undefined) {
                                return value[key];
                            }
                            return value;
                        };
                        this['set' + camelCased] = function (val) {
                            this.attributes[attr] = val;
                            return this;
                        };
                    },
                    /**
                     * Removes the model
                     * @param {Object} config Keys may include cacheOnly (default: FALSE),
                     * url, method (default: DELETE), id, success, error, complete
                     * @returns {Promise}
                     */
                    remove: function (config) {
                        return this.app.promise(function (resolve, reject) {
                            config = this.app.__.extend({}, config);
                            var _this = this;
                            if (!this.app) {
                                console.error('Invalid model object');
                                return reject('Invalid model object');
                            }
                            else if (!this.name) {
                                _this.app.error('Cannot delete an unnamed model.');
                                return reject('Cannot delete an unnamed model.');
                            }
                            else if (!this.id) {
                                _this.app.error('Cannot delete a model without an id.');
                                return reject('Cannot delete a model without an id.');
                            }
                            var done = function () {
                                // model is a part of a page pagination
                                // sanitize!
                                if (this.attributes.__page) {
                                    // get cache
                                    var collection = ext.store.call(this.app, this.name),
                                            pagination = ext.paginationStore.find(this.name);
                                    // pagination exists
                                    if (pagination) {
                                        var page = parseInt(this.attributes.__page),
                                                removed = false,
                                                appended = false,
                                                selector = 'collection[this-model="'
                                                + this.name + '"],[this-type="collection"][this-model="'
                                                + this.name + '"]',
                                                _collection = this.app.container
                                                .find(selector),
                                                cache = this.app.getCached(selector)
                                                .children().this('type', 'model');
                                        // go through all pagination metas
                                        while (pagination[page]) {
                                            if (!removed) {
                                                // remove model id from pagination
                                                this.app.__.removeArrayValue(pagination[page], this.id);
                                                removed = true;
                                            }
                                            else {
                                                // shift first value into last page's pagination meta
                                                if (page > 0) {
                                                    var last = pagination[page].shift();
                                                    if (!appended) {
                                                        var lastData = collection.find(last);
                                                        if (!_collection.children('[this-mid="' + last + '"]').length && lastData) {
                                                            ext.bindToObject.call(this.app, cache, lastData,
                                                                    function (elem) {
                                                                        elem.attr({
                                                                            "this-id": this.name,
                                                                            "this-in-collection": "",
                                                                            "this-type": "model",
                                                                            "this-url": this.url.replace(this.id, last),
                                                                            "this-mid": last,
                                                                            "this-id-key": this.uid
                                                                        }).show();
                                                                        _collection.append(elem);
                                                                    }.bind(this));
                                                            appended = true;
                                                        }
                                                    }
                                                    pagination[page - 1].push(last);
                                                }
                                            }
                                            page++;
                                        }
                                        // delete last pagination meta if empty
                                        if (!pagination[page - 1].length)
                                            delete pagination[page - 1];
                                        // save pagination back to cache
                                        ext.paginationStore.save(pagination, this.name, true);
                                        // collection listing is empty
                                        if (!_collection.children().length) {
                                            // reload collection for current page
                                            this.app.load(_collection.this('pagination-page',
                                                    parseInt(_collection.this('pagination-page')) - 1));
                                        }
                                    }
                                }
                            }.bind(this);
                            if (config.cacheOnly) {
                                ext.store.call(this.app, this.name).remove(this.id);
                                done();
                            }
                            else if (this.url || config.url) {
                                var _success = function (data) {
                                    var crudStatus = _this.app.config.crud.status;
                                    if ((crudStatus &&
                                            data[crudStatus.key] === crudStatus.successValue)
                                            || !crudStatus) {
                                        if (!_this.app.watchCallback) {
                                            ext.store.call(_this.app, _this.name).remove(_this.id);
                                            var deleted = ext.deletedStore.find(_this.name) || [];
                                            /* Indicate model as deleted */
                                            _this.app.__
                                                    .removeArrayValue(deleted, _this.id, true);
                                            deleted.push(_this.id);
                                            ext.deletedStore.save(deleted, _this.name, true);
                                            /* update current page */
                                            ext.updatePage.call(_this.app);
                                            done();
                                        }
                                        if (_this.collection) {
                                            delete _this.collection.models[_this.id];
                                            _this.collection.length--;
                                        }
                                    }
                                    _this.app.__.callable(config.success).call(this, data);
                                    resolve(data);
                                    _this.app.__.callable(config.complete).call(this);
                                },
                                        _error = function (e) {
                                            _this.app.__.callable(config.error).call(this, e);
                                            reject(e);
                                            _this.app.__.callable(config.complete).call(this, e);
                                        };
                                ext.request.call(this.app, null,
                                        function () {
                                            return {
                                                type: config.method || this.app.config.crud.methods.delete,
                                                url: config.url || this.url,
                                                id: config.id || this.id,
                                                action: 'delete',
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this),
                                        function () {
                                            return {
                                                type: config.method || this.app.config.crud.methods.delete,
                                                url: config.url || _this.url,
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this));
                            }
                            else {
                                this.app.error('Cannot remove model from server: No URL supplied.');
                                return reject('Cannot remove model from server: No URL supplied.');
                            }
                        }.bind(this));
                    },
                    /**
                     * Persists the model. If not exists, it is created.
                     * @param {Object} config Keys may include cacheOnly (default: FALSE),
                     * url, data, form, method (default: PUT|POST), success, error, complete
                     * @returns {Promise}
                     */
                    save: function (config) {
                        return this.app.promise(function (resolve, reject) {
                            if (!this.app) {
                                console.error('Invalid model object');
                                return reject('Invalid model object');
                            }
                            else if (!this.name) {
                                _this.app.error('Cannot save an unnamed model.');
                                return reject('Cannot save an unnamed model.');
                            }
                            config = this.app.__.extend({}, config);
                            var data = config.data || {},
                                    _data = ext.canContinue
                                    .call(this.app, this.id ? 'model.update' : 'model.create',
                                            [data], config.form);
                            if (false === _data) {
                                return reject('Canceled by a before event');
                            }
                            else if (this.app.__.isObject(_data)) {
                                data = _data;
                            }
                            // no data
                            if ((!data || (this.app.__.isObject(data) && !Object.keys(data).length))
                                    // and no form
                                    && !config.form) {
                                this.app.error('No data or form to save');
                                this.app.__.callable(config.error).call(this.app);
                                reject('No data or form to save');
                                return this.app.__.callable(config.complete).call(this.app);
                            }

                            var finalizeSave = function (config, data) {
                                var _this = this,
                                        method = this.id
                                        ? this.app.config.crud.methods.update
                                        : this.app.config.crud.methods.create,
                                        formData = new FormData(config.form).fromObject(data);
                                if (this.method)
                                    method = this.method;
                                if (this.id && config.cacheOnly)
                                    /* save model to collection */
                                    ext.modelToStore.call(this.app, this.name, this.id,
                                            formData.toObject());
                                else if (this.url || config.url) {
                                    if (this.app._(config.form).attr('enctype') === 'application/x-www-form-urlencoded')
                                        formData = formData.toQueryString();
                                    else formData = formData.toObject();
                                    var _success = function (data, id) {
                                        if (data) {
                                            var model = getRealData.call(_this.app, data),
                                                    crudStatus = _this.app.config.crud.status;
                                            if (((crudStatus &&
                                                    data[crudStatus.key] === crudStatus.successValue)
                                                    || !crudStatus) && model) {
                                                _this.attributes = model;
                                                id = id || ext.getUIDValue
                                                        .call(_this.app, model, _this.uid);
                                                // Don't cache for update if watching for updates already
                                                if (!_this.app.watchCallback) {
                                                    // save model to collection and set whole data as model
                                                    model = ext.modelToStore
                                                            .call(_this.app, _this.name, id, model,
                                                                    !_this.id && _this.app.container
                                                                    .find('collection[this-model="'
                                                                            + _this.name + '"],[this-type="collection"][this-model="'
                                                                            + _this.name + '"]').hasThis('paginate'));
                                                    if (!config.ignoreDOM) {
                                                        var store_name = _this.id ? 'updatedStore' : 'createdStore',
                                                                actionStore = ext[store_name],
                                                                action = actionStore.find(_this.name);
                                                        // saved existing model for dom update
                                                        if (_this.id) {
                                                            if (!action)
                                                                action = {};
                                                            action[_this.id] = {
                                                                data: model,
                                                                timestamp: Date.now()
                                                            };
                                                        }
                                                        // saved new model for dom update
                                                        else {
                                                            _this.id = id;
                                                            // update the url
                                                            _this.url += _this.id;
                                                            if (!action)
                                                                action = [];
                                                            // Remove model uid if exists to avoid duplicates
                                                            _this.app.__
                                                                    .removeArrayValue(action,
                                                                            _this.id, true);
                                                            action.push(_this.id);
                                                        }
                                                        actionStore.save(action, _this.name);
                                                    }
                                                    // update current page 
                                                    ext.updatePage.call(_this.app);
                                                }
                                                // update model's collection
                                                if (_this.collection) {
                                                    _this.collection.models[id] = model;
                                                    _this.collection.length++;
                                                }
                                            }
                                            _this.app.__.callable(config.success).call(this, data, id);
                                        }
                                        else {
                                            _this.app.__.callable(config.fail).call(this);
                                        }
                                        resolve(data, id);
                                        _this.app.__.callable(config.complete).call(this);
                                    },
                                            _error = function (e) {
                                                _this.app.__.callable(config.error).call(this, e);
                                                reject(e);
                                                _this.app.__.callable(config.complete).call(this, e);
                                            };
                                    ext.request.call(this.app, config.form,
                                            function () {
                                                return {
                                                    url: config.url || this.url,
                                                    id: this.id,
                                                    form: config.form,
                                                    data: formData,
                                                    type: config.method || method,
                                                    success: _success,
                                                    error: _error
                                                };
                                            }.bind(this),
                                            function () {
                                                return {
                                                    type: config.method || method,
                                                    url: config.url || _this.url,
                                                    data: formData,
                                                    success: _success,
                                                    error: _error
                                                };
                                            });
                                }
                                else {
                                    _this.app.error('Cannot save model to server: No URL supplied.');
                                    return reject('Cannot save model to server: No URL supplied.');
                                }
                            };
                            // saving form while there's an uploader for the app
                            if (config.form && ext.record.call(this.app, 'uploader')) {
                                // get files
                                var files = this.app._(config.form).find('input[type="file"]');
                                if (files.length) {
                                    data = data || {};
                                    var _this = this;
                                    // send them to uploader
                                    this.app.__.callable(ext.record.call(this.app, 'uploader'))
                                            .call(config.form, {
                                                modelName: this.name,
                                                files: files.items,
                                                data: this.app.__.extend(data),
                                                id: this.id,
                                                url: this.url,
                                                done: function (_data) {
                                                    if (!_data) {
                                                        this.app.__.callable(config.error).call(this.app);
                                                        return;
                                                    }
                                                    else if (this.app.__.isObject(_data, true)) {
                                                        this.app.__.forEach(_data, function (i, v) {
                                                            data[i] = v;
                                                        });
                                                    }
                                                    finalizeSave.call(this, config, data);
                                                }.bind(this)
                                            });
                                    return this;
                                }
                            }
                            finalizeSave.call(this, config, data);
                        }.bind(this));
                    }
                });
                if (__.isObject(attributes)) {
                    __.forEach(attributes, function (key) {
                        // ignore ext keys
                        if (key.startsWith('__'))
                            return;
                        _Model.init(key);
                    });
                }
                _Model.parent = _Model.__proto__;
                delete _Model.parent.init;
                return _Model;
            },
            /**
             * Collection Object
             * @param {object} models Object of objects with keys as ids
             * @param {object} props Object with keys name (of the model), app (ThisApp), 
             * uid, url and length (the number of models present)
             * @returns {Collection}
             */
            Collection = function (models, props) {
                var _Collection = Object.create({
                    app: props && props.app ? props.app : null,
                    current_index: -1,
                    models: __.isObject(models, true) ? models : {},
                    name: props && props.name ? props.name : null,
                    uid: props && props.uid ? props.uid : '',
                    url: props && props.url ? props.url : null,
                    /**
                     * Adds a model to the collection
                     * @param {Object} config @see Model.save()
                     * @returns {Promise}
                     */
                    add: function (config) {
                        if (!this.name || !this.url) {
                            this.app.error('Collection must have a name and url');
                            return;
                        }
                        else if (!config || !config.data) {
                            this.app.error('Collection.add() must have an object parameter with key data');
                            return;
                        }
                        var model = new Model(null, config.data, {
                            name: this.name,
                            app: this.app,
                            uid: this.uid,
                            url: this.url,
                            collection: this
                        });
                        return model.save(config);
                    },
                    /**
                     * Binds the collection to the given element
                     * @param {string}|{HTMLElement}|{_} elem
                     * @returns {Promise}
                     */
                    bind: function (elem) {
                        if (!this.name) {
                            this.app.error('Collection must have a name');
                            return Promise.reject('Collection must have a name');
                        }
                        elem = this.app._(elem);
                        elem.this('model', this.name);
                        if (this.uid)
                            elem.this('model-id-key', this.uid);
                        if (this.url)
                            elem.this('url', this.url);
                        return this.app.promise(function (resolve) {
                            ext.loadCollection.call(this.app, elem, resolve);
                        }.bind(this));
                    },
                    /**
                     * Clears the collection data from app cache
                     */
                    clearCache: function () {
                        return ext.store.call(this.app, this.name).drop();
                    },
                    /**
                     * Fetches the current model
                     * @returns {Model}
                     */
                    current: function () {
                        return this.get(this.parent.current_index || 0);
                    },
                    /**
                     * Fetches the first model in the collection
                     * @returns {Model}
                     */
                    first: function () {
                        return this.get(0);
                    },
                    /**
                     * Loops through models and applies the callback to each
                     * @param {Function} callback
                     * @returns {_Collection}
                     */
                    each: function (callback) {
                        __.forEach(this.models, function (i, v) {
                            __.callable(callback).call(this, i, v);
                        });
                        return this;
                    },
                    /**
                     * Fetch the model at the index location
                     * @param {integer} index
                     * @returns {Model}
                     */
                    get: function (index) {
                        var key = Object.keys(this.models)[index],
                                model;
                        if (!key)
                            return;
                        this.parent.current_index = index;
                        model = this.models[key];
                        if (model)
                            delete model.__page;
                        return new Model(key, model, {
                            name: this.name,
                            app: this.app,
                            uid: this.uid,
                            url: url,
                            collection: this
                        });
                    },
                    /**
                     * Checks whether there's a model after the current one
                     * @returns {Boolean}
                     */
                    hasNext: function () {
                        var current_index = this.parent.current_index,
                                model = this.next();
                        this.parent.current_index = current_index;
                        return model !== null;
                    },
                    /**
                     * Initializes the collection
                     * @param {object} props An object of key to value to set
                     * as the collection's attribues
                     */
                    init: function (props) {
                        var _this = this;
                        __.forEach(props, function (i, v) {
                            _this[i] = v;
                        });
                        return this;
                    },
                    /**
                     * Fetches the last model in the collection
                     * @returns {Model}
                     */
                    last: function () {
                        return this.get(this.length - 1);
                    },
                    /**
                     * Fetches a model from the collection
                     * @param {integer}|{string} model_id
                     * @param {Object} Keys include url (string), success (function),
                     * error (function), ignoreCache (boolean)
                     * @returns {Promise}
                     */
                    model: function (model_id, options) {
                        var _this = this, url,
                                options = this.app.__.extend({
                                    success: function () {},
                                    error: function (e) {}
                                }, options);
                        if (model_id) {
                            if (options.url) {
                                url = options.url;
                            }
                            else if (this.url) {
                                url = (_this.url.endsWith('/') ?
                                        _this.url : _this.url + '/') + model_id;
                            }
                            var ignoreCache = options.hasOwnProperty('ignoreCache');
                            if (((ignoreCache && !options.ignoreCache)
                                    || (!ignoreCache && !this.app.config.cacheData))
                                    && this.models[model_id]) {
                                var model = this.app.__.extend(this.models[model_id]),
                                        _model = new Model(model_id, model, {
                                            name: _this.name,
                                            app: _this.app,
                                            uid: _this.uid,
                                            url: url,
                                            collection: this
                                        });
                                delete model.__page;
                                this.app.__.callable(options.success).call(this,
                                        _model);
                                return Promise.resolve(_model);
                            }
                            else if (url) {
                                return this.app.promise(function (resolve, reject) {
                                    this.app.request({
                                        url: url,
                                        success: function (data) {
                                            data = getRealData.call(this.app, data);
                                            if (data && this.app.__.isObject(data))
                                                delete data.__page;
                                            var _model = new Model(model_id, data, {
                                                name: _this.name,
                                                app: _this.app,
                                                uid: _this.uid,
                                                url: url,
                                                collection: this
                                            });
                                            this.app.__.callable(options.success).call(this,
                                                    _model);
                                            resolve(_model);
                                        }.bind(this),
                                        error: function (e) {
                                            this.app.__.callable(options.error).call(this, e);
                                            reject(e);
                                        }.bind(this)
                                    });
                                }.bind(this));
                            }
                        }
                        var _model = new Model(null, null, {
                            name: this.name,
                            app: this.app,
                            uid: this.uid,
                            url: url,
                            collection: this
                        });
                        this.app.__.callable(options.success)
                                .call(this.app, _model);
                        return Promise.resolve(_model);
                    },
                    /**
                     * Fetchs the next model
                     * @returns {Model}
                     */
                    next: function () {
                        return this.get(this.parent.current_index + 1);
                    },
                    /**
                     * Removes a model
                     * @param {integer}|{string} model_id
                     * @param {Object} options @see Model.remove()
                     * @returns {Promise}
                     */
                    remove: function (model_id, options) {
                        return this.app.promise(function (resolve, reject) {
                            var _options = this.app.__.extend({}, options),
                                    url;
                            if (options.url) {
                                url = options.url;
                            }
                            else if (this.url) {
                                url = (_this.url.endsWith('/') ?
                                        _this.url : _this.url + '/') + model_id;
                            }
                            _options.url = url;
                            _options.success = function () {
                                delete this.models[model_id];
                                this.length--;
                                resolve();
                                this.app.__.callable(options.success)
                                        .apply(this, Array.from(arguments));
                            }.bind(this);
                            /* remove one */
                            this.model(model_id, {
                                url: url
                            })
                                    .then(function (model) {
                                        model.remove(_options);
                                    }.bind(this))
                                    .catch(reject);
                        }.bind(this));
                    },
                    /**
                     * Remove all models
                     * @return {Promise}
                     */
                    removeAll: function () {
                        if (!this.url || !this.name) {
                            this.app.error('Invalid url and/or model name!');
                            return Promise.reject();
                        }

                        if (config.cacheOnly) {
                            ext.store.call(this.app, this.name).drop();
                            ext.paginationStore.remove(this.name);
                            ext.expirationStore.remove(this.name);
                            this.models = {};
                            this.length = 0;
                            return Promise.resolve();
                        }
                        else {
                            return this.app.promise(function (resolve, reject) {
                                var _this = this,
                                        _success = function (data) {
                                            if (!_this.app.watchCallback)
                                                ext.store.call(_this.name).drop();
                                            _this.models = {};
                                            _this.length = 0;
                                            _this.app.__.callable(config.success).call(_this, data);
                                            resolve(data);
                                            _this.app.__.callable(config.complete).call(_this);
                                        },
                                        _error = function (e) {
                                            _this.app.__.callable(config.error).call(_this, e);
                                            reject(e);
                                            _this.app.__.callable(config.complete).call(_this);
                                        };
                                ext.request.call(this.app, null,
                                        function () {
                                            return {
                                                url: this.url,
                                                type: config.method || this.app.config.crud.methods.delete,
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this),
                                        function () {
                                            return {
                                                url: this.url,
                                                type: config.method || this.app.config.crud.methods.delete,
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this));
                            }.bind(this));
                        }
                    },
                    /**
                     * Rewinds the collection back to the start
                     * @returns {Collection}
                     */
                    rewind: function () {
                        this.parent.current_index = -1;
                        return this;
                    }
                });
                _Collection.length = props && props.length ? props.length : 0;
                if (!_Collection.length && props.app.__.isObject(models, true))
                    _Collection.length = Object.keys(models).length;
                _Collection.parent = _Collection.__proto__;
                return _Collection;
            },
            /**
             * Extends ThisApp
             */
            Extender = function (target) {
                return function () {
                    return {
                        /**
                         * Extends the target with the given property name and value
                         * 
                         * @param {string} name The property name
                         * @param {function} func The property value
                         * @returns {Object}
                         */
                        extend: function (name, value) {
                            if (name && value) {
                                target[name] = value;
                            }
                            return this;
                        },
                        /**
                         * Fetches a list of the available properties
                         * @returns {array}
                         */
                        properties: function () {
                            return {
                                custom: Object.keys(target),
                                initial: Object.keys(target.__proto__)
                            };
                        },
                        /**
                         * Runs a property function
                         * @param {string} name
                         * @param mixed value
                         * @returns mixed
                         */
                        run: function (name, value) {
                            return __.callable(target[name]).call(target, value);
                        }
                    };
                };
            };
    Filters.parent = Filters.__proto__;
    Transitions.parent = Transitions.__proto__;
    _.prototype = __.__proto__;
    ThisApp = function (config) {
        if (!(this instanceof ThisApp))
            return new ThisApp(config);
        this.version = '1.0';
        if (config && __.isObject(config))
            this.config = this.__.extend(this.config, config, true);
    };
    /**
     * Transitions affect how old pages are exited and new pages are entered
     */
    ThisApp.Transitions = Extender(Transitions);
    /**
     * Filters are applied to variables before rendering      */
    ThisApp.Filters = Extender(Filters);
    /**
     * Extends the engine
     * @param {object} obj Object of methods to add to the engine
     * @returns {void}
     */
    ThisApp.extend = function (obj) {
        __.forEach(obj, function (i, v) {
            if (!ThisApp.prototype[i])
                ThisApp.prototype[i] = function () {
                    var args = Array.from(arguments);
                    args.unshift(ext);
                    return __.callable(v).apply(this, args);
                };
            else
                console.error('ThisApp.' + i + ' already exists!');
        });
    };
    ThisApp.prototype = {
        __: __,
        /**
         * Callback to call before events happen
         */
        beforeCallbacks: {},
        /**
         * Number of collections still loading
         */
        collections: 0,
        /**
         * Number of components still loading
         */
        components: 0,
        /**
         * App configuration object
         */
        config: {
            /* 			 * The base url upon which other urls are built
             */
            baseURL: location.origin + location.pathname,
            /*
             * Indicates whether received model data should be cached for offline
             * access
             */
            cacheData: true,
            /*
             * CRUD settings
             */
            crud: {
                /*
                 * Indicates the status info for crud operations
                 */
                status: {
                    key: 'status', // the key that holds the operation status
                    successValue: true // the key value that indicates success
                },
                /*
                 * CRUD methods
                 */
                methods: {
                    create: 'POST',
                    read: 'GET',
                    update: 'PUT',
                    delete: 'DELETE'
                }
            },
            /*
             * The key in each ajax response which holds the actual object or array of objects
             */
            dataKey: 'data',
            /*
             * Indicates whether the app should run in debug mode or not.
             */
            debug: false,
            /*
             * Indicates whether to keep app parameters in the url after processing
             */
            keepParamsInURL: false,
            /* 			 * The default layout for the application
             */
            layout: null,
            /*
             * Default uid for models and collections if not explicitly defined
             */
            idKey: 'id',
            /*
             * Pagination settings
             */
            pagination: {
                // The number of results to fetch when paginating. 
                // FALSE means no limit should be sent. Useful for when the server
                // takes care of its pagination limit
                limit: 20,
                // FALSE means new data would be appended
                overwrite: false
            },
            /*              * Paths to pages, layouts and components
             */
            paths: {
                pages: {
                    dir: './pages',
                    ext: '.html'
                },
                layouts: {
                    dir: './layouts',
                    ext: '.html'
                },
                components: {
                    dir: './components',
                    ext: '.html'
                },
                js: './assets/js',
                css: './assets/css'
            },
            /*
             * ID of the page to start the app with
             */
            startWith: null,
            /*
             * The selector that holds the title of each page
             */
            titleContainer: null,
            /* 			 * The transition effect to use between pages
             */
            transition: 'switch',
            /*
             * The options for the transition effect
             */
            transitionOptions: {}
        },
        /**
         * App events
         */
        events: [],
        /**
         * This holds the GET Request parameters for the current page
         */
        GETParams: {},
        /**
         * Number of models still loading
         */
        models: 0,
        /**
         * Holds the app parameters
         */
        params: {},
        /**
         * Object holding element types whose unrequired assets have been removed for the current page
         */
        removedAssets: {},
        /**
         * Holds values to pass on to target when loaded
         */
        tar: {},
        /**
         * Array of elements being watched for updates
         */
        watching: {},
        /**
         * Captures the object for manipulation
         * @param mixed selector
         * @param boolean debug
         * @returns _          */
        _: function (selector, debug) {
            return _(selector, debug || this.config ? ext.record.call(this, 'debug') : true);
        },
        /**
         * Adds an element to the cache collection for later reuse
         * @param {_}|{HTMLElement} elem
         * @returns {ThisApp}
         */
        addToCache: function (elem) {
            return this.tryCatch(function () {
                var _this = this;
                elem.each(function () {
                    var _elem = _this._(this).clone();
                    if (_elem.this('type') === 'layout')
                        _elem.find('[this-content]').html('');
                    _elem.find('style').each(function () {
                        _this._(this).replaceWith('<div this-type="style">' + this.innerText + '</div>');
                    });
                    _this.templates.append(_elem.outerHtml()
                            .replace(/\{\{/g, '__obrace__')
                            .replace(/\}\}/g, '__cbrace__')
                            .replace(/\(\{/g, '__obrace2__')
                            .replace(/\}\)/g, '__cbrace2__'));
                    return this;
                });
            });
        },
        /**
         * Takes the app back one step in history
         * @returns ThisApp
         */
        back: function (e) {
            return this.tryCatch(function () {
                if (e && this.__.isObject(e) && e['preventDefault'])
                    e.preventDefault();
                if (!this.canGoBack()) {
                    return this.home(true);
                }
                else if (ext.canContinue
                        .call(this, 'page.leave', [], this.page.get(0))) {
                    history.back();
                }
                return this;
            });
        },
        /**
         * Registers a callback to be called before an event happens. If the callback returns false,
         * the event is terminated.
         * @param {string} event
         * @param {function} callback
         * @returns {ThisApp}
         */
        before: function (event, callback) {
            return this.tryCatch(function () {
                this.__.forEach(event.split(','), function (i, v) {
                    if (this.page) {
                        if (!this.beforeCallbacks[this.page.this('id')])
                            this.beforeCallbacks[this.page.this('id')] = {};
                        this.beforeCallbacks[this.page.this('id')][v.trim()] = callback;
                    }
                    else {
                        if (!this.beforeCallbacks['___common'])
                            this.beforeCallbacks['___common'] = {};
                        this.beforeCallbacks['___common'][v.trim()] = callback;
                    }
                }.bind(this));
                return this;
            });
        },
        /**
         * Binds an element to an object
         * @param {_}|{HTMLElement} elem
         * @param {Object} object
         * @param {Funtion} callback
         */
        bindToObject: function (elem, object, callback) {
            return this.promise(function (resolve) {
                ext.bindToObject.call(this, this._(elem), object, function (elem) {
                    ext.postLoad.call(this, elem);
                    resolve.apply(this, Array.from(arguments));
                    this.__.callable(callback).apply(this, Array.from(arguments));
                }.bind(this));
            });
        },
        /**
         * Checks whether the page has a previous page it can go back to
         */
        canGoBack: function () {
            return history.length > 2;
        },
        /**
         * Clears the cache of all models and collections on the current page
         * @param {boolean} reload Indicates that the elements attached to these
         * models and collections should be reloaded
         * @returns {ThisApp}
         */
        clearPageCache: function (reload) {
            var _this = this,
                    did_page = false;
            this.container.find('[this-model],model:not([this-in-collection]),'
                    + '[this-type="model"]:not([this-in-collection])')
                    .each(function () {
                        var __this = _this._(this),
                                name = __this.this('model') || __this.this('id');
                        ext.store.call(this, name).drop();
                        if (__this.this('type') === 'page') {
                            did_page = true;
                            return;
                        }
                        // reload element if page's model collection has
                        // not been cleared. Otherwise, don't. Reloading
                        // page would take care of that.
                        if (reload && !did_page) {
                            _this.load(__this);
                        }
                    });
            // cleared page's model collection: reload page
            if (did_page && reload) {
                return this.reload();
            }
            return this;
        },
        /**
         * Fetches a collection of model
         * @param {string} model_name
         * @param {object} config Keys include url (string), data (object|array),
         * success (function), error (function), idKey (string)
         * @returns {Promise}
         */
        collection: function (model_name, config) {
            return this.tryCatch(function () {
                var col;
                if (!model_name) {
                    col = new Collection([], {app: this});
                    this.__.callable(config.success).call(this, col);
                    return Promise.resolve(col);
                }
                if (!config)
                    config = {};
                var data = config.data;
                if (!data) {
                    data = ext.store.call(this, model_name).find() || [];
                }
                else {
                    // save data
                    ext.store.call(this, model_name).save(data, config.idKey || this.config.idKey);
                }
                // data exists and has at least one entry or
                // data doesn't exist and neither does config.url
                if ((data && this.__.isObject(data, true)
                        && Object.keys(data).length) ||
                        !config.url) {
                    col = new Collection(data, {
                        name: model_name,
                        app: this,
                        uid: config ? config.uid : null,
                        url: config ? config.url : null
                    });
                    this.__.callable(config.success).call(this, col);
                    return Promise.resolve(col);
                }
                else if (model_name && config.url) {
                    return this.promise(function (resolve, reject) {
                        var _collection = this.container.find('collection[this-model="'
                                + model_name
                                + '"][this-loaded],[this-type="collection"][this-model="'
                                + model_name
                                + '"][this-loaded]');
                        if (!_collection.length)
                            _collection = this.container.find('collection[this-id="' + model_name
                                    + '"][this-loaded],[this-type="collection"][this-id="'
                                    + model_name + '"][this-loaded]');
                        if (!_collection.length)
                            _collection = this._('<collection this-model="'
                                    + model_name + '" this-url="' + config.url + '" />');
                        _collection.this('no-updates', '');
                        var _this = this;
                        this.request({
                            url: _collection
                        })
                                .then(function (data, uid) {
                                    // trigger invalid.response trigger if no data
                                    if (data) {
                                        // default data structure
                                        var expires = new Date().setMilliseconds(1000 * 3600 * 24),
                                                real_data = getRealData.call(_this, data);
                                        // get expiration if set and data from dataKey if specified
                                        if (_this.config.dataKey) {
                                            // set data expiration timestamp too.
                                            if (!isNaN(data.expires))
                                                // expiration is a number. Must be milliseconds
                                                expires = new Date().setMilliseconds(1000 * data.expires);
                                            else if (_this.__.isString(data.expires))
                                                // expiration is a string. Must be date
                                                _data.expires = new Date(data.expires).getTime();
                                        }
                                        ext.store.call(_this, model_name, real_data);
                                        ext.expirationStore.save(data.expires, model_name);
                                    }

                                    var col = new Collection(data, {
                                        name: model_name,
                                        app: _this,
                                        uid: config.uid || _collection.this('model-id-key') || uid,
                                        url: config.url || _collection.this('url')
                                    });
                                    _this.__.callable(config.success).call(_this, col);
                                    resolve(col);
                                })
                                .catch(function () {
                                    _this.__.callable(config.error).apply(_this, Array.from(arguments));
                                    reject.apply(null, Array.from(arguments));
                                });
                    });
                }
                return Promise.reject('No url provided');
            }, function (e) {
                return Promise.reject(e);
            });
        },
        /**
         * Sets the app debug mode
         * @param boolean debug Default is TRUE
         * @returns ThisApp
         */
        debug: function (debug) {
            if (!ext.isRunning.call(this))
                this.config.debug = debug === undefined ? true : debug;
            return this;
        },
        /**
         * The function called when an error occurs
         * @param string msg
         * @returns ThisApp
         */
        error: function (msg) {
            ext.log.call(this, 'warn', msg);
            return this;
        },
        /**
         * Takes the app forward one step in history
         * @returns ThisApp
         */
        forward: function (e) {
            return this.tryCatch(function () {
                if (e && this.__.isObject(e) && e['preventDefault'])
                    e.preventDefault();
                if (!ext.canContinue
                        .call(this, 'page.leave', [], this.page.items[0])) {
                    return this;
                }
                history.forward();
                return this;
            });
        },
        /**
         * Fetches the unique key generated for the last request
         */
        getRequestKey: function () {
            return ext.getRequestKey.call(this);
        },
        /**
         * Fetches a clone of the required elements from the cache collection
         * @param {string}|{_} selector
         * @param {string} type The type of element to get. This is the value of
         * the `this-type` of the target element. The attribute is created and 
         * appended to the selector.
         * @returns {_}
         */
        getCached: function (selector, type) {
            return this.tryCatch(function () {
                var _this = this,
                        elem = this._();
                if (this.__.isObject(selector))
                    selector = elemToSelector(selector);
                if (type) {
                    var seltr = '';
                    this.__.forEach(selector.split(','), function (i, v) {
                        if (seltr)
                            seltr += ',';
                        var parts = v.split(' '), sel = '';
                        v = parts.pop();
                        if (parts.length)
                            sel += parts.join(' ') + ' ';
                        seltr += sel + v + '[this-type="' + type + '"],' + sel + type + v;
                    });
                    selector = seltr;
                }
                // check in page cache first
                if (this.page) {
                    if (!selector) {
                        selector = 'page[this-id="' + this.page.this('id')
                                + '"],[this-type="page"][this-id="'
                                + this.page.this('id') + '"]';
                    }
                    var selectr = '';
                    this.__.forEach(selector.split(','), function (i, v) {
                        if (selectr)
                            selectr += ',';
                        selectr += 'page[this-id="'
                                + _this.page.this('id') + '"] ' + v
                                + ',[this-type="page"][this-id="'
                                + _this.page.this('id') + '"] ' + v;
                    });
                    elem = this.templates.find(selectr);
                    if (!elem.length)
                        elem = this.templates.children('[this-type="component"]')
                                .find(selector);
                    if (!elem.length) {
                        var _layout = this.page.closest('layout,[this-type="layout"]');
                        while (!elem.length && _layout.length) {
                            elem = this.templates.find('layout ' + selector
                                    + ',[this-type="layout"] ' + selector);
                            _layout = _layout.closest('layout,[this-type="layout"]');
                        }
                    }
                }
                if (!elem.length)
                    elem = this.templates.children(selector);
                elem = elem.clone();
                if (elem.this('type') === 'template')
                    elem.removeThis('type');
                elem.find('[this-type="style"]').each(function () {
                    _this._(this).replaceWith('<style>' + this.innerText + '</style>');
                });
                ext.emptyFeatures.call(_this, elem);
                return this._(elem.outerHtml()
                        .replace(/__obrace__/g, '{{')
                        .replace(/__cbrace__/g, '}}')
                        .replace(/__obrace2__/g, '({')
                        .replace(/__cbrace2__/g, '})'));
            });
        },
        /**
         * Returns the app to the home page
         * @param {Boolean} replaceState Indicates that the current state should
         * be replaced instead of creating a new one
         * @returns ThisApp
         */
        home: function (replaceState) {
            return this.tryCatch(function () {
                this.loadPage(this.config.startWith ||
                        this.container
                        .find('page[this-default-page]:not([this-current]):not([this-dead]),'
                                + '[this-type="pages"] [this-default-page]')
                        .this('id'), replaceState);
                return this;
            });
        },
        /**
         * Loads an element (collection, model, component, or layout)
         * @param {HTMLElement}|{_} elem
         * @param {Object} data
         * @param {Function} callback
         * @returns {ThisApp}
         */
        load: function (elem, data, callback) {
            return this.tryCatch(function () {
                var _this = this;
                this._(elem).each(function () {
                    var type = getElemType(_this._(this)),
                            method = 'load' + type[0].toUpperCase() + type.substr(1),
                            valid = _this.__.inArray(type.toLowerCase(),
                                    ['component', 'collection', 'model']);
                    if (!ext[method] || !valid)
                        return;
                    ext[method].call(_this, this, callback, data);
                });
                return this;
            });
        },
        /**
         * Loads the given page
         * @param {string} pageIDorPath ID of the page or the path to the content of the page
         * @param {boolean} replaceState Indicates whether to replace the current page's state with
         * the new page state instead of creating a different state for it.
         * @returns {ThisApp}
         */
        loadPage: function (pageIDorPath, replaceState) {
            return this.tryCatch(function () {
                var last_page = ext.recordsStore.find('last_page');
                if (!pageIDorPath || ((last_page === pageIDorPath || last_page === '#/' + pageIDorPath)
                        && !this.firstPage))
                    return this;
                if (this.page && !ext.canContinue
                        .call(this, 'page.leave', [], this.page.items[0])) {
                    return this;
                }
                this.oldPage = _();
                pageIDorPath = ext.pageIDFromLink.call(this, pageIDorPath, true);
                var newPage = this.getCached('[this-id="' + pageIDorPath + '"]', 'page');
                if (newPage.length > 1) {
                    this.error('Target page matches multiple pages!');
                    return this;
                }
                else if (!newPage.length) {
                    if (this.config.paths && this.config.paths.pages) {
                        var _this = this;
                        ext.fullyFromURL.call(this, 'page', pageIDorPath,
                                function (elem) {
                                    ext.pageFound.call(_this, elem, replaceState);
                                },
                                function () {
                                    ext.notAPage.call(_this, pageIDorPath);
                                });
                        return this;
                    }
                    ext.notAPage.call(this, pageIDorPath);
                    return this;
                }
                ext.pageFound.call(this, newPage, replaceState);
                return this;
            });
        },
        /**
         * Adds general event listeners
         * @param string event
         * @param string selector Multiple elements may be targeted by separating their selectors
         * by a comma.
         * @param function callback
         * @returns ThisApp
         */
        on: function (event, selector, callback) {
            return this.tryCatch(function () {
                if (ext.isRunning.call(this)) {
                    if (this.page) {
                        var evt = event.replace(/[^a-z0-9]/gi, '')
                                + selector.replace(/[^a-z0-9]/gi, ''),
                                pageID = this.page.this('id');
                        if (!containedEvents[evt]) {
                            // event has not been handled at all before
                            containedEvents[evt] = {};
                            var _this = this;
                            this.container.on(event, selector, function () {
                                return ext.dispatchEvent.call(_this, evt, this, Array.from(arguments));
                            });
                        }
                        if (!containedEvents[evt][pageID])
                            containedEvents[evt][pageID] = callback;
                    }
                    else {
                        this.container.on(event, selector, callback);
                    }
                }
                else
                    this.events.push({
                        event: event, selector: selector,
                        callback: callback
                    });
                return this;
            });
        },
        /**
         * What to do when the app encounters an error
         * @param function callback
         * @returns ThisApp
         */
        onError: function (callback) {
            this.error = function (message) {
                this.__proto__.error(message);
                this.__.callable(callback, true).call(this, message);
            };
            return this;
        },
        /**
         * Sets up the function to call when a page is not found
         * @param {function}|{string} callback or id of page to load
         * @returns {ThisApp}
         */
        pageNotFound: function (callback) {
            this.notFound = callback;
            return this;
        },
        /*
         * Creates a promise while ensuring the function's context is ThisApp
         * @returns {Promise}
         */
        promise: function (func) {
            return this.tryCatch(function () {
                return new Promise(function (resolve, reject) {
                    this.__.callable(func).call(this, resolve, reject);
                }.bind(this));
            });
        },
        /**
         * Reloads the current page
         * @param {Boolean} resources Indicates whether to reload all resources as well.
         * @param {Boolean} layouts Indicates whether to reload all layouts as well.
         * @returns {ThisApp}
         */
        reload: function (resources, layouts) {
            return this.tryCatch(function () {
                var last_page = ext.recordsStore.find('last_page');
                ext.recordsStore.remove('last_page');
                if (resources)
                    location.reload();
                else {
                    this.reloadLayouts = layouts || false;
                    if (this.page.hasThis('reading')) {
                        // keep attributes for page
                        this.tar['page#' + this.page.this('id')] = {
                            reading: '',
                            url: this.page.this('url'),
                            model: this.page.this('model'),
                            mid: this.page.this('mid')
                        };
                    }
                    this.loadPage(last_page, true);
                }
                return this;
            });
        },
        /**
         * Replaces cached elements with the given elem
         * @param {String} selector
         * @param {_}|{HTMLElement| elem
         * @returns {ThisApp}
         */
        replaceCached: function (selector, elem) {
            this.templates.find(selector).replaceWith(this._(elem).clone());
            return this;
        },
        /**
         * Sends an AJAX request
         * @param {string}|{object} config
         * Keys include:
         * type (string): GET | POST | PATCH | PUT | DELETE
         * url (string): The url to connect to. Default is current url
         * data (string|object): The data to send with the request
         * headers (object): Object of string keys to string values to pass to the request header
         * success (function): Function to call when a success response is gotten. The response data
         * is passed as a parameter
         * error (function) : Function to call when error occurs
         * complete (function): Function to call when a response has been received, error or success
         * @returns {Promise}
         */
        request: function (config) {
            return this.tryCatch(function () {
                if (!this.__.isObject(config)) {
                    config = {
                        url: config
                    };
                }
                var url = config.url;
                config.api = false;
                if (!url) {
                    ext.log.call(this, 'error', 'Method request() expects parameter 1 to be string. '
                            + typeof url + ' given');
                    return Promise.reject('Method request() expects parameter 1 to be string. '
                            + typeof url + ' given');
                }
                else if (this.__.isObject(url)) {
                    url = url.this('url');
                }
                if (!url.startsWith('./') && !url.startsWith('../') && url.indexOf('://') === -1) {
                    url = this.config.baseURL + url;
                    config.api = true;
                }
                config.type = config.type || 'get';
                config.dataType = config.dataType || 'json';
                if (config.type.toLowerCase() === 'get')
                    config.ignoreCache = ext.record.call(this, 'debug');
                config.url = url;
                return this.promise(function (resolve, reject) {
                    var success = config.success,
                            error = config.error;
                    config.success = function () {
                        this.__.callable(success).apply(this, Array.from(arguments));
                        resolve.apply(this, Array.from(arguments));
                    }.bind(this);
                    config.error = function () {
                        this.__.callable(error).apply(this, Array.from(arguments));
                        reject.apply(this, Array.from(arguments));
                    }.bind(this);
                    Ajax(config, this);
                });
            });
        },
        /**
         * Reset an autocomplete input element
         * @param {string} id The id of the element. Could also be a comma-separted
         * list of ids
         * @return {ThisApp}
         */
        resetAutocomplete: function (id) {
            return this.tryCatch(function () {
                if (id) {
                    var selector = '', _this = this;
                    this.__.forEach(id.split(','), function (i, v) {
                        if (i)
                            selector += ',';
                        selector += '[this-id="' + v.trim() + '"][this-autocomplete]';
                    });
                    this.container.find(selector).each(function () {
                        var _input = _(this),
                                _dropdownList = _this.container.find('[this-id="' + _input.this('list')
                                        + '"][this-type="list"],list[this-id="' + _input.this('list')
                                        + '"]'),
                                _selectedList = _this.container.find('[this-id="'
                                        + _dropdownList.this('selection-list')
                                        + '"][this-type="list"],list[this-id="'
                                        + _dropdownList.this('selection-list')
                                        + '"]');
                        _selectedList.html('').hide();
                        _dropdownList.removeThis('selected').html('').hide();
                        _input.val('').trigger('keyup').show();
                    });
                }
                return this;
            });
        },
        /**
         * Provide function to ensure api requests are secured by providing either
         * headers or request body data, or both.
         * @param {Function} func The function to be called when making api
         * requests. The function would receive 3 parameters: (string) key, 
         * (object) header, (object) body
         * @returns {ThisApp}
         */
        secureAPI: function (func) {
            ext.secureAPI.call(this, func);
            return this;
        },
        /**
         * Set the base url for the app
         * @param string url
         * @returns ThisApp
         */
        setBaseURL: function (url) {
            this.config.baseURL = url;
            return this;
        },
        /**
         * Sets the path to components' location
         * @param {string} path If path DOES NOT start with ./ or ../ or a protocol (e.g. http://),
         * the path is assumed to follow the set base url.
         * @param (string) ext The extension for components. This should include the dot (.). Default is
         * .html
         * @returns {ThisApp}
         */
        setComponentsPath: function (path, ext) {
            if (!this.config.paths)
                this.config.paths = {};
            this.__proto__.config.paths.components = {
                dir: path, ext: ext || '.html'
            };
            return this;
        },
        /**
         * Sets the path to css styles' location
         * @param {string} path If path DOES NOT start with ./ or ../ or a protocol (e.g. http://),
         * the path is assumed to follow the set base url.
         * @returns {ThisApp}
         */
        setCSSPath: function (path) {
            if (!this.config.paths)
                this.config.paths = {};
            this.__proto__.config.paths.css = path;
            return this;
        },
        /**
         * Sets the key in the response which holds the data array          * @param string key
         * @returns ThisApp
         */
        setDataKey: function (key) {
            this.config.dataKey = key;
            return this;
        },
        /**
         * Sets the the transport system to use for data connection.
         * @param {function} callback The callback would be passed a single parameter which is an
         * object of configuration for the transportation with keys action (create,update,read,delete),
         * id, url, data [formData] (only for create and update actions), success callback, error callback
         * and isCollection (only for read action)
         * The success callback takes three params (data [required], id [optional], uid [optional])
         * @returns {ThisApp}
         */
        setDataTransport: function (callback) {
            if (callback)
                this.dataTransport = callback;
            return this;
        },
        /**
         * Sets the default layout for the application
         * @param string layout ID of the layout container
         * @returns ThisApp
         */
        setDefaultLayout: function (layout) {
            this.config.layout = layout;
            return this;
        },
        /**
         * Sets the path to js scripts' location
         * @param {string} path If path DOES NOT start with ./ or ../ or a protocol (e.g. http://),
         * the path is assumed to follow the set base url.
         * @returns {ThisApp}
         */
        setJSPath: function (path) {
            if (!this.config.paths)
                this.config.paths = {};
            this.__proto__.config.paths.js = path;
            return this;
        },
        /**
         * Sets the path to layouts' location
         * @param {string} path If path DOES NOT start with ./ or ../ or a protocol (e.g. http://),
         * the path is assumed to follow the set base url.
         * @param (string) ext The extension for layouts. This should include the dot (.). Default is
         * .html
         * @returns {ThisApp}
         */
        setLayoutsPath: function (path, ext) {
            if (!this.config.paths)
                this.config.paths = {};
            this.__proto__.config.paths.layouts = {
                dir: path,
                ext: ext || '.html'
            };
            return this;
        },
        /**
         * Sets the path to pages' location
         * @param {string} path If path DOES NOT start with ./ or ../ or a protocol (e.g. http://),
         * the path is assumed to follow the set base url.
         * @param (string) ext The extension for pages. This should include the dot (.). Default is
         * .html
         * @returns {ThisApp}
         */
        setPagesPath: function (path, ext) {
            if (!this.config.paths)
                this.config.paths = {};
            this.__proto__.config.paths.pages = {
                dir: path,
                ext: ext || '.html'
            };
            return this;
        },
        /**
         * Sets the store for the app to use
         * 
         * @param {Function} newStore
         * 
         * Must be a function which returns a collections object.
         * The collections object must have methods find, save, saveMany, remove
         * and drop
         * 
         * @returns {ThisApp}
         */
        setStore: function (newStore) {
            if (!ext.isRunning.call(this)) {
                if (!this.__.isFunction(newStore)) {
                    this.error('Store must be funtion which returns a store object on the given collection name.');
                }
                else {
                    var testStore = newStore('___test');
                    if (!this.__.isObject(testStore)) {
                        this.error('Store must return a collections object');
                    }
                    else if (!this.__.isFunction(testStore.find) ||
                            !this.__.isFunction(testStore.save) ||
                            !this.__.isFunction(testStore.saveMany) ||
                            !this.__.isFunction(testStore.remove) ||
                            !this.__.isFunction(testStore.drop)) {
                        this.error('Returned collections object must have methods'
                                + ' find, save, saveMany, remove and drop which are all'
                                + ' functions.');
                    }
                    testStore.drop();
                    Store = newStore;
                }
            }
            return this;
        },
        /**
         * Sets the container that would always hold the page title
         * @param string container
         * @returns ThisApp
         */
        setTitleContainer: function (container) {
            this.config.titleContainer = this._(container);
            return this;
        },
        /**
         * Set the transition to use between pages
         * @param string|func transition To see string options, call method getAvailableTransitions.
         * If function, the function is passed two parameters - the old page and the new page
         * @param object options The options for the transition
         * @returns ThisApp
         */
        setTransition: function (transition, options) {
            this.config.transition = transition;
            this.config.transitionOptions = options;
            return this;
        },
        /**
         * Sets the funtion to call when there are files to be upload in a form
         * @param {Function} func
         * @returns {ThisApp}
         */
        setUploader: function (func) {
            this.setup = func;
            ext.setUploader.call(this, func);
            return this;
        },
        /**
         * Initializes the app
         * @param string page The ID of the page
         * @param boolean freshCopy Indicates to ignore copy in history and 
         * generate a fresh one
         * @returns app
         */
        start: function (page, freshCopy) {
            if (ext.isRunning.call(this))
                return this;
            if (page)
                this.config.startWith = page;
            this.firstPage = true;
            ext.setup.call(this);
            var hash = location.hash,
                    target_page = ext.processLink.call(this, hash);
            // load from old state if fresh copy not required and not debugging
            if (!freshCopy && !this.config.debug && history.state &&
                    hash === ext.recordsStore.find('last_page')) {
                ext.restoreState.call(this, history.state);
            }
            else {
                this.loadPage((hash && hash !== '#' && hash !== '#/') ? hash :
                        this.config.startWith ||
                        this.getCached('page[this-default-page],'
                                + '[this-type="pages"] [this-default-page]')
                        .this('id'));
            }
            return this;
        },
        /**
         * Fetches the store object for the given collection
         * @param string collection
         * @returns {Store}
         */
        store: function (collection) {
            return this.tryCatch(function () {
                return collection ? ext.store.call(this, collection) : Store;
            });
        },
        /**
         * Calls the given function in a try...catch block and outputs any errors to the console if 
         * debug mode is enabled.
         * @param {Function} tryFunc
         * @param {Function} catchFunc
         * @returns mixed
         */
        tryCatch: function (tryFunc, catchFunc) {
            return this.__.tryCatch(function () {
                return this.__.callable(tryFunc).call(this);
            }.bind(this),
                    function (e) {
                        if (catchFunc)
                            this.__.callable(catchFunc).call(this, e);
                        else
                            this.error(e);
                    }.bind(this));
        },
        /**
         * Sets a function to call to watch for server side changes to model collections
         * @param {function} callback Function would be passed 3 parameters - url, success callback
         * and error callback
         * @returns {ThisApp}
         */
        watch: function (callback) {
            this.watchCallback = callback;
            return this;
        },
        /**
         * A shortcut to method on()
         * @param string event
         * @param string target ID of the page to target. It could also be in forms TYPE or TYPE#ID e.g
         * collection#users. This means the target is a collection of id `users`. Target all collection
         * by specifying only collection
         * Multiple elements may be targeted by separating their selectors by a comma.
         * @param function callback
         * @returns ThisApp
         */
        when: function (event, target, callback) {
            return this.tryCatch(function () {
                return when.call(this, event, target, callback);
            });
        }
    };
    __.forEach(ThisApp.prototype, function (i, v) {
        if (__.isFunction(v)) {
            v.toString = function () {
                return 'See https://this-js.github.com/#/methods?lookup=' + i;
            };
        }
    });
    ThisApp.toString = function () {
        return 'See https://this-js.github.com';
    };
    __.forEach(['Transitions', 'Filters', 'extend', 'toString'], function (i, v) {
        ThisApp[v].toString = function () {
            return v === 'toString' ? 'toString() { [custom code] }'
                    : 'See https://this-js.github.com/#/advanced?lookup=' + v;
        };
    });
    __.forEach(__.__proto__, function (i, v) {
        v.toString = function () {
            return 'See https://this-js.github.com/#/__util?lookup=' + i;
        };
    });
})();