function Menu(params) {
    this.params = params;
}

Menu.prototype.get_menu_buttons_html = function(context) {
    var buttons_html = '<div class="col-6 offset-3 col-lg-2 offset-lg-5" style="margin-top:15%">';
    var options = call_or_get(this.params.options, context);
    for (var i = 0; i < options.length; ++i) {
        var option = options[i];
        var button_color_class = option.disabled ? 'btn-secondary' : 'btn-default';
        var disabled_string = option.disabled ? 'disabled' : '';
        buttons_html += '<div><button style="border: 5px solid; border-color:#AAAAAA;" type="button" class="btn badge-pill ' + button_color_class + ' btn-block btn-lg options_' + this.params.id + '" name="' +
            option.id + '" id="' + this.params.id + '_' + option.id + '"' + disabled_string + '>' + option.name + '</button> </div><br>';
    }
    buttons_html += '</div>'
    return buttons_html;
}

Menu.prototype.get_menu_builder = function() {
    var _this = this;
    return new Combine([
        new Builder({
            'container': this.params.container,
            'func': function (context, container) {
                container.append(`
                    <div class="text-center">
                        ` + _this.get_menu_buttons_html(context) + `
                    </div>
                `);
            },
        }),
        new Executer(function (context) {
            $(window).scrollTop(0);
        }),
        new GoTo({
            'new_state': this.params.id + '::listen',
            'type': 'substate',
        })
    ]);
}

Menu.prototype.get_button_target = function() {
    var _this = this;
    return function () {
        return $('.options_' + _this.params.id);
    }
}

Menu.prototype.get_menu_binder = function() {
    return new Binder({
        'target': this.get_button_target(),
        'action': 'click',
        'type': 'next',
        'write_to': 'pressed_button',
        'new_state': this.params.id + '::write_result',
    });
}

Menu.prototype.get_menu_result_writer = function() {
    var _this = this;
    return new Combine([
        new Executer(function (context) {
            context.parent[_this.params.write_to] = context.pressed_button.attr('name');
        }),
        new GoTo({
            'type': 'exit_state',
            'new_state': this.params.final_state,
        }),
    ]);
}

Menu.prototype.get_states = function() {
    var menu_states = {};
    menu_states[this.params.initial_state] = this.get_menu_builder();
    menu_states[this.params.id + '::listen'] = this.get_menu_binder();
    menu_states[this.params.id + '::write_result'] = this.get_menu_result_writer();
    return menu_states;
}
