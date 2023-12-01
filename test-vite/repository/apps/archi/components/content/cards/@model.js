/*global use*/
use(['../../../../_models/@card-utils.js'], function (cardUtils) {
    const card1 = cardUtils.makeCard(this.properties.card1);
    const card2 = cardUtils.makeCard({
        image: { src: 'https://picsum.photos/400', alt: 'Random' },
        title: 'Card2 - Model',
        description: 'Example of templates & use other models',
    });

    return {
        cards: [card1, card2],
    };
});
