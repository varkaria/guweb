function searchMaps() {
    const search = document.getElementById('search-bar')
    if (!search) return
    if (search.value == '') window.location.href = '/admin/beatmaps'
    else window.location.href = '/admin/beatmaps/search/' + search.value
}

function updateMaps(sid) {
    _testGlobals(
        { exists: ['domain', 'api_key'] }
    )
    var bar = document.getElementById('progress_bar')
    var elements = document.getElementsByClassName('operate-button');
    bar && bar.removeAttribute('style')
    Array.prototype.forEach.call(elements, function (element) {
        element.classList.add('is-disabled')
    });
    $.get('//api.' + window.domain + '/update_maps?api_key=' + window.api_key + '&id=' + sid, function (data, status) {
        bar && setStyle(bar, {
            display: 'none'
        })
        Array.prototype.forEach.call(elements, function (element) {
            element.classList.remove('is-disabled')
        });
        if (status == 'success') {
            window.location.href = '/admin/beatmaps/search/' + data['sid']
        }
    })
}