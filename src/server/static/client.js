const init = function () {
    const id = Math.floor(Math.random() * 100000);
    console.log('[WAS] starting SSE', id);
    const evtSource = new EventSource('/repoevents');
    const reloader = {};

    function reload(start, end) {
        if (reloader[start.dataset.path]) return;

        console.log('[WAS]: reload ' + start.dataset.path);
        reloader[start.dataset.path] = setTimeout(async () => {
            const response = await fetch(start.dataset.path);
            let source = await response.text();

            // make decoration
            let decoration = null;
            if (end.dataset.decoration == 'true') {
                const next = start.nextElementSibling;
                decoration = next.cloneNode(false);
            }

            // remove all beetween start and end
            let el = start.nextSibling;
            while (el) {
                if (el == end) {
                    break;
                }
                const tmp = el.nextSibling;
                el.remove();
                el = tmp;
            }

            // remove new meta
            source = source.replace(/<meta[^>]+\/>/g, '');

            // create decoration html
            if (decoration) {
                decoration.innerHTML = source;
                source = decoration.outerHTML;
            }

            // insert new html
            end.insertAdjacentHTML('beforebegin', source);
            delete reloader[start.dataset.path];
            console.log('[WAS]: reload complete ' + start.dataset.path);
        }, 200);
    }

    evtSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (!data.path) return;

        const ends = document.querySelectorAll(
            `meta[data-type="end"][data-path^="${data.path}"], meta[data-type="end"][data-usedfiles*="${data.path}"]`,
        );

        // reload single elements
        if (ends && ends.length > 0) {
            for (const end of ends) {
                const realPath = end.dataset.path;
                const start = document.querySelector(`meta[data-type="start"][data-path="${realPath}"]`);
                await reload(start, end);
            }
        }
    };

    const unload = () => {
        console.log('[WAS] close SSE', id);
        evtSource.close();
        //remove myself
        window.removeEventListener('beforeunload', unload);
    };

    // on unload, close sse
    window.addEventListener('beforeunload', unload);
};

window.addEventListener('pageshow', (event) => {
    if (event.persisted) init();
});

init();
