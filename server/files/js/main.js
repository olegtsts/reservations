$(function () {
    goog.require('proto.Organization');
    var message = new proto.Organization.Reservlet();
    message.setName('123');
    console.log(message.toObject());
    new State({
        ...new Menu({
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
        }).get_menu_states(),
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
