var tm;
app.on('click', '#add-service a', function () {
    var _tr = _(this).closest('tr'),
            _before = _tr.before();
    if (!_before.this('index'))
        _before.this('index', 1);
    _before.find('a.remove').removeClass('hidden');
    var _clone = _before.clone();
    _clone.this('index', parseInt(_clone.this('index')) + 1)
            .find('th>span').html('#' + _clone.this('index'));
    _clone.find('input,textarea').val('');
    _tr.before(_clone);
    _clone.find('input').get(0).focus();
})
        .on('click', '.remove', function () {
            var _tr = _(this).closest('tr');
            // current row has at least the more button row and another service row
            if (_tr.siblings().length >= 2) {
                var _after = _tr.after(),
                        index = parseInt(_tr.this('index'));
                _tr.remove();
                while (_after.attr('id') !== 'add-service') {
                    _after.this('index', index)
                            .find('th>span').html('#' + index);
                    _after = _after.after();
                    index++;
                }
            }
            else {
                _tr.this('index', 1).find('input,textarea').val('');
                _(this).addClass('hidden');
            }
        })
        .on('click', '[data-toggle="collapse"]', function () {
            var _panel = _(this).closest('.panel');
            if (_panel.hasClass('panel-info')) {
                _panel.addClass('panel-primary').removeClass('panel-info')
                        .siblings().removeClass('panel-primary').addClass('panel-info');
            }
            else {
                _panel.removeClass('panel-primary').addClass('panel-info');
            }
        })
        .on('click', '[type="submit"]', function () {
            tm = setTimeout(showErrorMessage, 500, 'Some fields contain invalid and/or empty values!');
        })
        .on('submit', 'form', function () {
            clearTimeout(tm);
        });

function fill() {
    _c('[name="name"]').val('DScribe Technologies');
    _c('[name="motto"]').val('Giving it to you real');
    _c('[name="contact[Phone #1]"]').val('08035163756');
    _c('[name="contact[Phone #2]"]').val('08053926767');
    _c('[name="contact[email]"]').val('support@dscribe-it.com');
    _c('[name="lga"]').val('Ikorodu');
    _c('[name="city"]').val('Ikorodu');
    _c('[name="state"]').val('Lagos');
    _c('#add-service a').trigger('click');
    _c('table tr:not(#add-service)').each(function () {
        _(this).find('input').val('Service #' + _(this).this('index'));
        _(this).find('textarea').val('Service #' + _(this).this('index') + ' description.');
    });
}
fill();