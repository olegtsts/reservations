function do_something() {
    $.ajax({
        url: '/ajax',
        method: 'POST',
        data: {
            smth: 1
        },
        success: function(result) {
            alert(result.response);
        }
    });
}

$(function () {
    new State({
        ...get_menu_states({
            'id': 'test',
            'container': function () {
                return $('#container');
            },
            'write_to': 'menu_result',
            'initial_state': 'start',
            'final_state': 'test_menu_result',
            'options': [
                {
                    'id': 'first',
                    'name': 'First',
                },
                {
                    'id': 'second',
                    'name': 'Second',
                },
            ],
        }),
        'test_menu_result': new Combine([
            new Executer(function (context) {
                alert(context.menu_result);
            }),
            new GoTo({
                'type': 'next',
                'new_state': 'start',
            }),
        ]),
    });
});
