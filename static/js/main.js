// sticky header
$(window).scroll(() => {
    var header = document.getElementById("navbar");
    var sticky = header.offsetTop;

    if (window.pageYOffset > sticky) {
        header.classList.add("minimized");
    } else {
        header.classList.remove("minimized");
    }
});

//toggle navbar for mobile
function togglenavbar() {
    document.getElementById('navbar').classList.toggle("is-active");
    document.getElementById('navbar-burger').classList.toggle("is-active");
}

function search() {
    const value = document.getElementById('u-search').value
    document.getElementById('u-search-content').innerHTML = "";
    $.get('//osu.' + the_domain + '/apiv1/search?q=' + value, function(data, status) {
        if (data != '{}') {
            document.getElementById('u-search-content').style = ''
            $.each(data, function(e, n){
                var result = ({
                    title: n.name,
                    url: "/u/" + n.id,
                    image: 'https://a.ppy.sb/' + n.id
                })
                var root = document.createElement('a')
                root.href = result.url
                root.className = 'navbar-item'
                var image = document.createElement('img')
                image.src = result.image
                image.style = 'max-height: 3rem; width: 3rem; background-size: cover;'
                root.appendChild(image)
                var textSpan = document.createElement('span')
                textSpan.style = 'margin-left:5px; font-weight: 700;font-size: 1.2em;color: rgba(255, 255, 255, 0.9);'
                textSpan.innerText = result.title
                root.appendChild(textSpan)
                document.getElementById('u-search-content').appendChild(root)
            })
        } else {
            document.getElementById('u-search-content').style = 'display: none;'
        }
    })
    
}