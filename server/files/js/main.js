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
