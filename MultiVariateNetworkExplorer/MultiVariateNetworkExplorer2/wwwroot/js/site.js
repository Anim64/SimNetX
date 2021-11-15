// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.




function openTab(event, contentId, divId, contentClass) {
    var i, tabcontent, tablinks;

    //tabcontent = document.getElementsByClassName("tabcontent");
    tabcontent = document.getElementById(divId).querySelectorAll(contentClass);
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementById(divId).querySelectorAll(".tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" tab-active", "");
    }

    document.getElementById(contentId).style.display = "block";
    event.currentTarget.className += " tab-active";
}






