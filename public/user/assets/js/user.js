// ThisApp
function showErrorMessage(msg, hide) {
    clearTimeout(timeout);
    _c('.alert').removeClass('alert-success alert-info')
            .addClass('alert-danger')
            .html(msg).removeClass('hidden');
    if (false !== hide)
        hideMessage(hide || 7000);
}
function showSuccessMessage(msg, hide) {
    clearTimeout(timeout);
    _c('.alert').removeClass('alert-danger alert-info')
            .addClass('alert-success')
            .html(msg).removeClass('hidden');
    if (false !== hide)
        hideMessage(hide);
}
function showInfoMessage(msg, hide) {
    clearTimeout(timeout);
    _c('.alert').removeClass('alert-danger alert-success')
            .addClass('alert-primary')
            .html(msg).removeClass('hidden');
    if (hide)
        hideMessage(hide);
}
function hideMessage(tm) {
    if (tm === false) {
        _c('.alert').addClass('hidden');
        return;
    }
    timeout = setTimeout(function () {
        _c('.alert').addClass('hidden');
    }, tm || 5000);
}
var app = new ThisApp({
    pagination: {
        limit: 1
    },
    dataKey: null,
    cacheData: false
}),
        // for hiding messages
        timeout,
        // holds previous page menu link. Needed for reactivation when new page not found
        formerLink,
        // holds the starting touch object
        touchStart,
        _ = function (selector) {
            return app._(selector);
        },
        _c = function (selector) {
            return selector ? app.container.find(selector) : app.container;
        };
