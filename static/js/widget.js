$(document).ready(function ($) {
    let first_slide = $('.first');
    let second_slide = $('.second');
    let total = $('.total');
    let online = $('.online');

    function updatePlayers() {
        $.ajax({
            url: `${window.location.protocol}//api.${window.location.hostname}/v1/get_player_count`,
            type: 'GET',
        }).done(function(data) {
            total.html(data['counts']['total']);
            online.html(data['counts']['online']);
        });
    }
    updatePlayers();

    setInterval(function () {
        updatePlayers();

        if (first_slide.css("marginLeft") == '-320px') {
            first_slide.css({'margin-left': '0px'});
        } else {
            first_slide.css({'margin-left': '-320px'});
        }
    }, 12000);
});
