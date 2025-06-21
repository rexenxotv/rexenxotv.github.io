document.addEventListener('DOMContentLoaded', () => {
    fetch("menu.html").then(res => 
        res.text()).then(html => {
            document.getElementById("menu").innerHTML = html;
    });
});