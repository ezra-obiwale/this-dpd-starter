var app = new ThisApp({
    modelUID: '_id.$oid',
    pagination: {
        limit: 24
    }
}),
        _ = function (selector) {
            return app._(selector);
        },
        _c = function (selector) {
            return selector ? app.container.find(selector) : app.container;
        };
app.debug(true)
        .setDefaultLayout('main')
        .setBaseURL('http://localhost:2403/')
        .before('form.send', function () {
            _(this).find('[type="submit"]').addClass('hidden')
                    .siblings().removeClass('hidden');
            _(this).closest('.modal-body').siblings('.modal-footer')
                    .addClass('hidden');
        })
        .when('page.loaded', 'page', function () {
            // only if page is freshly loaded
            if (!app.restored) {
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
            }
            dpd.users.me().then(function (user) {
                if (user) {
                    _c('li.btn.login').addClass('hidden');
                    _c('li.btn.account').removeClass('hidden');
                }
                else {
                    if (app.store('xeca')) {
                        // show login modal
                        $(_c('#login.modal').get(0)).modal('show')
                                .find('.modal-footer').removeClass('hidden')
                                .children().addClass('alert-info')
                                .html('Session expired');
                        app.store('xeca', null);
                    }
                    _c('li.btn.login').removeClass('hidden');
                }
            });
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
        .on('form.submission.success form.submission.error form.submission.failed', 'form', function (e) {
            var data = e.detail.responseData,
                    _modal = _(this).closest('.modal'),
                    _alert = _modal.find('.modal-footer').children(),
                    _submit = _(this).find('img[alt="loading"]').addClass('hidden')
                    .siblings().removeClass('hidden');
            // error
            if (data && data.status) {
                var message = data.message;
                if (data.errors) {
                    message = '<ul>';
                    app.__.forEach(data.errors, function (i, v) {
                        message += '<li><strong>' + i + '</strong> ' + v + '</li>';
                    });
                    message += '</ul>';
                }
                _alert.removeClass('alert-success alert-info')
                        .addClass('alert-danger').html(data ? message.replace('username', 'email') : 'No internet connection');
            }
            // success
            else {
                var message = 'Sign up successful. Please check your email for confirmation.';
                switch (_modal.attr('id')) {
                    case 'login-email-password':
                        var url = './admin/';
                        if (app.params.r)
                            url += decodeURIComponent(app.params.r);
                        // redirect to user page
                        location.href = url;
                        _submit.addClass('hidden').siblings().removeClass('hidden');
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