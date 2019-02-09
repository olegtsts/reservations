function Menu(params) {
    this.params = params;
}

Menu.prototype.get_menu_buttons_html = function() {
    var buttons_html = '<div class="col-6 offset-3 col-lg-2 offset-lg-5" style="margin-top:15%">';
    for (var i = 0; i < this.params.options.length; ++i) {
        var option = this.params.options[i];
        buttons_html += '<div><button type="button" class="btn btn-primary btn-block btn-lg" name="' +
            option.id + '" id="' + this.params.id + '_' + option.id + '">' + option.name + '</button> </div><br>';
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
                        ` + _this.get_menu_buttons_html() + `
                    </div>
                `);
            },
        }),
        new GoTo({
            'new_state': this.params.id + '::listen',
            'type': 'substate',
        })
    ]);
}

Menu.prototype.get_button_target = function(option) {
    var _this = this;
    return function () {
        return $('#' + _this.params.id + '_' + option.id);
    }
}

Menu.prototype.get_menu_binders = function() {
    var binders = [];
    for (var i = 0; i < this.params.options.length; ++i) {
        var option = this.params.options[i];
        binders.push(new Binder({
            'target': this.get_button_target(option),
            'action': 'click',
            'type': 'next',
            'write_to': 'pressed_button',
            'new_state': this.params.id + '::write_result',
        }));
    }
    return new Combine(binders);
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

Menu.prototype.get_menu_states = function() {
    var menu_states = {};
    menu_states[this.params.initial_state] = this.get_menu_builder();
    menu_states[this.params.id + '::listen'] = this.get_menu_binders();
    menu_states[this.params.id + '::write_result'] = this.get_menu_result_writer();
    return menu_states;
}
