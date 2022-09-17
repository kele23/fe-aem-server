/*global use*/
use(function () {
    function makeLink(properties) {
        return {
            href: properties['href'],
            label: properties['label'],
            title: properties['title'],
        };
    }

    return {
        makeLink,
    };
});
