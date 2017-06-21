var app = new ThisApp({
    crud: {
        status: {
            successValue: 200
        }
    }
}),
        _ = function (selector) {
            return app._(selector);
        },
        _c = function (selector) {
            return selector ? app.container.find(selector) : app.container;
        },
        store = function (key, value) {
            if (value === undefined) return localStorage.getItem(key);
            else if (value === null) return localStorage.removeItem(key);
            return localStorage.setItem(key, value);
        };
app.debug(true)
        .setDefaultLayout('main')
        .onError(function (msg) {
            var _error = app._('#error').html(msg).removeClass('hidden');
            setTimeout(function () {
                _error.addClass('hidden');
            }, 4000);
        })
        .secureAPI(function (headers, data) {
            var ssn = app.store('ssn').find(1);
            if (ssn && ssn.k) headers['X-API-TOKEN'] = ssn.k;
        })
        .setBaseURL('http://localhost:2403/')
        .before('form.send', function () {
            _(this).find('[type="submit"]').addClass('hidden')
                    .siblings().removeClass('hidden');
            _(this).closest('.modal-body').siblings('.modal-footer')
                    .addClass('hidden');
        })
        .when('page.loaded', 'page', function () {
            // only if page is freshly loaded
            if (!app.loadedPartial) {
                // allow reset password - part 2
                if (app.params.rpswd) {
                    delete app.params.rpswd;
                    if (app.params.token) {
                        $(_c('#reset-password-2.modal').get(0)).modal('show')
                                .find('[name="token"]').val(app.params.token);
                        delete app.params.token;
                    }
                }
                // show email verification status
                else if (app.params.ev !== undefined) {
                    var message = 'Email verified successfully',
                            type = 'alert-success';
                    if (app.params.ev == 0) {
                        message = 'Email verification failed.';
                        type = 'alert-danger';
                    }
                    else if (app.params.ev == 1) {
                        message = 'Email already verified.';
                        type = 'alert-info';
                    }
                    $(_c('#login-email-password.modal').get(0)).modal('show')
                            .find('.modal-footer').removeClass('hidden')
                            .children().addClass(type).html(message);
                    delete app.params.ev;
                }

                var ssn = app.store('ssn').find(1),
                        noUser = function () {
                            if (store('exited')) {
                                // show login modal
                                $(_c('#login.modal').get(0)).modal('show')
                                        .find('.modal-footer').removeClass('hidden')
                                        .children().addClass('alert-info')
                                        .html('Session expired');
                                store('exited', null);
                            }
                            _c('li.btn.auth').removeClass('hidden');
                            _c('li.btn.account').addClass('hidden');
                            app.store('ssn').drop();
                        },
                        watchToken = function (ssn, minutesBefore) {
                            // end time minus 10 minutes
                            var e = ssn.e - Date.now() - minutesBefore * 60 * 1000,
                                    // try to renew token
                                    renewToken = function () {
                                        // send request
                                        app.request({
                                            type: 'post',
                                            url: 'user/renew-token',
                                            data: {
                                                id: ssn.i
                                            }
                                        })
                                                .then(function (resp) {
                                                    // got new data
                                                    if (resp.status === 200) {
                                                        ssn = {
                                                            e: resp.data.expires,
                                                            i: ssn.i,
                                                            k: resp.data.apiKey,
                                                            v: resp.data.verified
                                                        };
                                                        app.store('ssn')
                                                                .save(ssn, 1, true);
                                                        // start watching all over again
                                                        watchToken(ssn, minutesBefore);
                                                    }
                                                    // no data
                                                    else noUser();
                                                })
                                                // error: no user
                                                .catch(noUser);
                                    };
                            // there's still time before expiration
                            if (e > 0) {
                                return setTimeout(renewToken, e);
                            }
                            // try renewal right away
                            else renewToken();
                        };
                if (ssn && ssn.e > Date.now()) {
                    app.request('user/me')
                            .then(function (resp) {
                                if (resp.status === 200) {
                                    _c('li.btn.auth').addClass('hidden');
                                    _c('li.btn.account').removeClass('hidden');
                                    // watch token and reset 10 minutes before expiration
                                    watchToken(ssn, 10);
                                }
                                else noUser();
                            })
                            .catch(noUser);
                }
                else noUser();
            }
            $('[data-toggle="tooltip"]').tooltip();
        })
        .on('click', '.input-group-addon', function () {
            var _password = _(this).siblings();
            if (_password.attr('type') === 'password') {
                _password.attr('type', 'text');
                _(this).html('hide');
            }
            else {
                _password.attr('type', 'password');
                _(this).html('show');
            }
        })
        .on('form.submission.success form.submission.error form.submission.failed', 'form',
                function (e) {
                    var resp = e.detail.responseData,
                            _modal = _(this).closest('.modal'),
                            _alert = _modal.find('.modal-footer').children(),
                            _submit = _(this).find('img[alt="loading"]').addClass('hidden')
                            .siblings().removeClass('hidden');
                    // error
                    if (resp.status !== 200) {
                        var message = resp.message;
                        if (resp.errors) {
                            message = '<ul>';
                            app.__.forEach(resp.errors, function (i, v) {
                                message += '<li><strong>' + i + '</strong> ' + v + '</li>';
                            });
                            message += '</ul>';
                        }
                        _alert.removeClass('alert-success alert-info')
                                .addClass('alert-danger')
                                .html(resp ? message.replace('username', 'email')
                                        : 'No internet connection');
                    }
                    // success
                    else {
                        var message = 'Sign up successful. Please check your email for confirmation.';
                        switch (_modal.attr('id')) {
                            case 'login-email-password':
                                var url = './admin/';
                                if (app.params.r)
                                    url += decodeURIComponent(app.params.r);
                                app.store('ssn').save({
                                    k: resp.data.apiKey,
                                    i: resp.data.uid,
                                    v: resp.data.verified,
                                    e: resp.data.expires
                                }, 1);
                                app.store('ssn').save({
                                    id: resp.data.uid
                                }, 'u');
                                // redirect to user page
                                location.href = url;
                                _submit.addClass('hidden').siblings()
                                        .removeClass('hidden');
                                return;
                            case 'reset-password':
                                message = 'Password reset email sent.';
                                break;
                            case 'reset-password-2':
                                message = 'Password reset successfully.';
                                break;
                            case 'resend-verification-email':
                                message = 'Verification email resent.';
                                break;
                        }
                        $(_modal.get(0)).modal('hide');
                        _modal = _c('#login-email-password.modal');
                        _alert = _modal.find('.modal-footer').children();
                        _alert.removeClass('alert-danger alert-info')
                                .addClass('alert-success').html(message);
                        this.reset();
                        $(_modal.get(0)).modal('show');
                    }
                    _alert.parent().removeClass('hidden');
                })
        .start('home', true);
$('.modal').on('hide.bs.modal', function () {
    $(this).find('.modal-footer').addClass('hidden');
});
