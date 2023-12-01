/*global use*/
use(function () {
    function makeCard(properties) {
        return {
            image: properties.image,
            title: properties.title,
            description: properties.description,
        };
    }

    return {
        makeCard,
    };
});
