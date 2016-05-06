$(document).ready(function() {
    $('.header .mobile_menu .icon .link').click(function(event) {
        $('.header .mobile_menu .list').toggle(500);

        event.stopPropagation();
        return false;
    });
});