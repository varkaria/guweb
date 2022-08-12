function searchMaps() {
    const search = document.getElementById('search-bar')
    if (!search) return
    if (search.value == '') window.location.href = '/admin/beatmaps'
    else window.location.href = '/admin/beatmaps/search/' + search.value
}