const closeAllToolbarPanels = function () {
    $('.toolbar-panel.active-flex').removeClass('active-flex');
}

const toggleToolPanel = function (e, toolPanelId) {
    e.stopPropagation();
    closeAllToolbarPanels();
    closeAllRemodelPanels();
    $('#' + toolPanelId).toggleClass('active-flex');
}

const openFileBrowser = function (inputId) {
    document.getElementById(inputId).click();
}