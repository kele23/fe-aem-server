/*global use*/
use(['../../../../_models/@link.js'], function (link) {
    var title = this.properties['usePageTitle'] ? this.pageProperties['jcr:title'] : this.properties['title'];

    return {
        ...this.properties,
        title,
        link: link.makeLink(this.properties['link']),
        dropdownLabel: 'Select',
        dropdownItems: [
            {
                label: 'Test2',
            },
        ],
    };
});
