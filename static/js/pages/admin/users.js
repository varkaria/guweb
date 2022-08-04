function searchUsers() {
    const search = document.getElementById('search-bar')
    if (!search) return
    if (search.value == '') window.location.href = '/admin/users'
    else window.location.href = '/admin/users/search/' + search.value
}