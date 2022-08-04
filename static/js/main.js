// @ts-check
// sticky header
$(window).scroll(() => {
    var header = document.getElementById("navbar");
    if (!header) return
    var sticky = header.offsetTop;

    if (window.pageYOffset > sticky) {
        header.classList.add("minimized");
    } else {
        header.classList.remove("minimized");
    }
});

//toggle navbar for mobile
function togglenavbar() {
    const navbar = document.getElementById('navbar')
    navbar && navbar.classList.toggle("is-active");
    const burger = document.getElementById('navbar-burger')
    burger && burger.classList.toggle("is-active");
}

function setStyle(el, obj) {
    Object.entries(obj).forEach(([k, v]) => {
        el.style[k] = v
    })
}

function searchUser() {
    _testGlobals(
        { exists: ['domain'] }
    )
    const search = document.getElementById('u-search')
    if (!search) return
    const value = search.value
    const content = document.getElementById('u-search-content')
    content && (content.innerHTML = "");
    $.get('//osu.' + window.domain + '/search?q=' + value, function (data, status) {
        if (data != '{}') {
            content && content.removeAttribute('style')
            $.each(data, function (e, n) {
                const result = ({
                    title: n.name,
                    url: "/u/" + n.id,
                    image: '//a.' + window.domain + '/' + n.id
                })
                const root = document.createElement('a')
                root.href = result.url
                root.className = 'navbar-item'
                const image = document.createElement('img')
                image.src = result.image
                setStyle(image, {
                    width: '3rem',
                    maxHeight: '3rem',
                    backgroundSize: 'cover',
                    borderRadius: '0.5em'
                })
                root.appendChild(image)
                const textSpan = document.createElement('span')
                setStyle(textSpan, {
                    marginLeft: '5px',
                    fontWeight: 700,
                    fontSize: '1.2em',
                    color: 'rgba(255,255,255,0.9)'
                })
                textSpan.innerText = result.title
                root.appendChild(textSpan)
                content && content.appendChild(root)
            })
        } else {
            content && setStyle(content, {
                display: 'none'
            })
        }
    })
}

function admin_search() {
    const search = document.getElementById('search-bar')
    if (!search) return
    window.location.href = '/admin/users?search=' + search.value
}

function map_admin_search(name) {
    const search = document.getElementById('search-bar')
    if (!search) return
    window.location.href = '/admin/beatmaps/search?' + name + '=' + search.value
}

function map_admin_force_update(sid) {
    _testGlobals(
        { exists: ['domain', 'api_key'] }
    )
    var bar = document.getElementById('progress_bar')
    var elements = document.getElementsByClassName('operate-button');
    bar && bar.removeAttribute('style')
    Array.prototype.forEach.call(elements, function (element) {
        element.classList.add('is-disabled')
    });
    $.get('//api.' + window.domain + '/update_beatmapsets?api_key=' + window.api_key + '&sid=' + sid, function (data, status) {
        bar && setStyle(bar, {
            display: 'none'
        })
        Array.prototype.forEach.call(elements, function (element) {
            element.classList.remove('is-disabled')
        });
        if (status == 'success') {
            window.location.href = '/admin/beatmaps/search?sid=' + data['sid']
        }
    })
}
