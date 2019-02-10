function Reservations(params) {
    this.params = params;
}

Reservations.prototype.get_reservations_loader = function() {
    var _this = this;
    return new SendQuery({
        'url': '/get_all_reservations',
        'ajax_data': function() {
            return {
                'organization_id': _this.params.organization_id,
            };
        },
        'write_to': 'reservations_data',
        'type': 'next',
        'new_state': this.params.id + '::build_menu',
    });
}

Reservations.prototype.get_menu_builder = function() {
    return new Executer(function (context) {
        reservations = proto.Organization.deserializeBinary(new TextEncoder().encode(context.reservations_data));
        console.log(reservations.toObject());
    });
}

Reservations.prototype.get_states = function() {
    states = {};
    states[this.params.initial_state] = this.get_reservations_loader();
    states[this.params.id + '::build_menu'] = this.get_menu_builder();
    return states;
}
