app.filter('trusted', ['$sce', function($sce) {
    'use strict';
    var div = document.createElement('div');
    return function(text) {
        div.innerHTML = text;
        return $sce.trustAsHtml(div.textContent);
    };
}]);
