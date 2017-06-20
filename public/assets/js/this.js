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
            pageAssets = {
                js: {},
                css: {}
            },
            loadedPageJS = {
                first: {},
                last: {}
            },
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
                    key = _key + '[' + (__.isString(key) || !appendArray ?
                            key : '') + ']';
                if (__.isObject(value, true)) {
                    process(value, key);
                }
                else {
                    _this.append(key, value);
                }
            });
            if (_key && data && __.isObject(data, true) &&
                    !Object.keys(data).length)
                _this.append(_key, data);
        }
        process(object);
        return this;
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
                            return __.extend(__.isObject(localData[id], true) ?
                                    localData[id] : [
                            ], data);
                        }
                        else if (__.isObject(data)) {
                            return __.extend(__.isObject(localData[id], true) ?
                                    localData[id] : {}, data);
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
    function objToQStr(obj, callback, prepend) {
        if (!__.isObject(obj, true))
            return obj;
        var str = '',
                callback = __.callable(callback);
        __.forEach(obj, function (i, v) {
            callback.call(null, i, v);

            if (str) str += '&';

            var pre = prepend || '';
            if (prepend) i = '[' + i + ']';
            pre += __.isNumeric(i) ? '[]' : i;

            // is array or object
            if (__.isObject(v, true)) {
                var isArray = __.isArray(v);
                __.forEach(v, function (j, w) {
                    if (j && __.isNumeric(j)) str += '&';
                    if (__.isObject(w, true))
                        str += objToQStr(w, null, pre + '[' + j + ']');
                    else if (w)
                        str += pre + '[' + j + ']=' + encodeURIComponent(w);
                });
            }
            // not an object
            else {
                if (v !== undefined) str += pre + '=' + encodeURIComponent(v);
            }
        });
        return str;
    }
    function qStrToObj(str, callback) {
        var obj = {},
                callback = __.callable(callback);
        // loop through each key=value part
        __.forEach(str.split('&'), function (i, keyToValue) {
            // get key and value parts
            var parts = keyToValue.split('='),
                    // decode value
                    value = decodeURIComponent(parts[1]);
            callback.apply(null, parts);
            try {
                // try to ascertain value's real type
                value = eval(value);
            }
            catch (e) {
            }
            // key is an object path
            if (parts[0].indexOf('[') !== -1) {
                // get the path parts
                parts = parts[0].replace(/\]/g, '').split('[');
                // topmost 
                var firstKey = parts.shift(),
                        // last
                        lastKey = parts.pop();
                // set firstKey value
                obj[firstKey] = obj[firstKey] || {};
                // get firstKey value as temporary object
                var _tmp = obj[firstKey],
                        // previous temporary object
                        prevTmp = obj,
                        // previously used key
                        prevKey = firstKey;
                // loop through other parts
                __.forEach(parts, function (j, part) {
                    // part is empty or integer: array
                    if (!part || parseInt(part) == part) {
                        // initialize next object
                        _tmp = {};
                        // prevKey in prevTmp is not an array (or not exist)
                        if (!__.isArray(prevTmp[prevKey]))
                            // set as array with initialized object
                            prevTmp[prevKey] = [_tmp];
                        // part exists in previously intialized object
                        else if (prevTmp[prevKey][part])
                            // set temp as same
                            _tmp = prevTmp[prevKey][part];
                        else
                            // add initialized object to array
                            prevTmp[prevKey].push(_tmp);

                        // skip object processing
                        return;
                    }
                    // keep current tmp obj as the previous tmp
                    prevTmp = _tmp;
                    if (__.isArray(prevTmp)) {
                        _tmp = {};
                        // current part doesn't exist in tmp. Initialize it as object
                        if (!_tmp[part]) _tmp[part] = {};
                        prevTmp.push(_tmp);
                    }
                    else {
                        // current part doesn't exist in tmp. Initialize it as object
                        if (!_tmp[part]) _tmp[part] = {};
                        // overwrite current tmp with the value of part from previous tmp
                        _tmp = prevTmp[part];
                    }
                    prevKey = part;
                });
                // last key is string, hence object
                if (lastKey)
                    _tmp[lastKey] = value;
                // last key is empty: array
                else {
                    // get last non-empty part used in loop
                    lastKey = parts.pop() || prevKey;
                    // it's value in previous tmp is an array
                    if (prevTmp[lastKey] && __.isArray(prevTmp[lastKey])) {
                        // push the value into the array
                        prevTmp[lastKey].push(value);
                    }
                    // not array: override with an array containing the value
                    else prevTmp[lastKey] = [value];
                }
            }
            // key is just a key
            else {
                // set value
                obj[parts[0]] = value;
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
    function getRealData(data, dataKey) {
        // use dataKey if available
        if (dataKey || ext.config.call(this).dataKey) {
            return data[dataKey || ext.config.call(this).dataKey];
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
        // get action
        if (parts.length) {
            __.forEach(crudConnectors, function (i, v) {
                if (v === parts[0]) {
                    parts.shift();
                    analysis.action = i;
                    return false;
                }
            });
        }
        // get model
        if (parts.length) analysis.model = parts.shift();
        // get url
        if (parts.length) analysis.url = parts.join('/');
        // page has parameters
        if (analysis.page.indexOf('?') !== -1) {
            parts = analysis.page.split('?');
            // set page again
            analysis.page = parts[0];
            // set params
            analysis.params = qStrToObj(parts[1]);
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
    /**
     * @param {_} elem
     * @param {object} options Keys include ignore (array) and attrs (array).
     * Values for ignore may include any of tag, id, class, attrs
     * @returns {string}
     */
    function elemToSelector(elem, options) {
        elem = _(elem);
        options.ignore = options.ignore || [];
        options.attrs = options.attrs || [];
        // no element found
        if (!elem.length) return '';
        // set selector as the tag name
        var sel = '',
                cls = '';
        if (!__.inArray('tag', options.ignore))
            sel = elem.get(0).tagName.toLowerCase();
        // get id if not ignored
        if (!__.inArray('id', options.ignore) && elem.attr('id'))
            sel = '#' + elem.attr('id');
        // parse attributes if not ignored
        if (!__.inArray('attrs', options.ignore)) {
            elem.attr().forEach(function (v) {
                // skip if attribute is not requested
                if (!__.inArray(v.name, options.attrs))
                    return;
                // don't add id or style
                if (v.name === 'id' || v.name === 'style') return;
                // keep class for later parsing
                else if (v.name === 'class') {
                    cls = v.value.trim();
                    return;
                }
                // add attribute to selector
                sel += '[' + v.name;
                if (v.value) sel += '="' + v.value + '"';
                sel += ']';
            });
        }
        // skip classes if ignored
        if (__.inArray('class', options.ignore)) return sel;
        else if (cls) sel += '.';
        // add classes: replace spaces with dots
        sel += cls.replace(/\s/g, '.');
        return sel;
    }
    // update href values of links
    function updateLinkHrefs(elem) {
        var _this = this;
        // update links
        elem.find('a[this-goto]:not(form)')
                .each(function () {
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
                        href += '/' + crudConnectors[connector] + '/' +
                                (_a.this('model') || _model.this('model') ||
                                        _model.this('id')) + '/' + hrf;
                    }
                    _a.attr('href', href);
                });
    }
    function forEach(items, callback) {
        if (__.isObject(items) && items instanceof _)
            items = items.items;
        if (__.isArray(items))
            items.every(function (v, i) {
                return false !== __.callable(callback).call(v, i, v);
            });
        else {
            for (var a in items) {
                if (!items.hasOwnProperty(a))
                    continue;
                if (false === __.callable(callback).call(items[a], a, items[a]))
                    break;
            }
        }
    }
    function findElem(selector) {
        return Array.from(this.querySelectorAll(selector));
    }
    var Form = function (form) {
        // Ensures Form is called as an object not a function
        if (!this instanceof Form) return new Form(form);
        // data to hold from element entries
        var data = [],
                // add the element to the data array
                elemToData = function (_elem) {
                    if (_elem.is('input') &&
                            _elem.attr('type').toLowerCase() === 'file')
                        return;
                    data.push({
                        name: _elem.attr('name'),
                        value: _elem.val()
                    });
                },
                additionalData = {};
        // read form data
        _(form).find('input,select,button,textarea')
                .each(function () {
                    var _elem = _(this);
                    // ensure name exists
                    if (!_elem.attr('name')) return;
                    // handle checkboxes and radios
                    else if ((_elem.attr('type') === 'checkbox' || _elem.attr('type') === 'radio')
                            && _elem.is(':checked')) {
                        elemToData(_elem);
                    }
                    // handle others
                    else if (_elem.val().trim()) {
                        elemToData(_elem);
                    }
                });
        // parse data to query string
        this.toQueryString = function () {
            var str = '';
            // parse original form data
            data.forEach(function (entry) {
                if (str !== '')
                    str += '&';
                str += entry.name + '=' + encodeURIComponent(entry.value);
            });
            if (str) str += '&';
            // parse additional data
            str += objToQStr(additionalData);
            return str;
        };
        // parse data to object
        this.toObject = function () {
            var object = {};
            // parse original form data
            data.forEach(function (entry) {
                var obj = object, last;
                __.forEach(entry.name.split('['), function (i, v) {
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
                        if (!__.isObject(obj[last], true) ||
                                obj[last] === null) {
                            obj[last] = {};
                        }
                        obj = obj[last];
                        last = ky;
                    }
                });
                obj[last] = entry.value;
            });
            // parse additional data
            __.forEach(additionalData, function (key, value) {
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
                        if (!__.isObject(obj[last], true) ||
                                obj[last] === null) {
                            obj[last] = {};
                        }
                        obj = obj[last];
                        last = ky;
                    }
                });
                obj[last] = value;
            });
            return object;
        };
        // add data to the form from the given data
        this.fromObject = function (data) {
            additionalData = __.extend(additionalData, data);
            return this;
        };
        // fetches the form data in the best format and content type for the request
        this.forRequest = function (type, contentType) {
            if (type === 'get' ||
                    _(form).attr('enctype') === 'application/x-www-form-urlencoded' ||
                    contentType === 'application/x-www-form-urlencoded') {
                return {
                    data: this.toQueryString(),
                    contentType: 'application/x-www-form-urlencoded'
                };
            }
            else {
                return {
                    data: JSON.stringify(this.toObject()),
                    contentType: 'application/json'
                };
            }
        };
        // fetches the form's HTMLElement
        this.getForm = function () {
            return form;
        };
    };
    /**
     * Creates an AJAX connection
     * @param {object} config
     * @param {_} app
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
            progress: function (e, loaded, total) {
            },
            async: true,
            clearCache: false
        }, config);
        config.type = config.type.toLowerCase();
        var httpRequest = new XMLHttpRequest(),
                contentType = config.headers['Content-Type'] || config.headers['Content-type']
                || config.headers['content-type'] || config.headers['CONTENT-TYPE'];
        // call secureAPI
        if (app && config.api) {
            var secureAPI = ext.record.call(app, 'secureAPI'),
                    headers = {},
                    options = {},
                    data = {};
            if (false === __.callable(secureAPI || app.secap)
                    .call(app, headers, data, options)) {
                return __.callable(config.error).call(httpRequest);
            }
            // update config
            if (__.isObject(options))
                config = __.extend(config, options);
            // update headers
            if (__.isObject(headers))
                config.headers = __.extend(config.headers, headers);
            // update data
            if (__.isObject(data)) {
                if (config.data instanceof Form || config.data instanceof FormData)
                    config.data.fromObject(data);
                else if (__.isObject(config.data))
                    config.data = __.extend(config.data, data);
                else if (__.isString(config.data))
                    config.data += '&' + objToQStr(data);
            }
        }
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === XMLHttpRequest.DONE) {
                if (httpRequest.status >= 200 && httpRequest.status < 400) {
                    __.callable(config.success).call(httpRequest, httpRequest.response);
                }
                else {
                    __.callable(config.error)
                            .call(httpRequest, httpRequest.response);
                }
            }
        };
        // add time query to string to make it ignore cache
        if (config.ignoreCache)
            config.url += ((/\?/).test(config.url) ? "&" : "?") +
                    (new Date()).getTime();


        // leave data alone if content type is set
        if (!contentType && __.isObject(config.data)
                && !(config.data instanceof FormData)) {
            // load plain object into Form Object
            if (!(config.data instanceof Form))
                config.data = (new Form()).fromObject(config.data);
            // set config data to best format base on the type of request this is
            var form = config.data.forRequest(config.type.toLowerCase());
            contentType = form.contentType;
            config.data = form.data;
        }
        // GET Request with string or object data
        if (config.type === 'get' && (__.isString(config.data)
                || __.isObject(config.data, true))) {
            // convert data to string if not already string
            config.data = __.isString(config.data) ? config.data : objToQStr(config.data);
            // append data string to url
            config.url += ((/\?/).test(config.url) ? "&" : "?") + config.data;
            // unset config data
            config.data = null;
        }
        // data is string but no content type has been set
        else if (config.type !== 'get' && __.isString(config.data) && !contentType)
            contentType = 'application/x-www-form-urlencoded';

        httpRequest.open(config.type, config.url, config.async);
        httpRequest.responseType = config.dataType;
        httpRequest.withCredentials = config.withCredentials;
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
                    __.callable(config.progress)
                            .call(httpRequest, e, e.loaded, e.total);
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
                        return func === window ?
                                this.callable(null, nullable) :
                                this.callable(func, nullable);
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
                            result = result.concat(findElem.call(this, query));
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
                        return _(this.items.length ? this.items[0].cloneNode(true) : [
                        ], this.debug);
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
                        var val = eval(value);
                        if (val === undefined) throw 'error';
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
                            result = result.concat(findElem.call(this, selector));
                        }
                        else
                            result = findElem.call(this, selector);
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
                        forEach(items, callback);
                        return this;
                    });
                },
                /**
                 * Fetches the item at the given index
                 * @param int index
                 * @param boolean in_ Indicates whether to wrap in _ Object
                 * @returns mixed
                 */
                get: function (index, in_) {
                    var item = this.items[index];
                    return in_ ? _(item, this.debug) : item;
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
                 * Checks if the given item is numeric
                 * @param mixed item
                 * @returns {Boolean}
                 */
                isNumeric: function (item) {
                    return !isNaN(item);
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
                        _this.forEach(event.replace(/,/g, ' ')
                                .split(' '), function (i, v) {
                            target.addEventListener(v.trim(), function (e) {
                                // get target from event
                                var _target = e.target;
                                // target is not selector
                                if (selector && _target &&
                                        !_target.matches(selector)) {
                                    // find target from parents
                                    _target = _target.closest(selector);
                                    // target still not found
                                    if (!_target)
                                        return; // ignore callback
                                }
                                // apply callback on target
                                _this.callable(callback)
                                        .apply(_target, arguments);
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
                    _(document, this.debug)
                            .on('DOMContentLoaded', callback);
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
                removeArrayValue: function (array, value, all) {
                    return this.tryCatch(function () {
                        var index = array.indexOf(value),
                                retArr = [];
                        if (index < 0) {
                            index = array.indexOf(parseInt(value));
                        }
                        if (!all) {
                            return index > -1 ? [
                                this.removeArrayIndex(array, index)] : [];
                        }
                        else {
                            while (index > -1) {
                                var val = this.removeArrayIndex(array, index);
                                if (val || val == 0)
                                    retArr.push(val);
                                index = array.indexOf(value);
                                if (index < 0)
                                    index = array.indexOf(parseInt(value));
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
                 * @returns _ Object containing the new items
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
                        var rId = false, query = '',
                                _this = this;
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
                        var res = this.callable(tryCallback).call(this);
                        return res;
                    }
                    catch (e) {
                        if (!catchCallback) {
                            this.error(e.message);
                        }
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
                    this.items = findElem.call(document, selector);
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
                            _tmpl = this.getCached(_target),
                            app = this;
                    if (_tmpl.length) {
                        if (_target.this('tar'))
                            _tmpl.this('tar', _target.this('tar'));
                        _target = _target.replaceWith(_tmpl);
                    }

                    _target = ext.doTar.call(this, _target, true);
                    return this.promise(function (resolve, reject) {
                        new Collection({
                            app: this,
                            name: model_name
                        })
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
                                                            _target.replaceWith(elem);
                                                            resolve(_target);
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
                 * Binds an elem to a fresh copy of the given object. Callee must
                 * decide what to do with the bound elem (copy) in the callback.
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
                                    // call postLoad if page has been loaded
                                    if (this.pageIsLoaded)
                                        ext.postLoad.call(app, elem);
                                    elem.trigger('model.binded', {
                                        data: object
                                    });
                                    __.callable(callback)
                                            .apply(this, arguments);
                                }.bind(this));
                    }.bind(this),
                            elem.find('[this-component]:not([this-ignore])'));
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
                        response = __.callable(this.beforeCallbacks[this.page.this('id')][action])
                                .apply(context || this, params);
                    }
                    // check common callback only if page callback didn't return false or doesn't exist
                    if (response !== false && this.beforeCallbacks['___common']) {
                        response = __.callable(this.beforeCallbacks['___common'][action])
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
                                container = this._('<table />')
                                        .html(container.outerHtml());
                                break;
                            case "tr":
                                level = 2;
                                container = this._('<table />')
                                        .html(container.outerHtml());
                                break;
                            case "tbody":
                                level = 1;
                                container = this._('<table />')
                                        .html(container.outerHtml());
                        }
                    }
                    return {
                        level: level,
                        container: container
                    };
                },
                /**
                 * Cleans filters and make them ready for evaluation
                 */
                cleanFilter: function (filter) {
                    if (!filter) return 'true';
                    else if (__.isString(filter)) {
                        filter = filter.trim();
                        if (filter.startsWith('({'))
                            filter = filter.substr(2);
                        if (filter.endsWith('})'))
                            filter = filter.substr(0, filter.length - 2);
                    }
                    return filter;
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
                            return __.callable(callback).call(this);
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
                    return __.callable(containedEvents[event][this.page.this('id')])
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
                    var idKey = container.this('model-id-key') ||
                            container.this('id-key') || '',
                            id = ext.getUIDValue.call(this, data, idKey),
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
                                    .this('id-key', idKey)
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
                            container.this('id-key', idKey).this('mid', id);
                            container.html(_temp.html()).show();
                        }
                        __.callable(callback).call(this, container);
                    }.bind(this);
                    ext.parseData
                            .call(this, data, isModel ? container : content, false, isModel, _callback);
                    return this;
                },
                /**
                 * Runs the loop operation
                 */
                doLoop: function (data, elem, filter, content, model) {
                    if (!data)
                        return;
                    filter = ext.cleanFilter(filter);
                    elem = this._(elem);
                    if (!content)
                        content = elem.outerHtml();
                    var child = this._(content).get(0),
                            app = this,
                            level,
                            index = 0,
                            process = function (key, value) {
                                var __data = {
                                    index: index,
                                    key: key,
                                    value: value
                                },
                                        _content = ext.inLoop.call(app, __data, filter, content);
                                index++;
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
                                if (__.isObject(value, true)) {
                                    __.forEach(value, function (i, v) {
                                        if (!__.isObject(v, true))
                                            return;
                                        // do loop for repeater on current object
                                        _content.find('[this-repeat-for="value.' + i + '"]')
                                                .each(function () {
                                                    var __this = app._(this),
                                                            __filter = __this.this('filter'),
                                                            __content = __this.removeThis('muted')
                                                            .removeThis('this-repeat-for')
                                                            .removeThis('filter')
                                                            .clone().outerHtml();
                                                    ext.doLoop.call(app, v, this, __filter, __content, model);
                                                });
                                    });
                                }
                                if (elem.hasThis('prepend'))
                                    elem.after(_content.children());
                                else
                                    elem.before(_content.children());
                            };
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
                    if (__.isObject(data, true)) {
                        __.forEach(data, function (key, value) {
                            process(key, value);
                        });
                    }
                    // data is string in format: [start ... last, progress]
                    else {
                        // parse operation parts
                        var parts = data.substr(1, data.length - 2)
                                .replace('...', ',').split(','),
                                // set the current/start value
                                current = parts[0],
                                // set last value
                                last = parts[1],
                                // set diff/progress
                                diff = parts[2] || 1,
                                up;
                        try {
                            // evaluate each in case any is string
                            current = eval(current);
                            last = eval(last);
                            diff = eval(diff);

                            // ensure they all are integers
                            current = parseInt(current);
                            last = parseInt(last);
                            // remove minus sign if available
                            diff = Math.abs(diff);

                            // incrementing or not
                            up = current < last;

                            while ((up && current <= last) ||
                                    (!up && current >= last)) {
                                process(current, current);
                                if (up) current += diff;
                                else current -= diff;
                            }
                        }
                        catch (e) {
                            this.error(e);
                            return;
                        }
                    }
                    elem.remove();
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
                        __.forEach(this.tar[tar], function (i, v) {
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
                                dataType: 'text'
                            })
                                    .then(function (data) {
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
                                    })
                                    .catch(function () {
                                    });
                        }
                        else {
                            _layout.find('[this-content]')
                                    .html(__layout.removeThis('extends')
                                            .show());
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
                 * @param {object} options Keys include list (_), data (Object),
                 * idKey (string), filter (string), dropdownList (_), ignoreIds (boolean)
                 * @returns {array} Array of ids added to the list
                 */
                fillAutocompleteList: function (options) {
                    var app = this,
                            ids = [],
                            data_length = Object.keys(options.data).length,
                            _dropdownList, selected = '';
                    if (options.dropdownList) {
                        _dropdownList = options.dropdownList;
                        var selected = _dropdownList
                                .this('selected') || '';
                    }
                    // loop through data
                    __.forEach(options.data, function (i, v) {
                        options.filter = ext.cleanFilter(options.filter);
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
                        var id = ext.getUIDValue.call(app, v, options.idKey);
                        // don't render elem if already selected
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
                    // add selected ids to the dropdown list for future refereces
                    if (ids.length) {
                        if (_dropdownList && !options.ignoreIds)
                            _dropdownList.this('selected', (_dropdownList.this('selected') || '')
                                    + ids.join(',') + ',');
                        options.list.trigger('list.loaded');
                    }
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
                        __.forEach(variables, function (i, v) {
                            var value = ext.getVariableValue.call(app, v, data);
                            content = content.replace(v.trim(),
                                    value || value == 0 ? value : v);
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
                        // add layout to container if not already loaded
                        if (!_layout.hasThis('loaded'))
                            this.container.html(_layout.show());
                        _layout.trigger('layout.loaded').this('loaded', '');
                    }
                    else
                        this.container.html(this.page);
                    // set `this-content` to id of its layout
                    this.container.find('[this-content]')
                            .each(function () {
                                var _this = _(this);
                                if (_this.this('content')) return;
                                _this.this('content',
                                        _this.closest('layout,[this-type="layout"]')
                                        .this('id'));
                            });
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
                            + ':not(component):not([this-type="component"])'
                            + ',[this-repeat-for]')
                            .hide();
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
                                new Collection({
                                    app: this,
                                    name: this.page.this('model')
                                })
                                        .then(function (collection) {
                                            return collection.model(this.page.this('mid'), {
                                                url: this.page.this('url'),
                                                ignoreCache: this.page.hasThis('ignore-cache')
                                                        || !ext.config.call(this).cacheData
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
                                // load page s model. Ensures expresssion are executed
                                ext.showPage.call(this, replaceInState);
                            }
                        }.bind(this));
                    }.bind(this);
                    // load page content from elsewhere
                    if (this.page.this('path')) {
                        this.request({
                            url: this.page.this('path'),
                            dataType: 'text'
                        })
                                .then(function (data) {
                                    app.page.html(data).show()
                                            .find('[this-type]'
                                                    + ':not(component):not([this-type="component"])')
                                            .hide();
                                    ext.loadAssets.call(app, app.page, loadedAssets);
                                })
                                .catch(function () {
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
                    if (!ext.config.call(this).paths) {
                        __.callable(error).call(this);
                        return;
                    }
                    var app = this,
                            pathConfig = ext.config.call(this).paths[type + 's'];
                    if (!__.isObject(pathConfig)) {
                        this.__callable(error).call(this);
                        return;
                    }
                    var url = pathConfig.dir + idOrPath + pathConfig.ext;
                    this.request({
                        url: url,
                        dataType: 'text'
                    })
                            .then(function (data) {
                                var elem = __.createElement(data),
                                        prep4Tmpl = function (elem) {
                                            var content = ext.removeComments.call(app, elem.html());
                                            elem.html(content);
                                            elem.find('[this-type="collection"]:not([this-model]),'
                                                    + 'collection:not([this-model])')
                                                    .each(function () {
                                                        app._(this)
                                                                .this('model', app._(this)
                                                                        .this('id'));
                                                    });
                                            elem.find('[this-autocomplete][this-list]')
                                                    .each(function () {
                                                        var __this = app._(this),
                                                                _dropdownList = elem.find('list[this-id="'
                                                                        + __this.this('list')
                                                                        + '"],[this-type="list"][this-id="' + __this.this('list')
                                                                        + '"]')
                                                                .this('autocompleting', __this.this('id')),
                                                                _selectedList = elem.find('list[this-id="'
                                                                        + _dropdownList.this('selection-list')
                                                                        + '"],[this-type="list"][this-id="'
                                                                        + _dropdownList.this('selection-list')
                                                                        + '"]')
                                                                .this('parent-list', _dropdownList.this('id'));
                                                    });
                                            elem.find('img[src]')
                                                    .each(function () {
                                                        var __this = app._(this);
                                                        if (!__this.attr('src'))
                                                            return;
                                                        __this.attr('this-src', __this.attr('src'))
                                                                .removeAttr('src');
                                                    });
                                        },
                                        done = function () {
                                            __.callable(success)
                                                    .call(this, elem.clone());
                                        }.bind(this);
                                // components
                                if (type === 'component') {
                                    elem = app._('<div this-type="component"'
                                            + ' this-url="' + idOrPath + '"/>')
                                            .html(elem);
                                    prep4Tmpl(elem);
                                    ext.loadCollections.call(app,
                                            function () {
                                                app.addToCache(elem);
                                                if (elem.children().length === 1)
                                                    elem = elem.children();
                                                done();
                                            },
                                            elem.find('[this-type="collection"][this-static]:not([this-ignore]),'
                                                    + 'collection[this-static]:not([this-ignore])'));
                                }
                                // pages and layouts
                                else {
                                    if (!elem.length || elem.length > 1) {
                                        elem = app._('<div this-type="' + type + '" />')
                                                .html(data);
                                    }
                                    else if (!elem.is(type) && elem.this('type') !== type) {
                                        if (elem.this('type'))
                                            elem = elem.wrap('<div this-type="page" />')
                                                    .parent();
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
                            })
                            .catch(function (e) {
                                __.callable(error).call(this, e);
                            });
                },
                /**
                 * Fetches all the comments in the content
                 * @param {string} content
                 * @returns {Array}
                 */
                getComments: function (content) {
                    return ext.parseBrackets.call(this, '<!--', '-->', content);
                },
                /**
                 * Fetches the value of the variable on a deep level
                 * @param string variable May contain dots (.) which denote children keys
                 * @param object data The object from which to get the value
                 * @returns string
                 */
                getDeepValue: function (variable, data) {
                    var value = data,
                            vars = __.isObject(variable, true) ?
                            variable : variable.split('.');
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
                    __.forEach(content.split('({'), function (i, v) {
                        if (!i)
                            return;
                        exps.push('({' + v.split('})')[0] + '})');
                    });
                    return exps;
                },
                /**
                 * Gets the store pathname for the current app container's template
                 */
                getTemplatePath: function () {
                    var path = location.pathname;
                    // add container id to path if it wasn't auto generated
                    // this makes template cache unique to apps when running
                    // multiple instances on the same 
                    if (!this.container.hasThis('auto-id'))
                        path += this.container.this('id');
                    return path;
                },
                /**
                 * Fetches the value of the idKey of the given data
                 * @param {object} data
                 * @param {string} idKey If not provided, the default in the config is fallen
                 * back to
                 * @returns {mixed}
                 */
                getUIDValue: function (data, idKey) {
                    return ext.getDeepValue.call(this, idKey ||
                            ext.config.call(this).idKey, data);
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
                            .replace(/\\\|/g, '__fpipe__')
                            .replace(/(\s*)?\|(\s*)?/g, '|')
                            .trim().split('|'),
                            // the first element is the variable name
                            varname = vars.shift(0).trim(),
                            // get the variable value
                            value = __.contains(varname, '.') ?
                            ext.getDeepValue.call(null, varname, data) : data[varname];
                    // go through filters
                    __.forEach(vars, function (i, v) {
                        // changed escaped pipes to real pipes
                        v = v.trim().replace(/__fpipe__/g, '|');
                        // get filter parts
                        var parts = v.split('='),
                                // the first element is the filter name
                                filter = parts.shift(0).trim();
                        // check filter exists
                        if (Filters[filter]) {
                            // run filter
                            value = Filters[filter](value, parts.join(';'));
                        }
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
                        elem.this('id', __.randomString());
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
                    filter = ext.cleanFilter(filter);
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
                                __this.html(__this.html());
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
                                        if (matched[level] ||
                                                !eval(__this.this('else-if')
                                                        .trim()))
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
                    content.find('[this-if][this-ignore],[this-else-if][this-ignore],'
                            + '[this-else][this-ignore],[this-end-if][this-ignore]')
                            .removeThis('ignore');
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
                 * Gets the configuration object for the app
                 */
                config: function () {
                    return ext.record.call(this, 'config');
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
                    var url = (name.indexOf('://') !== -1 || name.startsWith('//')) ?
                            name : ext.config.call(this).paths[type] + name,
                            app = this,
                            load = function (url) {
                                if (type === 'js') {
                                    eval(pageAssets['js'][url]);
                                }
                                else if (type === 'css') {
                                    elem.prepend('<style type="text/css">' +
                                            pageAssets['css'][url] +
                                            '</style>');
                                }
                                __.callable(callback)
                                        .call(this, pageAssets[type][url]);
                            }.bind(this);
                    // ensure url ends with .type (.js|.css|...)
                    if (!url.endsWith('.' + type))
                        url += '.' + type;
                    if (!pageAssets[type])
                        pageAssets[type] = {};
                    if (ext.record.call(this, 'debug') || !pageAssets[type][url]) {
                        this.request({
                            dataType: type === 'css' ? 'text/css' : 'text/javascript',
                            url: url
                        })
                                .then(function (content) {
                                    pageAssets[type][url] = content;
                                    load(url);
                                })
                                .catch(function () {
                                    load(url);
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
                                    __.callable(callback).call(this);
                                }
                            }.bind(this);
                    if (elem.this('load-css') && !elem.hasThis('with-css')) {
                        loading++;
                        var csses = elem.this('load-css').split(',');
                        // load comma-separated css files
                        __.forEach(csses,
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
                        __.forEach(jses, function (i, js) {
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
                    __this = this._(__this)
                            .this('loading', '');
                    // collection must have id
                    if (!__this.this('id')) {
                        __this.removeThis('loading');
                        __.callable(callback)
                                .call(this);
                        return;
                    }
                    if (!__this.this('model'))
                        __this.this('model', __this.this('id'));
                    // get collection content
                    var _cached = this.getCached('[this-id="'
                            + __this.this('id') + '"]', 'collection');
                    ext.loadComponents.call(this,
                            function () {
                                var emptyContent = _cached.children('[this-on-empty]')
                                        .remove().removeThis('on-empty')
                                        .removeThis('on-emptied')
                                        .removeThis('[this-first-child]').outerHtml(),
                                        firstChild = _cached.children('[this-first-child]')
                                        .remove().removeThis('first-child')
                                        .removeThis('on-emptied').outerHtml(),
                                        content = _cached.children(':not([this-on-emptied])')
                                        .get(0, true).outerHtml(),
                                        app = this,
                                        model_name = __this.this('model');
                                __this = ext.doTar.call(this, __this, true);
                                if (!__this.hasThis('paginate') ||
                                        !__this.children(':first-child')
                                        .this('mid')) {
                                    __this.html('');
                                }
                                var requestData = {},
                                        save = ext.config.call(this).cacheData,
                                        success, error;
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
                                        else if (ext.config.call(this).pagination &&
                                                ext.config.call(this).pagination.limit) {
                                            requestData['limit'] = ext.config.call(this).pagination.limit;
                                        }
                                    }
                                }
                                // callbacks for request
                                success = function (data, idKey, handled) {
                                    if (firstChild) __this.prepend(firstChild);
                                    if (idKey)
                                        __this.this('model-id-key', idKey);
                                    if (!data || (__.isObject(data, true)
                                            && !Object.keys(data).length)) {
                                        __this.html(emptyContent)
                                                .this('loaded', '')
                                                .removeThis('loading')
                                                .show();
                                        __.callable(callback).call(this, data);
                                        data = false;
                                    }
                                    __this.trigger('collection.loaded');

                                    if (handled) {
                                        __.callable(callback)
                                                .call(app, data || {});
                                        return;
                                    }
                                    else if (data) {
                                        ext.loadData
                                                .call(app, __this, data, content, false, save,
                                                        function (elem) {
                                                            if (elem) {
                                                                elem.this('loaded', '')
                                                                        .removeThis('loading')
                                                                        .trigger('collection.loaded');
                                                            }
                                                            __.callable(callback).call(this, data);
                                                        }.bind(app));
                                    }
                                },
                                        error = function () {
                                            if (emptyContent)
                                                __this.html(emptyContent).show();
                                            // revert pagination page to former page count
                                            if (__this.this('pagination-page') !== undefined) {
                                                __this.this('pagination-page', parseInt(__this.this('pagination-page')) - 1);
                                            }
                                            __this.removeThis('loading')
                                                    .trigger('collection.loaded');
                                            __.callable(callback).call(app);
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
                            }.bind(this),
                            _cached.find('[this-component]:not([this-ignore])'));
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
                                    + ':not([this-data]):not([this-loading]):not([this-ignore]),'
                                    + '[this-type="collection"]:not([this-loaded])'
                                    + ':not([this-data]):not([this-loading]):not([this-ignore])'),
                            length = collections.length,
                            done = function () {
                                if (length) return;
                                if (chain) {
                                    ext.loadForms.call(this, null, null, replaceState, chain);
                                }
                                else {
                                    __.callable(callback).call(app);
                                }
                            }.bind(this);
                    if (!length)
                        done();
                    else {
                        collections.each(function () {
                            ext.loadCollection.call(app, this, function () {
                                length--;
                                done();
                            }.bind(app), null, replaceState);
                        });
                    }
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
                    if (!component ||
                            !this._(component).length) {
                        if (__this.this('url')) {
                            var cached = this.getCached('[this-url="' +
                                    __this.this('url') + '"]', 'component');
                            if (cached.length)
                                ext.loadComponent.call(this, __this, callback, cached.children()
                                        .clone().show());
                            else
                                ext.fullyFromURL
                                        .call(app, 'component', __this.this('url'),
                                                function (data) {
                                                    ext.loadComponent
                                                            .call(app, __this, callback, app._(data)
                                                                    .clone());
                                                },
                                                function () {
                                                    __this.remove();
                                                    __.callable(callback)
                                                            .call(app);
                                                });
                        }
                        else {
                            component = this.getCached('[this-id="'
                                    + __this.this('component') + '"]', 'component');
                            if (!component.length) {
                                __.callable(callback).call(this);
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
                    // call post load if loading component after page has been loaded
                    if (this.pageIsLoaded)
                        ext.postLoad.call(this, __this, true);
                    __.callable(callback).call(this);
                },
                /**
                 * Loads all components in the current page
                 * @param function callback To be called when all components have been loaded
                 * @returns ThisApp
                 */
                loadComponents: function (callback, components) {
                    var app = this,
                            components = components ||
                            this.container.find('[this-component]:not([this-ignore])'),
                            length = components.length;
                    if (!length) {
                        __.callable(callback).call(this);
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
                        __.callable(callback).call(this);
                        return;
                    }
                    // default data structure
                    var _data = {
                        data: {},
                        // set expiration timestamp to 24 hours
                        expires: new Date().setMilliseconds(1000 * 3600 * 24)
                    },
                            dataKey = container.this('data-key') ||
                            ext.config.call(this).dataKey,
                            real_data = getRealData.call(this, data, dataKey);
                    // get expiration if set and data from dataKey if specified
                    if (dataKey) {
                        // set data expiration timestamp too.
                        if (!isNaN(data.expires))
                            // expiration is a number. Must be milliseconds
                            _data.expires = new Date().setMilliseconds(1000 *
                                    data.expires);
                        else if (__.isString(data.expires))
                            // expiration is a string. Must be date
                            _data.expires = new Date(data.expires).getTime();
                        data = real_data;
                    }
                    // trigger empty.response trigger if no data
                    if (!data || !__.isObject(data, true) || !Object.keys(data).length) {
                        hidePaginationBtns();
                        container.trigger('empty.response');
                        __.callable(callback).call(this);
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
                                __.callable(callback).apply(this, arguments);
                            }.bind(this);
                    // loading a collection
                    if (__.isArray(data) || isModel === false) {
                        // check if can continue with rendering
                        var __data = ext.canContinue
                                .call(this, 'collection.render', [data], container.get(0));
                        // rendering canceled
                        if (!__data) {
                            return this;
                        }
                        // rendering continues. Overwrite data with returned value if object 
                        else if (__.isObject(__data, true))
                            data = __data;
                        var app = this,
                                // filter for the collection
                                filter = container.this('filter'),
                                // unique id key for models
                                idKey = container.this('model-id-key') ||
                                ext.config.call(this).idKey,
                                tab_cont = ext.checkTableContent.call(this, content),
                                level = tab_cont.level,
                                content = tab_cont.container.outerHtml();
                        this.collectionData = Object.keys(this.cacheTargets ||
                                data).length;
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
                                                && ext.config.call(this).pagination
                                                && ext.config.call(this).pagination.overwrite)
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
                                if (container.this('paginate-overwrite') ===
                                        'true') {
                                    container.html('');
                                }
                            }
                            // inline command not exist. check config pagination command
                            else if (ext.config.call(this).pagination &&
                                    ext.config.call(this).pagination.overwrite) {
                                container.html('');
                            }
                            // the indices of the all models in collection
                            var indices = [],
                                    doneLoading = function () {
                                        if (!--this.collectionData) {
                                            delete this.collectionData;
                                            __.callable(_callback)
                                                    .call(this, container);
                                        }
                                    }.bind(this);
                            // needed for subsequent pagination attempts
                            __.forEach(this.cacheTargets || data, function (_index, _model) {
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
                                container.children('[this-mid="' +
                                        index + '"]').remove();
                                // get id from model with idKey
                                var id = ext.getUIDValue.call(app, model, idKey);
                                // keep index for later cached pagination
                                indices.push(id || index);
                                if (!__data) {
                                    doneLoading();
                                    return;
                                }
                                else if (__.isObject(__data))
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
                                        _tmpl.outerHtml()
                                        .replace(/{{_index}}/g, index));
                                // if there's no content, go to the next model
                                if (!_content) {
                                    __.callable(callback)
                                            .call(app);
                                    return;
                                }
                                // process expressions in content
                                _content = app._(ext.processExpressions.call(app,
                                        _content, {
                                            index: index,
                                            model: model
                                        }), model);
                                if (!idKey)
                                    idKey = ext.config.call(app).idKey;
                                var idKey_parts = idKey.split('.')
                                        .reverse(),
                                        _id = {},
                                        top_idKey = idKey_parts.pop();
                                // idKey must exist in model
                                if (!model[top_idKey]) {
                                    $.each(idKey_parts, function (i, v) {
                                        if (!i)
                                            _id[v] = id || index;
                                        else
                                            _id[v] = _id;
                                    });
                                    model[top_idKey] = _id;
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
                                                && ext.config.call(this).pagination
                                                && ext.config.call(this).pagination.overwrite)) {
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
                            if ((container.this('paginate') &&
                                    indices.length != container.this('paginate'))
                                    || (!container.this('paginate') &&
                                            ext.config.call(this).pagination
                                            && ext.config.call(this).pagination.limit
                                            && indices.length !=
                                            ext.config.call(this).pagination.limit)) {
                                done();
                            }
                        }
                        // data is empty
                        else {
                            done();
                            save = false;
                            delete this.collectionData;
                            __.callable(_callback).call(this, container);
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
                            ext.store.call(this, save_as)
                                    .saveMany(_data.data, idKey);
                            ext.record.call(this).expirationStore.save(_data.expires, save_as);
                            ext.record.call(this).paginationStore.save(_data.pagination, save_as);
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
                        else if (__.isObject(__data))
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
                        __.forEach(elements, function () {
                            var __this = app._(this),
                                    key = __this.this('is');
                            if (!key)
                                return;
                            var data = ext.getVariableValue.call(app, key, model);
                            if (!data)
                                return;
                            if (!__this.hasThis('autocomplete') &&
                                    __.isObject(data)) {
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
                                        if (!__.isObject(data, true)) {
                                            if (__this.this('value-key')) {
                                                // set data as value
                                                __this.val(data);
                                                return;
                                            }
                                            // data must be a string and therefore the idKey
                                            // create an object with the idKey => the data
                                            var id = data;
                                            data = {};
                                            data[ext.config.call(app).idKey ||
                                                    'id'] = id;
                                        }
                                        if (!__this.hasThis('multiple')) {
                                            // ensure data is an array
                                            if (__.isObject(data)) {
                                                data = [data];
                                            }
                                            __this.hide();
                                        }
                                        ids = ext.fillAutocompleteList.call(this, {
                                            list: _selectedList.html(''),
                                            data: data,
                                            dropdownList: _dropDownList
                                        });
                                    }
                                }.bind(app);
                                // refill list from provided function
                                if (_selectedList.this('refill')) {
                                    return __.callable(_selectedList.this('refill'))
                                            .call(this, data, gotData);
                                }
                                // refill list from
                                else if (_selectedList.this('refill-url')) {
                                    return app.request({
                                        dataType: 'json',
                                        type: 'POST',
                                        url: _selectedList.this('refill-url'),
                                        data: {
                                            ids: data
                                        }
                                    })
                                            .then(function (data) {
                                                gotData(getRealData.call(app, data));
                                            })
                                            .catch(function () {

                                            });
                                }
                                gotData(data);
                            }
                            else if (__this.get(0).tagName.toLowerCase() ===
                                    'img')
                                __this.attr('src', data);
                            else {
                                // using attribute so that redumping content 
                                // would still work fine
                                __this.attr('value', data);
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
                                __this.find('[this-search]')
                                        .attr('value', app.page.this('query'));
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
                    if (!this.page.hasThis('no-layout') &&
                            (ext.config.call(this).layout || this.page.this('layout'))) {
                        var layout = this.page.this('layout') || ext.config.call(this).layout;
                        // get existing layout in container if not asked to reload layouts
                        _layout = this.reloadLayouts ? _layout :
                                this.container.find('layout[this-id="' + layout
                                        + '"],[this-type="layout"][this-id="'
                                        + layout + '"]');
                        // layout does not exist in container
                        if (!_layout.length) {
                            // get layout template
                            _layout = this.getCached('[this-id="' + layout + '"]', 'layout');
                            // layout doesn't exist
                            if (!_layout.length) {
                                ext.fullyFromURL.call(this, 'layout', layout,
                                        function (_layout) {
                                            _layout.removeThis('url')
                                                    .find('[this-content]')
                                                    .html(app.page);
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
                                        dataType: 'text'
                                    })
                                            .then(function (data) {
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
                                            })
                                            .catch(function () {
                                                app.error('Layout [' + layout + '] not found!');
                                                ext.finalizePageLoad.call(app, _layout,
                                                        replaceInState);
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
                            if (!this.page.hasThis('loaded')) {
                                _layout.find('[this-content="' +
                                        _layout.this('id')
                                        + '"]').html(this.page);
                            }
                            _layout.this('loaded', '');
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
                    // mark as loading
                    __this.this('loading', '')
                            // mark model's collections as loading
                            .find('collection:not([this-ignore]),'
                                    + '[this-type="collection"]:not([this-ignore])')
                            .this('loading', '');
                    if (__this.this('id'))
                        common_selector += '[this-id="' + __this.this('id') + '"]';
                    else if (__this.this('model'))
                        common_selector += '[this-model="' + __this.this('model') + '"]';
                    __this = ext.doTar.call(this, __this, true);
                    if (!data && !__this.this('url')) {
                        __.callable(callback).call(this);
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
                        var success = function (data, idKey, handled) {
                            __this.removeThis('loading');
                            if (handled) {
                                __.callable(callback).call(app, data);
                                return;
                            }
                            ext.loadData.call(app, __this, data, content, true,
                                    // only save the data if not loading page
                                    // or loading a page and cache is not to be cached:
                                    // cache so that saving forms can work fine:
                                    // cache would be cleared when the collection is
                                    // rendered again
                                    type !== 'page' || ext.config.call(app).cacheData === false,
                                    function (elem) {
                                        if (elem) {
                                            elem.this('loaded', '')
                                                    .removeThis('loading')
                                                    .trigger('model.loaded')
                                                    .show();
                                        }
                                        __.callable(callback).call(this, data);
                                    }.bind(app));
                        },
                                error = function () {
                                    __this.removeThis('loading');
                                    __.callable(callback).call(app);
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
                    ext.loadComponents.call(this, function (elem) {
                        loadedComponents.call(app, __this.outerHtml());
                    },
                            __this.find('[this-component]:not([this-ignore])'));
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
                            .find('model:not([this-in-collection]):not([this-ignore]),'
                                    + '[this-type="model"]:not([this-in-collection]):not([this-ignore])'),
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
                                null, replaceState);
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
                            expires = ext.record.call(this).expirationStore.find(model_name),
                            cache_expired = (expires && expires < Date.now()) || !expires,
                            cache, fromCache;
                    if (ext.config.call(this).cacheData) {
                        if (!isCollection) {
                            cache = ext.store.call(app, model_name)
                                    .find(config.elem.this('mid'));
                        }
                        else {
                            cache = ext.store.call(app, model_name)
                                    .find();
                            // check pagination page data exists in cached data for collection
                            if (config.elem.hasThis('paginate') &&
                                    // cached data exists and no pagination exists already
                                    cache) {
                                var pagination = ext.record.call(app).paginationStore.find(model_name);
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
                        // call postLoad if page has been loaded
                        if (app.pageIsLoaded)
                            ext.postLoad.call(app, config.elem);
                        __.callable(config.success)
                                .apply(config.elem, arguments);
                        config.elem.trigger('load.content.success');
                        config.elem.trigger('load.content.complete');
                    }.bind(this),
                            error = function () {
                                if (!loadDataOrCache(config, true)) {
                                    __.callable(config.error)
                                            .apply(config.elem, arguments);
                                    config.elem.trigger('load.content.error');
                                    config.elem.trigger('load.content.complete');
                                }
                            }.bind(this),
                            loadDataOrCache = function (config, isError) {
                                // if no data and no explicit ignore-cache on collection config.elem
                                // and cache exists
                                if (!config.data && cache && Object.keys(cache).length) {
                                    if (config.looping)
                                        this.__proto__[type + 's']--;
                                    config.data = cache;
                                    fromCache = true;
                                }
                                // if data exists/found
                                if (config.data) {
                                    var _data = {},
                                            dataKey = config.elem.this('data-key') ||
                                            ext.config.call(this).dataKey;
                                    // use dataKey if available
                                    if (dataKey) {
                                        _data[dataKey] = config.data;
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
                                                        elem.trigger(type +
                                                                '.cache.loaded');
                                                    }
                                                    // mark as loaded and trigger event
                                                    elem.removeThis('loading')
                                                            .this('loaded', '');
                                                }
                                                __.callable(success)
                                                        .call(this, config.data, null, true);
                                            }.bind(this));
                                    return true;
                                }
                                // Cannot load type. Move on.
                                else if (!isError) {
                                    __.callable(config.error).call(this);
                                }
                                return false;
                            }.bind(this);
                    // if no data is provided and collection has url 
                    if (!config.data
                            // and no cache or cache exists but is expired
                            && (!cache || (cache && cache_expired) ||
                                    // or page says ignore cache
                                    __.contains(ignore, type + '#'
                                            + config.elem.this('id'))
                                    // or elem itself says ignore cache
                                    || config.elem.hasThis('ignore-cache'))) {
                        var type;
                        try {
                            type = ext.config.call(app).crud.methods.read;
                        }
                        catch (e) {
                            type = 'get';
                        }

                        return ext.request.call(this, config.elem,
                                function () {
                                    if (!config.elem.hasThis('no-updates') &&
                                            this.watchCallback)
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
                        console[method].apply(null, __.isArray(param)
                                ? param : [param]);
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
                loop: function (container, data) {
                    if (!data) return;
                    container = this._(container);
                    var _each = container.find('[this-repeat-for]');
                    while (_each.length) {
                        var __this = _each.get(0, true),
                                each = __this.this('repeat-for').trim(),
                                _data = ext.getVariableValue.call(this, each, data, false),
                                filter = __this.this('filter'),
                                content = __this.removeThis('muted').removeThis('filter')
                                .removeThis('repeat-for').outerHtml(),
                                ignoreDataCheck = false;
                        __this.html('');
                        // this-repeat-for is not a model key
                        if (!_data) {
                            if (each.indexOf('...') !== -1) {
                                ignoreDataCheck = true;
                                _data = each;
                            }
                            // do each on a variable value
                            else if (each.startsWith('{{')) {
                                // get the value
                                _data = ext.getVariableValue.call(this, each, data, true);
                            }
                            // do each on an expression
                            else {
                                if (each.startsWith('({')) {
                                    each = each.substr(1, each.length - 2);
                                }
                                _data = ext.eval
                                        .call(this, each, data);
                            }
                        }
                        if (ignoreDataCheck || __.isObject(_data, true)) {
                            ext.doLoop.call(this, _data, __this, filter, content, data);
                        }
                        else {
                            __this.remove();
                        }
                        _each = container.find('[this-repeat-for]');
                    }
                },
                /**
                 * Fetches a model from a collection store
                 * @param string model_id
                 * @param string collection_id
                 * @returns object|null
                 */
                modelFromStore: function (model_id, model_name) {
                    return this.tryCatch(function () {
                        var model = ext.store.call(this, model_name)
                                .find(model_id),
                                expires = ext.record.call(this).expirationStore
                                .find(model_name);
                        return expires && expires < Date.now() ? null : model;
                    });
                },
                /**
                 * Saves a model to a collection store
                 * @param {object} options Keys include
                 * modelName (string), modelId (string|int), model (object),
                 * expireCollection (boolean), isNew (boolean), ignoreDOM (boolean)
                 * @returns {object}
                 */
                modelToStore: function (options) {
                    return this.tryCatch(function () {
                        var modelStore = ext.store.call(this, options.modelName);
                        if (options.expireCollection) {
                            ext.record.call(this).expirationStore.save(Date.now(), options.modelName);
                            ext.record.call(this).paginationStore.remove(options.modelName);
                        }
                        var model = modelStore.save(options.model, options.modelId
                                || ext.getUIDValue.call(this, options.model));
                        // create entries to update dom
                        if (!options.ignoreDOM) {
                            var store_name = options.isNew ? 'createdStore' : 'updatedStore',
                                    actionStore = ext.record.call(this, store_name),
                                    action = actionStore.find(options.modelName);
                            // saved existing options.model for dom update
                            if (!options.isNew) {
                                if (!action)
                                    action = {};
                                action[options.modelId] = {
                                    data: model,
                                    timestamp: Date.now()
                                };
                            }
                            // saved new model for dom update
                            else {
                                if (!action)
                                    action = [];
                                // Remove options.model idKey if exists to avoid duplicates
                                __.removeArrayValue(action, options.modelId, true);
                                action.push(options.modelId);
                            }
                            actionStore.save(action, options.modelName);
                            // update current page 
                            ext.updatePage.call(this);
                        }
                        return model;
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
                    if (__.isString(this.notFound)) {
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
                        return __.callable(this.notFound).call(this, page);
                    }
                },
                /**
                 * Called when the target page is found
                 * @param {boolean} replaceInState
                 * @returns {void}
                 */
                pageFound: function (page, replaceInState) {
                    if (ext.is.call(this, 'page', page)) {
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
                        this.params = analytics.params || {};
                        this.pageAction = analytics.action;
                        this.GETParams = location.search ?
                                qStrToObj(location.search.substr(1)) :
                                {};
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
                        this.page = this.container.find('[this-type="page"],page');
                        this.page.find('[this-type="template"]').remove();
                        this.page.trigger('page.loaded');
                        ext.store.call(this, '___cache')
                                .save(this.templates.html(), ext.getTemplatePath.call(this), true);
                        ext.saveState.call(this, replaceState);
                    }
                    // page was restored from history
                    else {
                        this.page.this('restored', '');
                        ext.updatePage.call(this, true);
                        this.restored = true;
                        this.page.trigger('page.loaded');
                        // clear cache of collections and models if not to cacheData
                        if (ext.config.call(this).cacheData === false) {
                            this.clearPageCache();
                        }
                    }

                    if (this.firstPage) {
                        if (restored)
                            // watch collections and models on current page
                            this.container.find('collection[this-loaded],[this-type="collection"]'
                                    + '[this-loaded],model[this-loaded],[this-type="model"]'
                                    + '[this-loaded]')
                                    .each(function () {
                                        ext.watch.call(app, this);
                                    });
                        // get all previously watched collections and models
                        var watching = ext.record.call(this).store.find('watching');
                        if (watching) {
                            // watch collections and models not on page
                            __.forEach(watching, function (id, obj) {
                                ext.watch.call(app, app._('<div this-id="' + id
                                        + '" this-type="' + obj.type
                                        + '" this-url="'
                                        + obj.url + '" this-mid="' + obj.mid
                                        + '" />'));
                            });
                        }
                        delete this.firstPage;
                    }
                    // load required js if not already loaded
                    if (this.page.this('load-js')
                            && !loadedPageJS.last[this.page.this('id')]) {
                        var jses = this.page.this('load-js')
                                .split(',');
                        // load comma-separated css files
                        __.forEach(jses, function (i, js) {
                            ext.loadAsset.call(app, 'js', js, app.page);
                        });
                        loadedPageJS.last[this.page.this('id')] = true;
                    }

                    ext.record.call(this).store.save(this.watching, 'watching');
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
                    return __.tryCatch(function () {
                        return content.match(new RegExp(oBrace + '\\s*[^' +
                                cBrace + ']+\\s*' + cBrace, 'gi')) || [];
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
                    var app = this,
                            custom = false,
                            tab_cont,
                            level;
                    if (__.isString(container)) {
                        container = this._('<div/>')
                                .html(container);
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
                    ext.loop.call(this, container, data);
                    var content = ext.processExpressions.call(this, container.outerHtml(), prObj, data);
                    var variables = ext.parseBrackets.call(this, '{{', '}}',
                            __.isString(content) ? content : content.outerHtml());
                    content = ext.fillVariables.call(this, variables, data, content);
                    container.replaceWith(content);
                    var done = function () {
                        if (custom)
                            container = container.children();
                        container.find('[this-muted]')
                                .removeThis('muted');
                        while (level) {
                            container = container.children();
                            level--;
                        }
                        ext.renderSrc.call(this, container);
                        __.callable(callback).call(this, container);
                    }.bind(this);
                    if (isModel) {
                        var collections = container.find('collection:not([this-loaded])'
                                + ':not([this-data]):not([this-loading]):not([this-ignore]),'
                                + '[this-type="collection"]:not([this-loaded]):not([this-data])'
                                + ':not([this-loading]):not([this-ignore])');
                        if (collections.length) {
                            this.__proto__.modelCollections = collections.length;
                            collections.each(function () {
                                var __this = app._(this);
                                data = ext.getVariableValue.call(app,
                                        __this.this('data'), data, true);
                                ext.loadCollection.call(app, __this, function () {
                                    __this.removeThis('loading')
                                            .this('loaded', '');
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
                postLoad: function (elem, isComponent) {
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
                        __.forEach(tags, function (i, v) {
                            content = content
                                    .replace(v, '&lt;' + v.substr(1, v.length - 2) + '&gt;');
                        });
                        content = content.replace(/\n/g, '<br/>')
                                .replace(/\s/g, '&nbsp;');
                        __this.html(content).removeThis('code');
                    });
                    elem.find('[this-hidden],[this-type="list"]').hide()
                            .removeThis('hidden');
                    // remove comments
                    var content = ext.removeComments.call(this, elem.html());
                    elem.html(content);
                    updateLinkHrefs.call(this, elem);
                    if (!isComponent) {
                        ext.loop.call(this, elem, {});
                        // remove unresolved repeat-for
                        elem.find('[this-repeat-for]')
                                .remove();
                        // clear cache of collections and models if not to cacheData
                        if (!this.pageIsLoaded &&
                                ext.config.call(this).cacheData === false) {
                            this.clearPageCache();
                        }
                    }
                },
                /**
                 * Called from setup, it prepares the dom for viewing by moving
                 * elements to the template node
                 */
                prepareDOMCache: function (startPage) {
                    // create templates container if not exists
                    if (!this._('[this-type="templates"][this-app="' +
                            this.container.this('id') + '"]').length)
                        this._('body').append('<div this-type="templates" this-app="' +
                                this.container.this('id') + '" style="display:none"/>');
                    var loaded = '';
                    // mark all container children as such
                    this.container.children('[this-type]')
                            .this('in-container', '')
                            .each(function () {
                                if (loaded) loaded += ',';
                                loaded += elemToSelector(this, {
                                    ignore: ['tag'],
                                    attrs: ['this-id', 'this-type', 'this-model']
                                });
                            });
                    var _layout = this.container.find('[this-default-page]')
                            .closest('layout,[this-type="layout"]');
                    // not the topmost container: add all page layouts to template
                    while (_layout.length && !_layout.hasThis('in-container')) {
                        var _clone = _layout.clone();
                        _clone.find('[this-content]').html('');
                        this.templates.append(_clone.this('in-container', ''));
                        // add to loaded string
                        if (loaded) loaded += ',';
                        loaded += elemToSelector(_layout, {
                            ignore: ['tag'],
                            attrs: ['this-id', 'this-type']
                        });
                        // get next closess layout
                        _layout = _layout.closest('layout,[this-type="layout"]');
                    }
                    // load templates from store if other pages already exist in history
                    var templates = ext.store.call(this, '___cache')
                            .find(ext.getTemplatePath.call(this));
                    if (!templates) {
                        this.templates = this._('[this-type="templates"][this-app="' +
                                this.container.this('id') + '"]')
                                // put all unloaded element into templates
                                .append(
                                        // hide all types not loaded or default page
                                        //  (models, collections, layouts,
                                        // components, etc)
                                        this.container.find('page:not([this-default-page]),model:not([this-loaded]),'
                                                + 'collection:not([this-loaded]),layout:not([this-loaded]),list:not([this-loaded]),'
                                                + 'component:not([this-loaded]),'
                                                + '[this-type="page"]:not([this-default-page]),'
                                                + '[this-type="model"]:not([this-loaded]),'
                                                + '[this-type="collection"]:not([this-loaded]),'
                                                + '[this-type="layout"]:not([this-loaded]),'
                                                + '[this-type="list"]:not([this-loaded]),'
                                                + '[this-type="component"]:not([this-loaded]),'
                                                + '[this-paginate-next],[this-paginate-previous]'
                                                + '[this-repeat-for]')
                                        .hide()
                                        );
                    }
                    else {
                        templates = this._('<div>').html(templates);
                        // remove loaded templates from cached one
                        if (loaded) templates.find(loaded).remove();
                        this.templates = this._('[this-type="templates"][this-app="'
                                + this.container.this('id') + '"]')
                                .html(templates.children());
                    }
                    // add the remaining page and layouts to cache
                    this.addToCache(this.container
                            .find('page,[this-type="page"],layout,[this-type="layout"]')
                            .removeThis('loaded')
                            .removeThis('default-page')
                            .this('in-container', ''));
                    // remove templates
                    this.container.find('[this-type="templates"]')
                            .remove();
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
                    __.forEach(exps, function (i, v) {
                        v = v.trim();
                        app.tryCatch(function () {
                            content = content.replace(v, eval(v.substr(2, v.length - 4)));
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
                            params = analytics.url ?
                            analytics.url.split('/') : null;
                    if (analytics.model) {
                        // keep attributes for page
                        this.tar['page#' +
                                target_page] = {
                            model: analytics.model,
                            url: analytics.url
                        };
                        if (analytics.url) {
                            this.tar['page#' +
                                    target_page]['url'] = analytics.url;
                            this.tar['page#' +
                                    target_page]['mid'] = params[params.length - 1];
                        }
                        if (analytics.action === 'read') {
                            this.tar['page#' +
                                    target_page]['reading'] = '';
                        }
                        else {
                            this.tar['page#' +
                                    target_page]['do'] = analytics.action;
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
                    var records = this.container ? ext.records[this.container.this('id')] : {};
                    return key ? records[key] : records;
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
                    __.forEach(exps, function (i, v) {
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
                        return __.callable(this.dataTransport)
                                .call(this, __.callable(custom).call(this));
                    }
                    else {
                        // get default request config
                        var config = __.callable(def).call(this);
                        // url exists
                        if (config.url) {
                            var success = __.callable(config.success),
                                    error = __.callable(config.error);
                            delete config.success;
                            delete config.error;
                            // load request
                            this.request(config)
                                    .then(success)
                                    .catch(error);
                        }
                        // url does not exist:
                        else {
                            // run neither function
                            return __.callable(neither).call(this);
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
                                            .siblings('[selected="selected"]')
                                            .prop('selected', false)
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
                    if (ext.config.call(this).titleContainer)
                        ext.config.call(this).titleContainer.html(state.title);
                    ext.record.call(this).store.save(state.url, 'last_page');
                    this.removedAssets = {};
                    this.container.find('[this-type="layout"]')
                            .each(function () {
                                ext.loadAssets.call(app, app._(this));
                            });
                    delete this.pageModel;
                    // page is bound to a model
                    if (this.page.this('mid')) {
                        // save page model for later use in the app
                        new Collection({
                            app: this,
                            name: this.page.this('model')
                        })
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
                    if (!this.page) return;
                    var action = 'pushState';
                    if (replace || this.firstPage)
                        action = 'replaceState';
                    var url = '#/' + this.page.this('id');
                    if (ext.config.call(this).keepParamsInURL && Object.keys(this.params).length)
                        url += '?' + objToQStr(this.params);
                    if (this.__proto__.modelParams && this.__proto__.modelParams.length)
                        url += '/' + crudConnectors[this.pageAction] + '/' + this.__proto__.modelParams.join('/');
                    history[action]({
                        id: this.page.this('id'),
                        title: this.page.this('title'),
                        content: this.container.html(),
                        url: url
                    }, this.page.this('title'), url);
                    ext.record.call(this).store.save(url, 'last_page');
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
                    __.removeArrayIndex(attrs, 0);
                    if (attrs.length)
                        append += '[' + attrs.join('[');
                    return id.length > 1 ? '[this-type="' + id[0] + '"][this-id="' + id[1] + '"]' + append + ',' + id[0] + '[this-id="' + id[1] + '"]' + append : '[this-id="' + id[0] + '"]' + append;
                },
                /**
                 * Setups the app events
                 * @returns ThisApp
                 */
                setup: function (startPage) {
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
                            __.forEach(this.config.paths, function (i, v) {
                                if (__.isString(v) && !v.endsWith('/'))
                                    app.config.paths[i] += '/';
                                else if (__.isObject(v))
                                    if (v.dir && !v.dir.endsWith('/'))
                                        app.config.paths[i].dir += '/';
                            });
                        }
                        // create default function to call when a page isn't found
                        if (!this.notFound)
                            this.notFound = function () {
                                if (app.firstPage) {
                                    var last_page = ext.record.call(app).store.find('last_page');
                                    if (last_page) {
                                        ext.record.call(app).store.remove('last_page');
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
                            this._('body')
                                    .append('<div this-app-container />');
                            this.container = this._('[this-app-container]');
                        }
                        else if (!this.container.this('id'))
                            this.container.this('id', __.randomString())
                                    // mark as auto generated
                                    .this('auto-id', '');

                        // setup record for this app
                        ext.records[this.container.this('id')] = {
                            running: true,
                            secureAPI: this.secap ||
                                    function () {},
                            uploader: this.setup ||
                                    null,
                            config: this.config,
                            // get necessary stores up
                            store: ext.store.call(this, '___records'),
                            createdStore: ext.store.call(this, '___created'),
                            updatedStore: ext.store.call(this, '___updated'),
                            deletedStore: ext.store.call(this, '___deleted'),
                            expirationStore: ext.store.call(this, '___expiration'),
                            paginationStore: ext.store.call(this, '___pagination')
                        };
                        delete this.secap;
                        delete this.setup;
                        // set debug mode
                        ext.record.call(this, 'debug', ext.config.call(this).debug
                                || false);

                        // mark layouts in container as loaded
                        this.container.find('layout,[this-type="layout"]')
                                .this('loaded', '');
                        // set config.startWith as default page if none is set
                        if (!this.config.startWith)
                            this.config.startWith = this.container.find('[this-default-page]')
                                    .this('id');
                        ext.prepareDOMCache.call(this, startPage);
                        ext.emptyFeatures.call(this, this.container);
                        if (this.config.titleContainer)
                            this.config.titleContainer = this._(this.config.titleContainer,
                                    ext.record.call(this, 'debug'));

                        var autocomplete_timeout;
                        this.container
                                .on('click', 'a', function (e) {
                                    if (_(this).attr('href').startsWith('#'))
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
                                                            name = __.removeArrayIndex(attrs, 0);
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
                                            model_id = __this.this('model-id')
                                            || _model.this('mid'),
                                            model_name = __this.this('model')
                                            || _model.this('model') ||
                                            _model.this('id'),
                                            url = __this.this('read')
                                            || _model.this('url') || '#',
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
                                    __this.this('goto', goto + '/#/' + model_name
                                            + '/' + url);
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
                                            model_id = __this.this('model-id')
                                            || model.this('mid'),
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
                                        app.tar['page#'
                                                + pageId]['model-id-key'] = __this.this('model-id-key');
                                    else if (model.this('id-key'))
                                        app.tar['page#' +
                                                pageId]['model-id-key'] = model
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
                                            + __this.this('form') + '"]',
                                            _target = app.container.find(selector)
                                            .removeAttr([
                                                "this-binding", "this-mid",
                                                "this-id-key",
                                                "this-url"
                                            ]),
                                            _tmpl = app.getCached(selector);
                                    _target.html(_tmpl.html());
                                    ext.bindToObject.call(app, _target, {}, function (elem) {
                                        _target.replaceWith(elem);
                                        _target.attr({
                                            "this-do": "create",
                                            "this-action": __this.this('create'),
                                            "this-model": __this.this('model') || '',
                                            "this-model-id-key": __this.this('model-id-key') || '',
                                            "this-binding": ""
                                        }).show();
                                        ext.resetForm.call(this, _target.get(0));
                                        _target.trigger('create.form.cleared');
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
                                            idKey = _model.this('id-key'),
                                            goto = analyzeLink(__this.this('goto')).page,
                                            // necessary in case goto is a url and not an id
                                            pageId = goto.replace(/\/\\/g, '-');
                                    app.tar['page#' + pageId] = {
                                        "do": "delete",
                                        action: url,
                                        "id-key": idKey
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
                                    var tar = _model.this('url') ? 'url:' + _model.this('url') : '';
                                    if (__this.hasThis('read')) {
                                        if (__this.this('read'))
                                            tar = 'url:' + __this.this('read');
                                        app.container.find('[this-model="'
                                                + (_model.this('model')
                                                        || _model.this('id'))
                                                + '"][this-binding]').hide();
                                        _target.removeThis('do');
                                    }
                                    else if (__this.hasThis('update')) {
                                        if (__this.this('update'))
                                            tar = 'url:' + __this.this('update');
                                        tar += ';do:update';
                                    }
                                    else if (__this.hasThis('delete')) {
                                        if (__this.this('delete'))
                                            tar = 'url:' + __this.this('delete');
                                        tar += ';do:delete';
                                        __this.this('treated', '');
                                        setTimeout(function () {
                                            __this.removeThis('treated');
                                        });
                                    }
                                    _target.this('tar', tar);
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
                                            _do.this('mid'),
                                            model;
                                    if (!ext.canContinue
                                            .call(app, 'model.delete',
                                                    [], _model.get(0))) {
                                        return;
                                    }
                                    new Collection({
                                        app: app,
                                        name: __this.this('model') ||
                                                _model.this('model') ||
                                                _model.this('id') ||
                                                _do.this('model'),
                                        idKey: _model.this('id-key') ||
                                                _do.this('id-key')
                                    })
                                            // got collection
                                            .then(function (collection) {
                                                return collection.model(model_id, {
                                                    url: model_url
                                                });
                                            })
                                            // got model
                                            .then(function (model_) {
                                                model = model_;
                                                return model.remove();
                                            })
                                            // removed
                                            .then(function (data) {
                                                var crudStatus = ext.config.call(app).crud.status;
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
                                                        ext.updatePage.call(app, true);
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
                                                _model.trigger('delete.complete', {
                                                    response: this,
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
                                                _model.trigger('delete.complete', {
                                                    response: this,
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
                                    __.forEach(app._(this)
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
                                    __.forEach(__this.this('show').split(','),
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
                                            _list.html('')
                                                    .trigger('list.emptied');
                                        __this.removeThis('last-query');
                                        ext.record.call(app).store.remove('autocompleting');
                                        clearTimeout(autocomplete_timeout);
                                        return;
                                    }
                                    // block searching for same thing multiple times
                                    else if (val === __this.this('last-query')) {
                                        // enter button pressed
                                        if (e.keyCode === 13 && _list.children().length) {
                                            // select the first result from the dropdown list
                                            _list.children(':first-child')
                                                    .trigger('click');
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
                                            type = ext.config.call(app).crud.methods.read;
                                        }
                                        catch (e) {
                                            type = 'get';
                                        }
                                        var success = function (data) {
                                            data = getRealData.call(app, data);
                                            if (!data)
                                                return;
                                            if (!__this.this('id'))
                                                __this.this('id', __.randomString());
                                            _list.this('autocompleting', __this.this('id'))
                                                    .html('')
                                                    .trigger('list.emptied');
                                            ext.fillAutocompleteList
                                                    .call(app, {
                                                        list: _list,
                                                        filter: _list.this('filter'),
                                                        data: data,
                                                        dropdownList: _list,
                                                        ignoreIds: true
                                                    });
                                            ext.record.call(app).store.save(data, 'autocompleting');
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
                                            list = ext.record.call(app).store.find('autocompleting')
                                            || {},
                                            // get the data for the currnt selection
                                            data = list[index] || {};
                                    if (!selectionList) {
                                        if (valueKey) {
                                            // set value of autocomplete as the value of valueKey in data
                                            _input.val(ext.getVariableValue.call(app, valueKey, data));
                                            // selection made: empty the list
                                            _dropDownList.html('')
                                                    .trigger('list.emptied');
                                            // remove autocompletion data
                                            ext.record.call(app).store.remove('autocompleting');
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
                                                    option: elem.get(0),
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
                                            __this.trigger('list.option.removed', {
                                                option: __this.get(0)
                                            }).remove();
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
                                            new Collection({
                                                app: app,
                                                name: __this.this('model')
                                                        || __this.this('id')
                                                        || app.page.this('model')
                                            })
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
                                                            method: method
                                                        });
                                                    })
                                                    // saved
                                                    .then(function (data) {
                                                        var model = getRealData.call(app, data),
                                                                crudStatus = ext.config.call(app).crud.status;
                                                        if (((crudStatus &&
                                                                data[crudStatus.key] ===
                                                                crudStatus.successValue)
                                                                || !crudStatus) && model) {
                                                            if (creating) {
                                                                ext.resetForm.call(app, __this.get(0));
                                                                if (!__this.hasThis('binding')
                                                                        &&
                                                                        !__this.closest('[this-binding]')
                                                                        .length)
                                                                    app.back();
                                                                // hide creation form if binding
                                                                else if (__this.hasThis('binding')) {
                                                                    __this.hide();
                                                                    ext.updatePage.call(app, true);
                                                                }
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
                                                        __this.trigger('form.submission.complete',
                                                                {
                                                                    response: this,
                                                                    method: method.toUpperCase(),
                                                                    create: creating,
                                                                    model: _model
                                                                });
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
                                                        __this.trigger('form.submission.complete',
                                                                {
                                                                    response: this,
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
                                    var fd = new Form(this),
                                            headers = {};
                                    var data = ext.canContinue
                                            .call(app, 'form.send', [headers], this);
                                    if (!data) {
                                        return;
                                    }
                                    else if (__.isObject(data))
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
                                    __.forEach(keys, function (i, key) {
                                        if (filter)
                                            filter += ' || ';
                                        filter += '__.contains(filters.lcase(model#' + key
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
                                        _collection.this('filter', filter)
                                                .this('search', keys.join(','));
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
                                    app.load(_collection);
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
                                    app.load(_collection);
                                })
                                .on('click', '[this-clear-page-cache]', function () {
                                    app.clearPageCache(app._(this).this('clear-page-cache') === 'true');
                                });
                        this.when('page.loaded', 'page', function () {
                            if (!app.page.hasThis('restored'))
                                document.scrollingElement.scrollTop = 0;
                        })
                                .when('component.loaded', 'component', function () {
                                    var elem = app._(this);
                                    // page is already loaded
                                    if (app.pageIsLoaded) {
                                        // load unloaded bits
                                        elem.find('[this-type]:not([this-loaded])')
                                                .each(function (i, v) {
                                                    this.load(v);
                                                }.bind(app));
                                    }
                                })
                                .when('list.emptied, list.no.data', 'list', function () {
                                    _(this).hide();
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
                        __.forEach(this.events, function () {
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
                    var transit = __.callable(ext.config.call(this).transition, true),
                            wait;
                    if (transit)
                        wait = transit.call(null, this.oldPage.removeThis('current'),
                                this.page, ext.config.call(this).transitionOptions);
                    else if (__.isString(ext.config.call(this).transition)) {
                        if (!Transitions[ext.config.call(this).transition])
                            ext.config.call(this).transition = 'switch';
                        this.oldPage = this._(this.oldPage);
                        wait = Transitions[ext.config.call(this).transition](this.oldPage
                                .removeThis('current'),
                                this.page, ext.config.call(this).transitionOptions);
                    }
                    setTimeout(function () {
                        if (this.oldPage)
                            this.oldPage.remove();
                        delete this.oldPage;
                    }.bind(this), __.isNumeric(wait) ? wait : 0);
                    if (ext.config.call(this).titleContainer)
                        ext.config.call(this).titleContainer.html(this.page.this('title'));
                    // this ensures that only expressions and variables for the page
                    // are run
                    ext.emptyFeatures.call(this, this.container);
                    var content = ext.inLoop.call(this, {}, true, this.container.html());
                    content = ext.processExpressions.call(this, content, {}, {});
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
                    __.forEach(notWiths, function (i, v) {
                        elem.find('[this-with="' + i + '"]')
                                .replaceWith(v);
                    });
                },
                /**
                 * Fetches the storage for the given name
                 * @returns {Store}
                 */
                store: function (name) {
                    // container has its own id
                    if (!this.container.hasThis('auto-id'))
                        // use the id with the name
                        name = this.container.this('id') + '.' + name;
                    return name ? new Store(name) : Store;
                },
                /**
                 * Updates a retrieved saved page
                 * @returns ThisApp
                 */
                updatePage: function () {
                    var app = this,
                            deleted = ext.record.call(this).deletedStore.find()
                            || {},
                            created = ext.record.call(this).createdStore.find()
                            || {},
                            updated = ext.record.call(this).updatedStore.find()
                            || {},
                            _collections = this.container.find('collection,'
                                    + '[this-type="collection"]'),
                            _models = this.container.find('model,[this-type="model"],'
                                    + 'page[this-model],[this-type="page"][this-model]'),
                            touched = {
                                deleted: false,
                                created: false,
                                updated: false,
                                back: false,
                                cancel: false
                            };
                    // add created object to collection
                    if (_collections.length) {
                        __.forEach(created, function (model_name, arr) {
                            var _collection = app.container.find('collection[this-model="'
                                    + model_name
                                    + '"],[this-type="collection"][this-model="'
                                    + model_name + '"]');
                            if (!_collection.length)
                                return;
                            // remove the empty marker
                            _collection.children(':not([this-id="' +
                                    _collection.this('model') + '"])')
                                    .remove();
                            touched.created = true;
                            var __collection = ext.store.call(app, model_name),
                                    idKey = __collection.idKey || '';
                            __.forEach(arr, function (i, v) {
                                var _clone = app.getCached('[this-id="'
                                        + _collection.this('id') +
                                        '"]', 'collection'),
                                        action = _collection.this('prepend-new') ?
                                        'prepend' : 'append',
                                        data = __collection.find(v),
                                        idKey = _collection.this('id-key') ||
                                        ext.config.call(app).idKey || 'id',
                                        _data = {};
                                var idKeyParts = idKey.split('.')
                                        .reverse(),
                                        _id = data,
                                        topIdKey = idKeyParts.pop();
                                // add idKey to data
                                $.each(idKeyParts, function (i, v) {
                                    if (!i)
                                        _id[v] = id || index;
                                    else
                                        _id[v] = _id;
                                });
                                _data[topIdKey] = _id;
                                ext.loadCollection.call(app, _clone, function () {
                                    __.removeArrayIndex(arr, i);
                                    _collection[action](_clone.children()
                                            .show());
                                    ext.postLoad.call(app, _clone.children());
                                }, _data);
                            });
                            if (!created[model_name].length) {
                                ext.record.call(app).createdStore.remove(model_name);
                                if (!ext.config.call(app).cacheData)
                                    ext.store.call(app, model_name)
                                            .drop();
                            }
                            else
                                ext.record.call(app).createdStore.save(arr, model_name, true);
                        });
                    }
                    if (_models.length) {
                        // update object elements, whether in collection or standalone
                        __.forEach(updated, function (model_name, arr) {
                            var _model = app.container.find('model[this-id="' +
                                    model_name +
                                    '"],[this-type="model"][this-id="'
                                    + model_name + '"],' +
                                    'collection[this-model="' + model_name
                                    + '"]>model,' +
                                    '[this-type="collection"][this-model="' +
                                    model_name + '"]>[this-type="model"],'
                                    + 'page[this-model="' + model_name +
                                    '"],' + '[this-type="page"][this-model="' +
                                    model_name + '"]'),
                                    in_collection = false;
                            if (!_model.length)
                                return;
                            touched.updated = true;
                            __.forEach(arr, function (id, v) {
                                // update page model if part of update models
                                if (app.pageModel &&
                                        app.pageModel.name === model_name &&
                                        app.pageModel.id === id) {
                                    app.pageModel.__proto__.attributes = __.extend(app.pageModel.attributes, v.data);
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
                                                        + '"]', 'collection');
                                                var idKey = _collection.this('id-key') ||
                                                        ext.config.call(app).idKey || 'id',
                                                        _data = {};
                                                var idKeyParts = idKey.split('.')
                                                        .reverse(),
                                                        _id = v.data,
                                                        topIdKey = idKeyParts.pop();
                                                // add idKey to data
                                                $.each(idKeyParts, function (i, v) {
                                                    if (!i)
                                                        _id[v] = id || index;
                                                    else
                                                        _id[v] = _id;
                                                });
                                                _data[topIdKey] = _id;
                                                ext.loadCollection.call(app, _clone, function () {
                                                    delete arr[id];
                                                    __model.html(_clone.children().html()).show()
                                                            .this('updated', v.timestamp)
                                                            .this('url', _clone.children().this('url'));
                                                    ext.postLoad.call(app, __model);
                                                }, _data);
                                            }
                                            else {
                                                _clone = app.getCached('[this-id="'
                                                        + __model.this('id')
                                                        + '"]', getElemType(__model));
                                                ext.loadModel.call(app, _clone, function () {
                                                    __model.html(_clone.html()).show()
                                                            .this('updated', v.timestamp)
                                                            .this('url', _clone.this('url'));
                                                    ext.postLoad.call(app, __model);
                                                }, v.data);
                                            }
                                        });
                            });
                            if (!Object.keys(updated[model_name]).length) {
                                ext.record.call(app).updatedStore.remove(model_name);
                            }
                            else
                                ext.record.call(app).updatedStore.save(arr, model_name, true);
                        });
                        // delete object elements
                        __.forEach(deleted, function (model_name, arr) {
                            __.forEach(arr, function (i, mid) {
                                var _model = app.container
                                        .find('[this-id="' + model_name
                                                + '"][this-mid="' + mid + '"],'
                                                + '[this-model="' + model_name
                                                + '"][this-mid="' + mid + '"]');
                                if (!_model.length)
                                    return;
                                touched.deleted = true;
                                _model.each(function () {
                                    var __model = app._(this),
                                            _collection = __model.parent();
                                    if (__model.hasThis('in-collection')) {
                                        if (!__model.siblings().length) {
                                            _collection.html(app.getCached('[this-id="'
                                                    + _collection.this('id')
                                                    + '"]', 'collection')
                                                    .children('[this-on-emptied]')
                                                    .removeThis('on-emptied')
                                                    .removeThis('on-empty'));
                                        }
                                        __model.remove();
                                        __.removeArrayIndex(arr, i);
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
                                ext.record.call(app).deletedStore.remove(model_name);
                            }
                            else
                                ext.record.call(app).deletedStore.save(arr, model_name, true);
                        });
                    }

                    if (touched.created || touched.updated || touched.deleted) {
                        ext.saveState.call(this, true);
                        this.container.trigger('dom.updated');
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
                    if (!elem.this('id') || this.watching[elem.this('id')] ||
                            !elem.this('url'))
                        return this;
                    var isCollection = ext.is.call(this, 'collection', elem),
                            model_name = elem.this('model') || elem.this('id');
                    this.watching[elem.this('id')] = {
                        type: isCollection ? 'collection' : 'model',
                        url: elem.this('url'),
                        mid: elem.this('mid')
                    };
                    __.callable(this.watchCallback)(elem.this('url'),
                            function (resp) {
                                // save model to collection
                                switch (resp.event) {
                                    case 'created':
                                        ext.modelToStore.call(this, {
                                            modelName: model_name,
                                            modelId: resp.id,
                                            model: resp.data,
                                            isNew: true
                                        });
                                        /* Remove model idKey if exists to avoid duplicates */
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
                                        data = ext.modelToStore.call(this, {
                                            modelName: model_name,
                                            modelId: id,
                                            model: data,
                                            isNew: false
                                        });
                                        break;
                                    case 'deleted': // XXX use removeFromStore()
                                        var actionStore = ext[resp.event + 'Store'],
                                                action = actionStore.find(model_name)
                                                || [];
                                        ext.store.call(this, model_name)
                                                .remove(resp.id);
                                        /* Indicate model as deleted */
                                        __.removeArrayValue(action, resp.id, true);
                                        action.push(resp.id);
                                        actionStore(action, model_name);
                                        // update current page
                                        ext.updatePage.call(this);
                                        break;
                                }
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
                        var arr = [];
                        __.forEach(str, function (i, v) {
                            arr.push(Filters.__factory(v, options, funcA, funcB));
                        });
                        return arr;
                    }
                    else if (!__.isArray(str)) {
                        options = options ? this.__opts(options) : null;
                        return __.tryCatch(function () {
                            return __.callable(funcA)
                                    .call(this, str, options);
                        }.bind(this),
                                function () {
                                    return __.callable(funcB)
                                            .call(this, str, options);
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
                 * Changes camel case to hyphen case
                 * @param string|array item
                 * @returns string|array
                 */
                camelToHyphen: function (item) {
                    return this.__factory(item, null, function (item) {
                        if (!item || !__.isString(item)) return item;
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
                        if (!item || !__.isString(item)) return item;
                        var _item = item.replace(/([A-Z])/g, function (i) {
                            return '_' + i.toLowerCase();
                        });
                        return this.lcfirst(_item);
                    });
                },
                /**
                 * Capitalizes a string
                 * @param string|array item
                 * @param string options
                 * @returns string|array
                 */
                capitalize: function (item, options) {
                    return this.ucwords(item, options);
                },
                /**
                 * Parses date string or timestamp with the format given format
                 * @param string item
                 * @param string options e.g. D dd-MM-yyyy HH:mm:ss ms
                 */
                date: function (item, options) {
                    if (!item) return item;
                    var smallDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                            longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
                                'Thursday', 'Friday', 'Saturday'],
                            smallMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            longMonths = ['January', 'February', 'March', 'April',
                                'May', 'June', 'July', 'August', 'September',
                                'October', 'November', 'December'],
                            d = new Date(item);
                    if (isNaN(d.getTime()))
                        d = new Date(parseInt(item));
                    var date = d.getDate(),
                            dy = d.getDay() + 1,
                            mon = d.getMonth() + 1,
                            yr = d.getFullYear(),
                            hr = d.getHours(),
                            h = hr % 12,
                            min = d.getMinutes(),
                            sec = d.getSeconds(),
                            msec = d.getMilliseconds(),
                            tzon = d.getTimezoneOffset() ? d.getTimezoneOffset() : 0,
                            tzstr = "GMT";
                    if (tzon) {
                        tzon = -1 * tzon / 60;
                        tzstr += tzon > 0 ? '+' + tzon : '-' + tzon;
                    }
                    var cnv =
                            // day of the week and date
                            'DDDD:' + longDays[dy - 1].toUpperCase() // Full string of day, upper case
                            + ';dddd:' + longDays[dy - 1].toLowerCase() // Full string of day, lower case
                            + ';Dddd:' + longDays[dy - 1] // Full string of day, capitalized
                            + ';DDD:' + smallDays[dy - 1].toUpperCase() // 3 letter string of day, upper case
                            + ';ddd:' + smallDays[dy - 1].toLowerCase() // 3 letter string of day, lower case
                            + ';Ddd:' + smallDays[dy - 1] // 3 letter string of day, capitalized
                            // day of the week with leading zero
                            + ';DD:' + (dy < 10 ? '0' + dy : dy)
                            // date with leading zero
                            + ';dd:' + (date < 10 ? '0' + date : date)
                            + ';D:' + dy // day of the week, no leading zero
                            + ';d:' + date // date, no leading zero
                            // month, minute, millisecond, and meridian status
                            + ';MMMM:' + longMonths[mon - 1].toUpperCase() // Full string of day, upper case
                            + ';Mmmm:' + longMonths[mon - 1] // Full string of day, capitalized
                            + ';mmmm:' + longMonths[mon - 1].toLowerCase() // Full string of day, lower case
                            + ';MMM:' + smallMonths[mon - 1].toUpperCase() // 3 letter string of month, upper case
                            + ';Mmm:' + smallMonths[mon - 1] // 3 letter string of day, capitalized
                            + ';mmm:' + smallMonths[mon - 1].toLowerCase() // 3 letter string of month, lower case
                            // month with leading zero
                            + ';MM:' + (mon < 10 ? '0' + mon : mon)
                            // minute with leading zero
                            + ';mm:' + (min < 10 ? '0' + min : min)
                            // meridian status, lower case
                            + ';mer:' + ((hr - 12) < 0 ? 'am' : 'pm')
                            // meridian status, upper case
                            + ';MER:' + ((hr - 12) < 0 ? 'AM' : 'PM')
                            + ';ms:' + msec // millisecond
                            + ';M:' + mon // month, no leading zero
                            + ';m:' + min // minute, no leading zero
                            // year
                            + ';YYYY:' + yr // 4 character year
                            + ';yyyy:' + yr //        "
                            + ';YY:' + yr % 1000 // 2 character year
                            + ';yy:' + yr % 1000 //       "
                            // hour
                            // 24 hour with leading zero
                            + ';HH:' + (hr < 10 ? '0' + hr : hr)
                            + ';H:' + hr // 24 hour, no leading zero
                            // 12 hour with leading zero
                            + ';hh:' + (h < 10 ? '0' + h : h)
                            + ';h:' + h // 12 hour, no leading zero
                            // second
                            // second with leading zero
                            + ';ss:' + (sec < 10 ? '0' + sec : sec)
                            + ';s:' + sec // second, no leading zero
                            // timezone
                            + ';TZ:' + tzstr // Timezone, upper case
                            + ';tz:' + tzstr.toLowerCase() // Timezone, lower case
                            // timestamp
                            + ';t:' + d.getTime(); // timestamp of date
                    return this.replace(options, cnv);
                },
                /**
                 * Filters items out of the object or array
                 * @param object|array obj
                 * @param string funcName
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
                        if (!item || !__.isString(item)) return item;
                        return item[0].toLowerCase() + item.substr(1);
                    });
                },
                /**
                 * Gets the length of the value if value is object, array or 
                 * string. Returns 0 otherwise.
                 */
                length: function (item) {
                    if (__.isObject(item, true))
                        return Object.keys(item).length;
                    else if (__.isString(item)) return item.length;
                    else return 0;
                },
                /**
                 * Changes the item to lower case
                 * @param string|array item
                 * @returns string|array
                 */
                lowercase: function (item) {
                    return this.__factory(item, null, function (item) {
                        if (!item || !__.isString(item)) return item;
                        return item.toLowerCase();
                    });
                },
                /**
                 * Turns new lines into <br />
                 * @param {string} item
                 */
                nl2br: function (item) {
                    return this.__factory(item, null, function (item) {
                        if (!item || !__.isString(item)) return item;
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
                                forEach(options, function (search, replace) {
                                    search = search.replace(/_/g, '-u-');
                                    str = str.replace(new RegExp(eval(search), 'g'), replace);
                                });
                                return str.replace(/-u-/g, '_');
                            },
                            function (str, options) {
                                if (!str || !__.isString(str))
                                    return str;
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
                        if (!item || !__.isString(item)) return item;
                        var _item = item.replace(/(\_\w)/g, function (w) {
                            if (!w || !__.isString(w)) return w;
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
                        if (!str || !__.isString(str)) return str;
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
                        if (!str || !__.isString(str)) return str;
                        return str.trim();
                    });
                },
                /**
                 * Shortcut to uppercase()
                 * @param {string} item
                 * @returns {Array}
                 */
                ucase: function (item) {
                    return this.uppercase(item);
                },
                /**
                 * Changes the item's first letter to upper case
                 * @param string|array item
                 * @returns string|array
                 */
                ucfirst: function (item) {
                    return this.__factory(item, null, function (item) {
                        if (!item || !__.isString(item)) return item;
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
                ucwords: function (item) {
                    return this.__factory(item, null, function (item) {
                        if (!item || !__.isString(item)) return item;
                        return item.replace(/[^\s]+/g, function (word) {
                            if (!word || !__.isString(word))
                                return word;
                            return word.replace(/^./, function (first) {
                                if (!first || !__.isString(first))
                                    return first;
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
                        if (!item || !__.isString(item)) return item;
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
             * @param {object} props Model properties like name, app (ThisApp), idKey, url,
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
                    idKey: props && props.idKey ? props.idKey : '',
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
                        if (this.idKey)
                            elem.this('id-key', this.idKey);
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
                                            "this-id-key": this.idKey,
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
                            // value is an object or array and key is supplied
                            if (__.isObject(value, true) && key !== undefined) {
                                // key is a callback function
                                if (__.isFunction(key)) {
                                    // default result
                                    var result = null;
                                    // loop through object
                                    __.forEach(value, function (i, v) {
                                        // apply arguments to callback function
                                        // for comparison
                                        var res = key.apply(this, arguments);
                                        // res is `true`
                                        if (res) {
                                            // set v as result
                                            result = v;
                                            // cancel loop
                                            return false;
                                        }
                                    });
                                    // return result
                                    return result;
                                }
                                // key is not a function: get key in value
                                else return value[key] || null;
                            }
                            // no key's supplied
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
                            config = __.extend({}, config);
                            var _this = this;
                            if (!this.app) {
                                console.error('Invalid model object');
                                return reject('Invalid model object');
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
                                            pagination = ext.record.call(this.app).paginationStore.find(this.name);
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
                                                __.removeArrayValue(pagination[page], this.id);
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
                                                                            "this-id-key": this.idKey
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
                                        ext.record.call(this.app).paginationStore.save(pagination, this.name, true);
                                        // collection listing is empty
                                        if (!_collection.children().length) {
                                            // reload collection for current page
                                            this.app.load(_collection.this('pagination-page',
                                                    parseInt(_collection.this('pagination-page'))
                                                    -
                                                    1));
                                        }
                                    }
                                }
                            }.bind(this);
                            if (config.cacheOnly) {
                                ext.store.call(this.app, this.name)
                                        .remove(this.id);
                                done();
                            }
                            else if (this.url || config.url) {
                                var _success = function (data) {
                                    var crudStatus = ext.config.call(app).crud.status;
                                    if ((crudStatus &&
                                            data[crudStatus.key] === crudStatus.successValue)
                                            || !crudStatus) {
                                        if (!_this.app.watchCallback) {
                                            ext.store.call(_this.app, _this.name)
                                                    .remove(_this.id);
                                            var deleted = ext.record.call(_this.app).deletedStore.find(_this.name)
                                                    || [];
                                            /* Indicate model as deleted */
                                            _this.app.__
                                                    .removeArrayValue(deleted, _this.id, true);
                                            deleted.push(_this.id);
                                            ext.record.call(_this.app).deletedStore.save(deleted, _this.name, true);
                                            /* update current page */
                                            ext.updatePage.call(_this.app);
                                            done();
                                        }
                                        if (_this.collection) {
                                            delete _this.collection.models[_this.id];
                                            _this.collection.length--;
                                        }
                                    }
                                    __.callable(config.success)
                                            .call(this, data);
                                    resolve(data);
                                },
                                        _error = function (e) {
                                            __.callable(config.error)
                                                    .call(this, e);
                                            reject(e);
                                        };
                                ext.request.call(this.app, null,
                                        function () {
                                            return {
                                                type: config.method || ext.config.call(app).crud.methods.delete,
                                                url: config.url || this.url,
                                                id: config.id || this.id,
                                                action: 'delete',
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this),
                                        function () {
                                            return {
                                                type: config.method ||
                                                        ext.config.call(app).crud.methods.delete,
                                                url: config.url ||
                                                        _this.url,
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
                                this.app.error('Cannot save an unnamed model.');
                                return reject('Cannot save an unnamed model.');
                            }
                            config = __.extend({}, config);
                            var data = config.data || {},
                                    _data = ext.canContinue
                                    .call(this.app, this.id
                                            ? 'model.update'
                                            : 'model.create',
                                            [data], config.form);
                            if (false === _data) {
                                return reject('Canceled by a before event');
                            }
                            else if (__.isObject(_data)) {
                                data = _data;
                            }
                            // no data
                            if ((!data ||
                                    (__.isObject(data) && !Object.keys(data).length))
                                    // and no form
                                    && !config.form) {
                                this.app.error('No data or form to save');
                                __.callable(config.error).call(this.app);
                                return reject('No data or form to save');
                            }

                            var finalizeSave = function (config, data, removeUploaded) {
                                var _this = this,
                                        method = this.id
                                        ? ext.config.call(app).crud.methods.update
                                        : ext.config.call(app).crud.methods.create,
                                        form = new Form(config.form);
                                form.fromObject(data);
                                if (this.method)
                                    method = this.method;
                                if (this.id && config.cacheOnly) {
                                    /* save model to collection */
                                    var model = ext.modelToStore.call(this.app, {
                                        modelName: this.name,
                                        modelId: this.id,
                                        model: form.toObject(),
                                        isNew: !this.id,
                                        ignoreDom: !(!config.ignoreDOM)
                                    });
                                    return resolve(model);
                                }
                                else if (this.url || config.url) {
                                    var _success = function (data, id) {
                                        if (data) {
                                            var model = getRealData.call(_this.app, data),
                                                    crudStatus = ext.config.call(app).crud.status;
                                            if (((crudStatus &&
                                                    data[crudStatus.key] === crudStatus.successValue)
                                                    || !crudStatus) && model) {
                                                _this.attributes = model;
                                                id = id || ext.getUIDValue
                                                        .call(_this.app, model, _this.idKey);
                                                // Don't cache for update if watching for updates already
                                                if (!_this.app.watchCallback) {
                                                    // save model to collection and set whole data as model
                                                    model = ext.modelToStore
                                                            .call(_this.app, {
                                                                modelName: _this.name,
                                                                modelId: id,
                                                                model: model,
                                                                expireCollection: !_this.id && _this.app.container
                                                                        .find('collection[this-model="'
                                                                                + _this.name + '"],[this-type="collection"][this-model="'
                                                                                + _this.name + '"]').hasThis('paginate'),
                                                                isNew: !_this.id,
                                                                ignoreDom: !(!config.ignoreDOM)
                                                            });
                                                }
                                                // update model's collection
                                                if (_this.collection) {
                                                    _this.collection.models[id] = model;
                                                    _this.collection.length++;
                                                }
                                            }
                                            __.callable(config.success)
                                                    .call(this, data, id);
                                        }
                                        else {
                                            __.callable(config.fail).call(this);
                                        }
                                        resolve(data, id);
                                    },
                                            _error = function (e) {
                                                // remove uploaded files
                                                __.callable(removeUploaded)
                                                        .call(this);
                                                __.callable(config.error)
                                                        .call(this, e);
                                                reject(e);
                                            };
                                    ext.request.call(this.app, config.form,
                                            function () {
                                                return {
                                                    url: config.url || this.url,
                                                    id: this.id,
                                                    form: config.form,
                                                    data: form,
                                                    type: config.method || method,
                                                    success: _success,
                                                    error: _error
                                                };
                                            }.bind(this),
                                            function () {
                                                return {
                                                    type: config.method || method,
                                                    url: config.url || _this.url,
                                                    data: form,
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
                            if (config.form &&
                                    ext.record.call(this.app, 'uploader')) {
                                // get files
                                var files = this.app._(config.form)
                                        .find('input[type="file"]');
                                if (files.length) {
                                    data = data || {};
                                    var _this = this;
                                    // send them to uploader
                                    __.callable(ext.record.call(this.app, 'uploader'))
                                            .call(config.form, {
                                                modelName: this.name,
                                                files: files.items,
                                                data: __.extend(data),
                                                id: this.id,
                                                url: this.url,
                                                done: function (_data, cancelUpload) {
                                                    if (_data === false) {
                                                        __.callable(config.error)
                                                                .call(this.app);
                                                        return;
                                                    }
                                                    else if (__.isObject(_data, true)) {
                                                        data = __.extend(data, _data);
                                                    }
                                                    finalizeSave.call(this, config, data, cancelUpload);
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
             * @param {object} options Object with keys name (of the model), app (ThisApp), 
             * idKey (string), url (string), models (object)
             * @returns {Collection}
             */
            Collection = function (options) {
                // see if data can be gotten from or saved to cache
                if (options.name && !options.ignoreCache) {
                    if (!__.isObject(options.models, true)) {
                        options.models = ext.store.call(options.app, options.name)
                                .find() || [];
                    }
                    else {
                        // save data
                        ext.store.call(options.app, options.name)
                                .save(options.models, options.idKey ||
                                        options.ext.config.call(app).idKey);
                    }
                }
                var _Collection = Object.create({
                    app: options && options.app ? options.app : null,
                    current_index: -1,
                    models: __.isObject(options.models, true) ? options.models : {},
                    name: options && options.name ? options.name : null,
                    idKey: options && options.idKey ? options.idKey : '',
                    url: options && options.url ? options.url : null,
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
                            idKey: this.idKey,
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
                        if (this.idKey)
                            elem.this('model-id-key', this.idKey);
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
                        ext.store.call(this.app, this.name).drop();
                        return this;
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
                            idKey: this.idKey,
                            url: this.url,
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
                     * Fetches the last model in the collection
                     * @returns {Model}
                     */
                    last: function () {
                        return this.get(this.length - 1);
                    },
                    /**
                     * Loads the collection from given url
                     * @param {string} url
                     * @param {object} options
                     * @returns {Promise}
                     */
                    load: function (url, options) {
                        if (url || this.url) {
                            var col = this;
                            return this.app.promise(function (resolve, reject) {
                                this.request(url || col.url)
                                        .then(function (data) {
                                            options = options || {};
                                            var _data = getRealData.call(this, data, options.dataKey);
                                            // reject if _data isn't an object|array
                                            if (!__.isObject(_data, true)) {
                                                __.callable(options.error)
                                                        .call(this, _data);
                                                return reject.call(this, _data);
                                            }
                                            // save to store
                                            if (col.name)
                                                ext.store.call(this, col.name)
                                                        .saveMany(_data, options.idKey || col.idKey);
                                            // set up collection
                                            col.length = Object.keys(_data).length;
                                            col.__proto__.models = _data;
                                            col.__proto__.current_index = -1;
                                            col.__proto__.url = url || col.url;

                                            __.callable(options.success)
                                                    .call(this, col);
                                            resolve.call(this, col);
                                        }.bind(this))
                                        .catch(function () {
                                            __.callable(options.error)
                                                    .call(this, arguments);
                                            reject.call(this, arguments);
                                        });
                            });
                        }
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
                                options = __.extend({
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
                            // not asked to ignore cache
                            if (((ignoreCache && !options.ignoreCache)
                                    // 
                                    || (!ignoreCache && !ext.config.call(app).cacheData === false))
                                    && this.models[model_id]) {
                                var model = __.extend(this.models[model_id]),
                                        _model = new Model(model_id, model, {
                                            name: _this.name,
                                            app: _this.app,
                                            idKey: _this.idKey,
                                            url: url,
                                            collection: this
                                        });
                                delete model.__page;
                                __.callable(options.success).call(this,
                                        _model);
                                return Promise.resolve(_model);
                            }
                            else if (url) {
                                return this.app.promise(function (resolve, reject) {
                                    this.app.request(url)
                                            .then(function (data) {
                                                data = getRealData.call(this.app, data);
                                                if (data && __.isObject(data))
                                                    delete data.__page;
                                                var _model = new Model(model_id, data, {
                                                    name: _this.name,
                                                    app: _this.app,
                                                    idKey: _this.idKey,
                                                    url: url,
                                                    collection: this
                                                });
                                                __.callable(options.success)
                                                        .call(this,
                                                                _model);
                                                resolve(_model);
                                            }.bind(this))
                                            .catch(function (e) {
                                                __.callable(options.error)
                                                        .call(this, e);
                                                reject(e);
                                            }.bind(this));
                                }.bind(this));
                            }
                        }
                        var _model = new Model(null, null, {
                            name: this.name,
                            app: this.app,
                            idKey: this.idKey,
                            url: url,
                            collection: this
                        });
                        __.callable(options.success)
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
                            var _options = __.extend({}, options),
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
                                __.callable(options.success)
                                        .apply(this, arguments);
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
                            ext.store.call(this.app, this.name)
                                    .drop();
                            ext.record.call(this.app).paginationStore.remove(this.name);
                            ext.record.call(this.app).expirationStore.remove(this.name);
                            this.models = {};
                            this.length = 0;
                            return Promise.resolve();
                        }
                        else {
                            return this.app.promise(function (resolve, reject) {
                                var _this = this,
                                        _success = function (data) {
                                            if (!_this.app.watchCallback)
                                                ext.store.call(_this.name)
                                                        .drop();
                                            _this.models = {};
                                            _this.length = 0;
                                            __.callable(config.success)
                                                    .call(_this, data);
                                            resolve(data);
                                        },
                                        _error = function (e) {
                                            __.callable(config.error)
                                                    .call(_this, e);
                                            reject(e);
                                        };
                                ext.request.call(this.app, null,
                                        function () {
                                            return {
                                                url: this.url,
                                                type: config.method ||
                                                        ext.config.call(app).crud.methods.delete,
                                                success: _success,
                                                error: _error
                                            };
                                        }.bind(this),
                                        function () {
                                            return {
                                                url: this.url,
                                                type: config.method ||
                                                        ext.config.call(app).crud.methods.delete,
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
                _Collection.length = __.isObject(options.models, true) ?
                        Object.keys(options.models).length : 0;
                _Collection.parent = _Collection.__proto__;
                return !_Collection.length && options.url
                        ? _Collection.load(options.url, options)
                        : Promise.resolve(_Collection);
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
            this.config = __.extend(this.config, config, true);
        // set default error function
        this.error = function (msg) {
            ext.log.call(this, 'error', msg);
            return this;
        };
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
             * Default idKey for models and collections if not explicitly defined
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
         * Elements being watched for updates
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                var _this = this;
                this._(elem).each(function () {
                    var _elem = _this._(this).clone().removeThis('loaded');
                    if (_elem.this('type') === 'layout')
                        _elem.find('[this-content]').html('');
                    _elem.find('style').each(function () {
                        _this._(this).replaceWith('<div this-type="style">'
                                + this.innerText + '</div>');
                    });
                    // remove existing cache
                    _this.templates.find(elemToSelector(_elem, {
                        ignore: ['tag'],
                        attrs: ['this-type', 'this-id', 'this-url']
                    })).remove();
                    _this.templates.append(_elem.outerHtml());
                });
                // save templates to store if page has already been loaded
                // because all templates would already have been stored then.
                if (this.pageIsLoaded) {
                    ext.store.call(this, '___cache')
                            .save(this.templates.html(), ext.getTemplatePath.call(this), true);
                }
                return this;
            });
        },
        /**
         * Takes the app back one step in history
         * @returns ThisApp
         */
        back: function (e) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                if (e && __.isObject(e) && e['preventDefault'])
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
                __.forEach(event.split(','), function (i, v) {
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return Promise.reject('App not started yet!');
            }
            return this.promise(function (resolve) {
                ext.bindToObject.call(this, this._(elem), object, function (_elem) {
                    elem.replaceWith(_elem);
                    resolve.apply(this, arguments);
                    __.callable(callback).apply(this, arguments);
                }.bind(this));
            });
        },
        /**
         * Checks whether the page has a previous page it can go back to
         */
        canGoBack: function () {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return history.length > 2;
        },
        /**
         * Clears the cache of all models and collections on the current page
         * @param {boolean} reload Indicates that the elements attached to these
         * models and collections should be reloaded
         * @returns {ThisApp}
         */
        clearPageCache: function (reload) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            var app = this,
                    did_page = false;
            this.container.find('collection,[this-type="collection"],model:not([this-in-collection]),'
                    + '[this-type="model"]:not([this-in-collection])')
                    .each(function () {
                        var __this = app._(this),
                                name = __this.this('model') || __this.this('id');
                        ext.store.call(app, name).drop();
                        if (__this.this('type') === 'page') {
                            did_page = true;
                            return;
                        }
                        // reload element if page's model collection has
                        // not been cleared. Otherwise, don't. Reloading
                        // page would take care of that.
                        if (reload && !did_page) {
                            app.load(__this);
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
         * @param {string} modelName
         * @param {object} options Keys include url (string), data (object|array),
         * success (function), error (function), idKey (string), dataKey (string)
         * @returns {Promise}
         */
        collection: function (modelName, options) {
            if (!ext.isRunning.call(this)) {
                __.callable(options.error).call('App not started yet!');
                return Promise.reject('App not started yet!');
            }
            return this.tryCatch(function () {
                options = options || {};
                options.app = this;
                options.name = modelName;
                return new Collection(options);
            });
        },
        /**
         * Sets the app debug mode
         * @param boolean mode Default is TRUE
         * @returns ThisApp
         */
        debug: function (mode) {
            if (!ext.isRunning.call(this))
                this.config.debug = mode === undefined ? true : mode;
            return this;
        },
        /**
         * Fills an autocomplete list with the data given
         * @param {_}|{string} list
         * @param {object} data
         * @param {string} idKey
         * @param {string} filter
         * @returns {array} Array of ids added to the list
         */
        fillAutocompleteList: function (list, data, idKey, filter) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return [];
            }
            list = __.isString(list) ?
                    this.container.find('[this-id="' + list + '"]') : this._(list);
            var _dropdownList = list.this('autocompleting') ? list :
                    this.container.find('list[this-id="'
                            + list.this('parent-list') +
                            '"],[this-type="list"][this-id="'
                            + list.this('parent-list') +
                            '"]');
            return ext.fillAutocompleteList.call(this, {
                list: list,
                data: data,
                idKey: idKey,
                filter: filter,
                dropdownList: _dropdownList
            });
        },
        /**
         * Takes the app forward one step in history
         * @returns ThisApp
         */
        forward: function (e) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                if (e && __.isObject(e) && e['preventDefault'])
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
         * Fetches a clone of the required elements from the cache collection
         * @param {string}|{_} selector
         * @param {string} type The type of element to get. This is the value of
         * the `this-type` of the target element. The attribute is created and 
         * appended to the selector.
         * @returns {_}
         */
        getCached: function (selector, type) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this._();
            }
            return this.tryCatch(function () {
                var _this = this,
                        elem = this._();
                if (__.isObject(selector)) {
                    var attrs = ["this-id", "this-type", "this-model"];
                    // don't check `this-model` for bounded non-page element
                    if (selector.hasThis('binding')
                            && selector.this('type') !== 'page') {
                        __.arrayRemoveIndex(2);
                    }
                    selector = elemToSelector(selector, {
                        attrs: attrs,
                        ignore: ["class"]
                    });
                }
                if (type) {
                    var seltr = '';
                    __.forEach(selector.split(','), function (i, v) {
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
                    __.forEach(selector.split(','), function (i, v) {
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
                // not found in page cache
                if (!elem.length) {
                    // check templates directly
                    elem = this.templates.children(selector);
                    // not found
                    if (!elem.length) {
                        // check in components
                        elem = this.template.find('component>' + selector
                                + ',[this-type="component"]>' + selector);
                    }
                    // return empty element if loading first page and debugging
                    // This ensures that a fresh copy is loaded
                    if (this.firstPage && ext.config.call(this).debug
                            && !elem.hasThis('in-container'))
                        return this._();
                }
                elem = elem.clone();
                if (elem.this('type') === 'template') elem.removeThis('type');
                elem.find('[this-type="style"]').each(function () {
                    _this._(this).replaceWith('<style>' + this.innerText + '</style>');
                });
                ext.emptyFeatures.call(_this, elem);
                return this._(elem.outerHtml());
            });
        },
        /**
         * Returns the app to the home page
         * @param {Boolean} replaceState Indicates that the current state should
         * be replaced instead of creating a new one
         * @returns ThisApp
         */
        home: function (replaceState) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                this.loadPage(ext.config.call(this).startWith ||
                        this.getCached('[this-default-page]', 'page')
                        .this('id'), replaceState);
                return this;
            });
        },
        /** 
         * Loads an element (collection, model, component, or layout)
         * @param {HTMLElement}|{_}|{string} elem
         * @param {Object} data
         * @param {Function} callback
         * @returns {ThisApp}
         */
        load: function (elem, data, callback) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                __.callable.call(this, null, 'App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                var _this = this;
                this._(elem).each(function () {
                    var type = getElemType(_this._(this)),
                            method = 'load' + type[0].toUpperCase() + type.substr(1),
                            valid = __.inArray(type.toLowerCase(),
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                var last_page = ext.record.call(this).store.find('last_page');
                // cancel loading the same page again
                if (!pageIDorPath || ((last_page === pageIDorPath || last_page === '#/' + pageIDorPath)
                        && !this.firstPage))
                    return this;
                if (this.page && !ext.canContinue
                        .call(this, 'page.leave', [], this.page.items[0]))
                    return this;
                pageIDorPath = ext.pageIDFromLink.call(this, pageIDorPath, true);
                if (!ext.canContinue.call(this, 'page.load', [pageIDorPath]))
                    return this;
                this.oldPage = _();
                var newPage = this.getCached('[this-id="' + pageIDorPath + '"]', 'page');
                if (newPage.length > 1) {
                    this.error('Target page matches multiple pages!');
                    return this;
                }
                else if (!newPage.length) {
                    var paths = ext.config.call(this).paths;
                    if (paths && paths.pages) {
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
                    if (__.isFunction(selector)) {
                        callback = selector;
                        selector = null;
                    }
                    if (this.page) {
                        var evt = event.replace(/[^a-z0-9]/gi, ''),
                                pageID = this.page.this('id');
                        if (selector)
                            evt += selector.replace(/[^a-z0-9]/gi, '');
                        if (!containedEvents[evt]) {
                            // event has not been handled at all before
                            containedEvents[evt] = {};
                            var _this = this;
                            // use custom event dispatcher to enable dispatching
                            // only events registered for the current page
                            if (selector)
                                this.container.on(event, selector, function () {
                                    return ext.dispatchEvent.call(_this, evt, this, Array.from(arguments));
                                });
                            else this.container.on(event, function () {
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
                else this.events.push({
                        event: event,
                        selector: selector,
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
            if (!ext.isRunning.call(this)) {
                this.error = function (message) {
                    __.callable(callback, true).call(this, message);
                };
            }
            return this;
        },
        /**
         * Sets up the function to call when a page is not found
         * @param {function}|{string} callback or id of page to load
         * @returns {ThisApp}
         */
        pageNotFound: function (callback) {
            if (!ext.isRunning.call(this)) {
                this.notFound = callback;
            }
            return this;
        },
        /*
         * Creates a promise while ensuring the function's context is ThisApp
         * @returns {Promise}
         */
        promise: function (func) {
            return this.tryCatch(function () {
                return new Promise(function (resolve, reject) {
                    __.callable(func).call(this, resolve, reject);
                }.bind(this));
            });
        },
        /**
         * Reloads the current page
         * @param {Boolean} layoutsToo Indicates whether to reload all layouts as well.
         * @returns {ThisApp}
         */
        reload: function (layoutsToo) {
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                var last_page = ext.record.call(this).store.find('last_page');
                ext.record.call(this).store.remove('last_page');
                this.reloadLayouts = layoutsToo || false;
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return Promise.reject('App not started yet!');
            }
            return this.tryCatch(function () {
                if (!__.isObject(config)) {
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
                else if (__.isObject(url)) {
                    url = url.this('url');
                }
                if (!url.startsWith('./') && !url.startsWith('../') &&
                        !url.startsWith('//') && url.indexOf('://') === -1) {
                    url = ext.config.call(this).baseURL + url;
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
                        __.callable(success).apply(this, arguments);
                        resolve.apply(this, arguments);
                    }.bind(this);
                    config.error = function () {
                        __.callable(error).apply(this, arguments);
                        reject.apply(this, arguments);
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
            if (!ext.isRunning.call(this)) {
                this.error('App not started yet!');
                return this;
            }
            return this.tryCatch(function () {
                if (id) {
                    var selector = '', _this = this;
                    __.forEach(id.split(','), function (i, v) {
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
                        _selectedList.html('').hide().trigger('list.emptied');
                        _dropdownList.removeThis('selected').html('').hide().trigger('list.emptied');
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
            this.config.paths.components = {
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
            this.config.paths.css = path;
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
         * The success callback takes three params (data [required], id [optional], idKey [optional])
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
            this.config.paths.js = path;
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
            this.config.paths.layouts = {
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
            this.config.paths.pages = {
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
                if (!__.isFunction(newStore)) {
                    this.error('Store must be funtion which returns a store object on the given collection name.');
                }
                else {
                    var testStore = newStore('___test');
                    if (!__.isObject(testStore)) {
                        this.error('Store must return a collections object');
                    }
                    else if (!__.isFunction(testStore.find) ||
                            !__.isFunction(testStore.save) ||
                            !__.isFunction(testStore.saveMany) ||
                            !__.isFunction(testStore.remove) ||
                            !__.isFunction(testStore.drop)) {
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
            // set startwith in config if page is specified
            if (page)
                this.config.startWith = page;
            var hash = location.hash,
                    // get target page from hash
                    target_page = ext.processLink.call(this, hash),
                    // get default page
                    default_page = this.config.startWith || _('[this-default-page]').this('id'),
                    // set start page
                    start_page = target_page ? target_page : default_page;
            this._('body').find('page[this-id="' + default_page
                    + '"],[this-type="page"][this-id="' + default_page + '"]')
                    .this('default-page', '');
            this.firstPage = true;
            ext.setup.call(this, start_page);
            // load from old state if fresh copy not required and not debugging
            if (!freshCopy && !this.config.debug && history.state &&
                    start_page === ext.recordsStore.find('last_page')) {
                ext.restoreState.call(this, history.state);
            }
            else {
                this.loadPage((hash && hash !== '#' && hash !== '#/') ? hash : start_page);
            }
            return this;
        },
        /**
         * Fetches the store object for the given collection
         * @param string collection
         * @returns {Store}
         */
        store: function (collection) {
            if (!ext.isRunning.call(this)) {
                return this.error('App is not started yet!');
            }
            return this.tryCatch(function () {
                return ext.store.call(this, collection);
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
            return __.tryCatch(function () {
                return __.callable(tryFunc).call(this);
            }.bind(this),
                    function (e) {
                        this.error(e);
                        if (catchFunc)
                            __.callable(catchFunc).call(this, e);
                        return this;
                    }.bind(this));
        },
        /**
         * Sets a function to call to watch for server side changes to model collections
         * @param {function} callback Function would be passed 3 parameters - url, success callback
         * and error callback
         * @returns {ThisApp}
         */
        watch: function (callback) {
            if (!ext.isRunning.call(this)) {
                this.watchCallback = callback;
            }
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