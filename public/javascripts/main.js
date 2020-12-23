
// When the user scrolls the page, execute myFunction
window.onscroll = function () {
    myFunction()
};

// Get the header
var header = document.getElementById("myBanner");

// Get the offset position of the navbar
var sticky = header.offsetTop;

// Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
function myFunction() {
    if (window.pageYOffset > sticky) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
}

var h1 = document.getElementById("h1")
var start = document.getElementById("start")

h1.addEventListener('mouseenter', function () {
    h1.style.boxShadow = '0 0 35px #7B68EE';
    h1.style.backgroundColor = 'pink';
    start.style.color = '#C71585';
    h1.style.border = '3px #7B68EE solid';
});

h1.addEventListener('mouseleave', function () {
    h1.style.boxShadow = '0 0 10px #483D8B';
    h1.style.backgroundColor = '#C71585';
    start.style.color = 'white';
    h1.style.border = '3px #483D8B solid';
});