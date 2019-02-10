function Reservations(params) {
    this.params = params;
    this.month_names = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
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
        'write_to': 'organization_data',
        'type': 'next',
        'new_state': this.params.id + '::build_day_menu',
    });
}

Reservations.prototype.truncate_time = function(time) {
    return time - time % 3600;
}

Reservations.prototype.setup_reservations = function(organization) {
    var reservlets = organization.getReservletList()
    var reservations = organization.getReservationList()
    this.reservlet_time = {};
    for (var i = 0; i < reservlets.length; ++i) {
        this.reservlet_time[reservlets[i].getId()] = {};
    }
    var now = this.truncate_time(new Date().getTime() / 1000);
    var now_after_week = now + 3600 * 24 * 7;
    this.time_reservlet = {};
    for (var current_time = now; current_time < now_after_week; current_time += 3600) {
        this.time_reservlet[current_time] = {};
    }
    for (var i = 0; i < reservations.length; ++i) {
        var reservation = reservations[i];
        var first_time = this.truncate_time(reservation.getTimeFrom());
        var second_time = this.truncate_time(reservation.getTimeTo());
        var reservlet_id = reservation.getReservletId();
        for (var current_time = first_time; current_time <= second_time; current_time += 3600) {
            if (this.reservlet_time[reservlet_id] !== undefined) {
                this.reservlet_time[reservlet_id][current_time] = 1;
            }
            if (this.time_reservlet[current_time] !== undefined) {
                this.time_reservlet[current_time][reservlet_id] = 1;
            }
        }
    }
}

Reservations.prototype.truncate_to_day = function(time) {
    date = new Date(time * 1000);
    return time - (time - date.getTimezoneOffset() * 60) % (3600 * 24);
}

Reservations.prototype.get_day_name = function(time) {
    date = new Date(time * 1000);
    return date.getDate() + " " + this.month_names[date.getMonth()];
}

Reservations.prototype.setup_day_options = function() {
    var days_info = {};
    var all_times = Object.keys(this.time_reservlet).sort();
    var reservlets_count = Object.keys(this.reservlet_time).length;
    for (var i = 0; i < all_times.length; ++i) {
        var current_time = all_times[i];
        var is_time_free = (Object.keys(this.time_reservlet[current_time]).length < reservlets_count);
        var day_start_time = this.truncate_to_day(current_time);
        if (days_info[day_start_time] === undefined) {
            days_info[day_start_time] = {
                'is_day_free': false,
            }
        }
        days_info[day_start_time]['is_day_free'] |= is_time_free;
    }
    this.day_options = [];
    var day_start_times = Object.keys(days_info).sort();
    for (var i = 0; i < day_start_times.length; ++i) {
        var day_start_time = day_start_times[i];
        this.day_options.push({
            'id': day_start_time,
            'name': this.get_day_name(day_start_time),
            'disabled': !days_info[day_start_time]['is_day_free']
        });
    }
}

Reservations.prototype.get_day_menu_builder = function() {
    var _this = this;
    return new Combine([
        new Executer(function (context) {
            var organization = proto.Organization.deserializeBinary(new TextEncoder().encode(context.organization_data));
            _this.setup_reservations(organization);
            _this.setup_day_options();
        }),
        new GoTo({
            'type': 'next',
            'new_state': this.params.id + '::day_menu',
        })
    ]);
}

Reservations.prototype.get_daypart_menu_builder = function() {
    return new Combine([
        new Executer(function (context) {
            alert(context.day_choice);
        }),
        new GoTo({
            'type': 'next',
            'new_state': this.params.id + '::day_menu',
        })
    ]);
}

Reservations.prototype.get_states = function() {
    var _this = this;
    states = {};
    states[this.params.initial_state] = this.get_reservations_loader();
    states[this.params.id + '::build_day_menu'] = this.get_day_menu_builder();
    states[this.params.id + '::build_daypart_menu'] = this.get_daypart_menu_builder();
    return {
        ...states,
        ...new Menu({
            'id': this.params.id + '_day_menu',
            'container': this.params.container,
            'write_to': 'day_choice',
            'initial_state': this.params.id + '::day_menu',
            'final_state': this.params.id + '::build_daypart_menu',
            'options': function (context) {
                return _this.day_options;
            },
        }).get_states()
    };
}
