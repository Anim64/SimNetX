// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

var inputs = document.querySelectorAll('.inputfile');

Array.prototype.forEach.call(inputs, function (input) {
    var label = input.nextElementSibling,
        labelVal = label.innerHTML;
    var textbox = input.previousElementSibling;

    input.addEventListener('change', function (e) {
        var fileName = '';
        fileName = e.target.value.split('\\').pop();

        if (fileName) {
            label.innerHTML = fileName;
            textbox.innerHTML = fileName
        }
        else
            label.innerHTML = labelVal;
    });
});