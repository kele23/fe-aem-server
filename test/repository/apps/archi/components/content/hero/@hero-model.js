/*global use*/
use(function () {
    return {
        bgImage: 'https://picsum.photos/1920/1080',
        link: this.properties.link
            ? {
                  attrs: this.properties.link,
                  label: this.properties.link?.label,
              }
            : null,
    };
});
