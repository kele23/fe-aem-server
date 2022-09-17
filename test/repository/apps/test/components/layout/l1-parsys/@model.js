/*global use*/
use(function () {
    return {
        children: this.resource.listChildren().map((item) => item.getName()),
    };
});