app.__.ready(function () {
    _(window).on('beforeunload', function () {
        $('.modal').modal('hide');
    });
    _('body').on('click', '.sidebar-toggle', function () {
        if (_('body').hasClass('sidebar-collapse')) {
            app.store('close_sidebar', null);
        }
        else
            app.store('close_sidebar', true);
    });
    if (app.store('close_sidebar')) {
        _('body').addClass('sidebar-collapse');
    }
});
dpd.users.me().then(function (currentUser) {
    // only continue if not logged out
    if (currentUser) {
        $(window).resize(function () {
            $('#trans-bg').height($(document).height());
        });
        app.onError(function (msg) {
            var _error = _('#error').html(msg).removeClass('hidden');
            setTimeout(function () {
                _error.addClass('hidden');
            }, 4000);
        })
                .debug(true)
                .setDefaultLayout('page')
                .setDataTransport(function (options) {
                    switch (options.action) {
                        case 'read':
                            dpd[options.on].get().then(function (data) {
                                if (!data.status) {
                                    options.success(data, data.id);
                                }
                                else {
                                    options.error(data);
                                }
                            }).fail(options.error);
                            break;
                        case 'post':
                        case 'patch':
                        case 'post':
                            dpd[_(options.form).this('model')][options.action](options.data.toObject())
                                    .then(function (data) {
                                        options.success(data, data.id);
                                        setTimeout(function () {
                                            app.loadPage(app.store('prev_page'));
                                        });
                                    }).fail(function (resp) {
                                var message = resp.message;
                                if (resp.errors) {
                                    message = '<ul>';
                                    app.__.forEach(resp.errors, function (i, v) {
                                        message += '<li><strong>' + i + '</strong> ' + v + '</li>';
                                    });
                                    message += '</ul>';
                                }
                                showErrorMessage(message || 'No internet connection');
                            });
                            break;
                        case 'delete':
                            break;
                    }
                })
                .before('page.leave', function () {
                    $('.modal').modal('hide');
                    hideMessage(false);
                    app.store('prev_page', app.page.this('id'));
                })
                .when('page.loaded', 'page', function () {
                    $(window).resize();
                    _c('aside [this-goto="' + app.page.this('id') + '"]')
                            .parent().addClass('active')
                            .siblings().removeClass('active');
                })
                .when('page.leave', 'page', function () {
                    _('.page-loading.overlay').removeClass('hidden');
                })
                .on('page.not.found', function (e) {
                    _('.page-loading.overlay').addClass('hidden');
                    showErrorMessage('Page <strong>' + e.detail.pageId.toUpperCase()
                            + '</strong> Not Found!', 2500);
                    _(formerLink).addClass('active').siblings().removeClass('active');
                })
                .on('form.invalid.submission', function () {
                    showErrorMessage('Form contains some invalid and/or empty fields');
                })
                .on('form.submission.error, delete.error', function (e)
                {
                    showErrorMessage('Unable to connect to the server');
                    setTimeout(function () {
                        app.container.find('[this-mid="'
                                + e.detail.model.id + '"]:not(.modal)')
                                .css('opacity', 1)
                                .find('.btn,.list-group')
                                .show();
                    });
                })
                .on('form.submission.failed', function (e) {
                    showErrorMessage('Submission failed!<p>' + e.detail.responseData.message + '</p>');
                })
                .on('form.submission.success', function () {
                    $(this).closest('.modal').modal('hide');
                    showSuccessMessage('Data saved successfully!');
                })
                .on('delete.failed', function (e) {
                    showErrorMessage('Delete failed!');
                    app.container.find('[this-mid="'
                            + e.detail.model.id + '"]:not(.modal)')
                            .css('opacity', 1)
                            .find('.btn,.list-group')
                            .show();
                })
                .on('delete.success', function () {
                    $(this).closest('.modal').modal('hide');
                    showSuccessMessage('Delete successful!');
                })
                .on('model.binded,model.loaded,cache.model.loaded', function () {
                    $(this).find('img').error(function () {
                        $(this).attr('src', '../assets/images/no-image.png');
                    });
                })
                .on('click', 'a[href="#"]', function (e) {
                    e.preventDefault();
                })
                .on('click', '.sidebar-menu a', function () {
                    var _li = _(this).parent();
                    formerLink = _li.siblings('.active');
                    _li.addClass('active')
                            .siblings().removeClass('active');
                })
                .on('click', '.logout', function (e) {
                    dpd.users.logout(function () {
                        app.store('xeca', true);
                        location.href = '../';
                    });
                })
                .on('click', '#app-name>div', function () {
//                _c('ul.nav-pills').toggleClass('hidden-sm');
                })
                // pictures gallery start
                .on('click', '[this-id="pictures"] a', function () {
                    _(this).parent().addClass('active').siblings().removeClass('active');
                    var _preview = app.container.find('[this-id="picture_preview"]'),
                            _li = _(this).closest('li'),
                            before = _li.before().get(0);
                    _preview.find('img').attr('src', _(this).children('img').attr('src'));
                    _preview.find('.description').html(_(this).children('div').html()).show();
                    if (_li.before().length) {
                        _preview.find('.slide.previous').show();
                    }
                    else {
                        _preview.find('.slide.previous').hide();
                    }
                    if (_li.after().length) {
                        _preview.find('.slide.next').show();
                    }
                    else {
                        _preview.find('.slide.next').hide();
                    }
                    if (before)
                        _li.closest('.horizontal-scroll').get(0).scrollLeft = before.offsetLeft;
                    _preview.find('input#keystroke').get(0).focus();
                })
                .on('keydown', '#keystroke', function (e) {
                    if (e.keyCode === 39) { // go to next
                        _(this).siblings('.slide.next').trigger('click');
                    }
                    else if (e.keyCode === 37) { // go to previous
                        _(this).siblings('.slide.previous').trigger('click');
                    }
                    else if (e.keyCode === 27) { // close preview pane
                        _(this).siblings('.close').trigger('click');
                    }
                    // clear entry
                    _(this).val('');
                })
                .on('click', '#services a', function () {
                    var _modal = app.container.find(_(this).attr('data-target'));
                    _modal.find('.modal-header span').html(_(this).children('.title').html());
                    _modal.find('.modal-body').html(_(this).children('.description').html());
                })
                .on('click', '[this-id="picture_preview"] .slide', function () {
                    var _curLi = _(this).closest('[this-id="picture_preview"]')
                            .siblings('[this-id="pictures"]').find('li.active');
                    if (_(this).hasClass('next')) {
                        _curLi.after().find('a').trigger('click');
                    }
                    else {
                        _curLi.before().find('a').trigger('click');
                    }
                })
                .on('click', '[this-id="picture_preview"] img', function (e) {
                    _('input#keystroke').get(0).focus();
                })
                .on('touchstart', '[this-id="picture_preview"] img', function (e) {
                    // only target single touch events
                    if (e.changedTouches.length > 1)
                        return;
                    e.preventDefault();
                    touchStart = e.changedTouches[0];
                })
                .on('touchend', '[this-id="picture_preview"] img', function (e) {
                    // only target single touch events
                    if (e.changedTouches.length > 1)
                        return;
                    e.preventDefault();
                    var _curLi = _(this).closest('[this-id="picture_preview"]')
                            .siblings('[this-id="pictures"]').find('li.active');
                    if (touchStart.clientX < e.changedTouches[0].clientX) {
                        // show previous slide
                        _curLi.before().find('a').trigger('click');
                    }
                    else if (touchStart.clientX > e.changedTouches[0].clientX) {
                        // show next slide
                        _curLi.after().find('a').trigger('click');
                    }
                })
                .on('click', '[this-id="picture_preview"] a.close', function () {
                    app.container.find('[this-id="pictures"] li.active').removeClass('active');
                })
                // picture gallery ends
                .on('click', '[data-target="#form"]', function () {
                    _('#form.modal .modal-title').html(_(this).attr('title'));
                })
                .on('click', '[this-form]', function () {
                    var last_country_id = app.store('last_country_id');
                    if (!last_country_id)
                        return;
                    app.container
                            .find('[this-id="' + _(this).attr('this-form') + '"] #country_id')
                            .val(last_country_id);
                })
                // show only modal in container
                .on('click', '[data-toggle="_modal"]', function () {
                    var $modal = $(app.container.find(_(this).data('target')).get(0)).modal('show');
                    $modal.find('[type="file"]').previewMedia().addClass('hidden');
                    $modal.find('img:not(.actionable)').on('click', function () {
                        $(this).addClass('actionable').siblings('[type="file"]').click();
                    });
                    $modal.find('input,textarea,select,.btn').focus();
                })
                .on('click', '#delete.modal [this-delete]', function () {
                    var _modal = _(this).closest('.modal');
                    app.container.find('[this-mid="'
                            + _modal.attr('this-mid') + '"]:not(form):not(.modal)')
                            .css('opacity', .4)
                            .find('.btn,.list-group')
                            .hide();
                })
                .setUploader(function (options) {
                    var fd = new FormData(), title;
                    _(options.files).each(function () {
                        fd.append(this.name, this.files[0]);
                    });
                    if ($(this).attr('id') === 'player-form') {
                        title = $(this).find('#first_name').val() + ' ' + $(this).find('#last_name').val();
                    }
                    else {
                        title = $(this).find('#name').val();
                    }
                    fd.append('title', title);
                    fd.append('path', options.modelName);
                    app.request({
                        type: 'post',
                        url: 'files/',
                        data: fd,
                        success: function (resp) {
                            var data = {};
                            if (resp.status) {
                                if (Object.keys(resp.data.errors).length) {
                                    showErrorMessage('Upload failed for ' + Object.keys().join(', ') + '!');
                                    options.done(false);
                                }
                                else {
                                    app.__.forEach(resp.data.success, function (name, value) {
                                        data[name] = value[0] + '?' + Date.now();
                                    });
                                    options.done(data);
                                }
                            }
                            else {
                                showErrorMessage('Upload failed!');
                                options.done(false);
                            }
                        },
                        error: function (e) {
                            showErrorMessage(e.responseText);
                            options.done(false);
                        }
                    });
                })
                .start('dashboard', true);

        var $container = $(app.container.get(0));
        $container.on('click', '[data-target="#delete"]', function () {
            $('#delete.modal #deleting').html($(this).data('deleting'));
        })
                .on('hide.bs.modal', function () {
                    app.resetAutocomplete($(this).find('[this-autocomplete]').attr('this-id'));
                    $(this).find('img.actionable').removeClass('actionable')
                            .unbind('click').attr('src', '../assets/images/no-image.png');
                });
        $container.tooltip({
            selector: '[data-toggle="tooltip"]',
            container: 'body'
        });
    }
    else {
        location.href = '../';
        app.store('xeca', true);
    }
});