/**
 * Toggle navbar for mobile.
 */
function toggleNavbar() {
    document.getElementById('navbar').classList.toggle("is-active");
    document.getElementById('navbar-burger').classList.toggle("is-active");
}

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('.navbar-item.has-dropdown').click(function () {
        $(this)
            .children('.navbar-dropdown')
            .toggle(500);
    });
}
