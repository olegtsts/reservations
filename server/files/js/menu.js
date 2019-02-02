function get_menu_buttons_html(params) {
    var buttons_html = '<div class="col-6 offset-3" style="margin-top:50%">';
    for (var i = 0; i < params.options.length; ++i) {
        var option = params.options[i];
        buttons_html += '<div><button type="button" class="btn btn-primary btn-block btn-lg" name="' + option.id + '" id="' + params.id + '_' + option.id + '">' + option.name + '</button> </div><br>';
    }
    buttons_html += '</div>'
    return buttons_html;
}

function get_menu_builder(params) {
    return  new Combine([
        new Builder({
            'container': params.container,
            'func': function (context, container) {
                container.append(`
                    <div class="text-center">
                        ` + get_menu_buttons_html(params) + `
                    </div>
                `);
            },
        }),
        new GoTo({
            'new_state': params.id + '::listen',
            'type': 'substate',
        })
    ]);
}

function get_button_target(params, option) {
    return function () {
        return $('#' + params.id + '_' + option.id);
    }
}

function get_menu_binders(params) {
    var binders = [];
    for (var i = 0; i < params.options.length; ++i) {
        var option = params.options[i];
        binders.push(new Binder({
            'target': get_button_target(params, option),
            'action': 'click',
            'type': 'next',
            'write_to': 'pressed_button',
            'new_state': params.id + '::write_result',
        }));
    }
    return new Combine(binders);
}

function get_menu_result_writer(params) {
    return new Combine([
        new Executer(function (context) {
            context.parent[params.write_to] = context.pressed_button.attr('name');
        }),
        new GoTo({
            'type': 'exit_state',
            'new_state': params.final_state,
        }),
    ]);
}

function get_menu_states(params) {
    var menu_states = {};
    menu_states[params.initial_state] = get_menu_builder(params);
    menu_states[params.id + '::listen'] = get_menu_binders(params);
    menu_states[params.id + '::write_result'] = get_menu_result_writer(params);
    return menu_states;
}
