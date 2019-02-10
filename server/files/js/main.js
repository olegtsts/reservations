$(function () {
    goog.require('proto.Organization');
    new State({
        ...new Reservations({
            'id': 'reservartions',
            'initial_state': 'start',
            'organization_id': 'test_org',
            'container': function () {
                return $('#container');
            },
        }).get_states(),
    });
});
