function Reservations(params) {
    this.params = params;
    this.month_names = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    this.weekday_names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    this.daypart_names = [
        "Night",
        "Morning",
        "Afternoon",
        "Evening",
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
    this.reservlet_name = {};
    for (var i = 0; i < reservlets.length; ++i) {
        this.reservlet_time[reservlets[i].getId()] = {};
        this.reservlet_name[reservlets[i].getId()] = reservlets[i].getName();
    }
    var now = this.truncate_time(new Date().getTime() / 1000 + 3600);
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
    return date.getDate() + " " + this.month_names[date.getMonth()] + ", " + this.weekday_names[date.getDay()];
}

Reservations.prototype.get_large_day_name = function(time) {
    date = new Date(time * 1000);
    return date.getDate() + " " + this.month_names[date.getMonth()] + "<br>" + this.weekday_names[date.getDay()];
}

Reservations.prototype.wrapped_constant_height_text = function(text) {
    return '<div style="height:80px ">' +
        '<div style="margin: 0; position: relative; top: 50%; left: 50%; ' +
        '-ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%);">' + text + '</div></div>';

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
            'name': this.wrapped_constant_height_text(this.get_large_day_name(day_start_time)),
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

Reservations.prototype.get_daypart = function(time) {
    var day_start = this.truncate_to_day(time);
    return Math.min(Math.max(Math.floor((time - day_start) / 3600 / 6), 0), 3);
}

Reservations.prototype.get_hour_minutes_string = function(time) {
    var date = new Date(time * 1000);
    return date.getHours() + '.' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
}

Reservations.prototype.get_available_hours_string = function(hourly_timestamps) {
    var _this = this;
    var segments = [];
    for (var i = 0; i < hourly_timestamps.length; ++i) {
        var timestamp = parseInt(hourly_timestamps[i]);
        if (segments.length > 0 && segments[segments.length - 1][1] + 3600 == timestamp) {
            segments[segments.length - 1][1] = timestamp;
        } else {
            segments.push([timestamp, timestamp]);
        }
    }
    return segments.map(function(segment) {
        return _this.get_hour_minutes_string(segment[0]) + ' - ' + _this.get_hour_minutes_string(segment[1] + 3600 - 1);
    }).join('<br>');
}

Reservations.prototype.get_daypart_menu_builder = function() {
    var _this = this;
    return new Combine([
        new Executer(function (context) {
            var reservlets_count = Object.keys(_this.reservlet_time).length;
            var time_options = [];
            for  (var current_time = parseInt(context.day_choice);
                  _this.truncate_to_day(current_time) <= _this.truncate_to_day(parseInt(context.day_choice));
                  current_time += 3600) {
                if (_this.time_reservlet[current_time] !== undefined &&
                    Object.keys(_this.time_reservlet[current_time]).length < reservlets_count) {
                    time_options.push(current_time);
                }
            }
            var dayparts_available_times = {};
            for (var i = 0; i < 4; ++i) {
                dayparts_available_times[i] = [];
            }
            for (var i = 0; i < time_options[i]; ++i) {
                var time_option = time_options[i];
                dayparts_available_times[_this.get_daypart(time_option)].push(time_option);
            }
            _this.daypart_options = [{
                'id': 'back',
                'name': _this.wrapped_constant_height_text('Back')
            }];
            for (var i = 0; i < 4; ++i) {
                _this.daypart_options.push({
                    'id': i,
                    'name': _this.wrapped_constant_height_text(
                        _this.daypart_names[i] + '<br><font size="2">' + _this.get_day_name(parseInt(context.day_choice)) +
                            '</font><br><font size="1">' + _this.get_available_hours_string(dayparts_available_times[i]) + '</font>'),
                    'disabled': dayparts_available_times[i].length == 0,
                });
            }
        }),
        new GoTo({
            'type': 'next',
            'new_state': this.params.id + '::daypart_menu',
        })
    ]);
}

Reservations.prototype.get_reservlet_menu_builder = function() {
    var _this = this;
    return new Combine([
        new Executer(function (context) {
            if (context.daypart_choice != 'back') {
                var day = parseInt(context.day_choice)
                var daypart = parseInt(context.daypart_choice);
                var time_options = [];
                for  (var current_time = day;
                      _this.truncate_to_day(current_time) == day;
                      current_time += 3600) {
                    if (_this.get_daypart(current_time) == daypart) {
                        time_options.push(current_time);
                    }
                }
                var reservlets = Object.keys(_this.reservlet_time);
                _this.reservlet_options = [{
                    'id': 'back',
                    'name': _this.wrapped_constant_height_text('Back')
                }];
                for (var i = 0; i < reservlets.length; ++i) {
                    var reservlet = reservlets[i];
                    var available_times = [];
                    for (var j = 0; j < time_options.length; ++j) {
                        var current_time = time_options[j];
                        if (_this.reservlet_time[reservlet][current_time] === undefined) {
                            available_times.push(current_time);
                        }
                    }
                    _this.reservlet_options.push({
                        'id': reservlet,
                        'name': _this.wrapped_constant_height_text(_this.reservlet_name[reservlet] +
                            '<br><font size="2">' + _this.get_day_name(day) +
                            '<br><font size="1">' +
                            _this.get_available_hours_string(available_times) +
                            '</font>'),
                        'disabled': available_times.length == 0,
                    });
                }
            }
        }),
        new GoTo({
            'type': 'next',
            'new_state': function(context) {
                if (context.daypart_choice == 'back') {
                    return _this.params.id + '::day_menu';
                } else {
                    return _this.params.id + '::reservlet_menu';
                }
            }
        })
    ]);
}

Reservations.prototype.debug_outputter = function() {
    var _this = this;
    return new Combine([
        new Executer(function (context) {
            if (context.reservlet_choice != 'back') {
                alert(context.reservlet_choice);
            }
        }),
        new GoTo({
            'type': 'next',
            'new_state': function(context) {
                if (context.reservlet_choice == 'back') {
                    return _this.params.id + '::daypart_menu';
                } else {
                    return _this.params.id + '::reservlet_menu';
                }
            }
        })
    ]);
}

Reservations.prototype.get_states = function() {
    var _this = this;
    states = {};
    states[this.params.initial_state] = this.get_reservations_loader();
    states[this.params.id + '::build_day_menu'] = this.get_day_menu_builder();
    states[this.params.id + '::build_daypart_menu'] = this.get_daypart_menu_builder();
    states[this.params.id + '::build_reservlet_menu'] = this.get_reservlet_menu_builder();
    states[this.params.id + '::build_starttime_menu'] = this.debug_outputter();
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
        }).get_states(),
        ...new Menu({
            'id': this.params.id + '_daypart_menu',
            'container': this.params.container,
            'write_to': 'daypart_choice',
            'initial_state': this.params.id + '::daypart_menu',
            'final_state': this.params.id + '::build_reservlet_menu',
            'options': function (context) {
                return _this.daypart_options;
            },
        }).get_states(),
        ...new Menu({
            'id': this.params.id + '_reservlet_menu',
            'container': this.params.container,
            'write_to': 'reservlet_choice',
            'initial_state': this.params.id + '::reservlet_menu',
            'final_state': this.params.id + '::build_starttime_menu',
            'options': function (context) {
                return _this.reservlet_options;
            },
        }).get_states()
    };
}
