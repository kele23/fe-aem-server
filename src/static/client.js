const evtSource = new EventSource('/repoevents');

async function reload(start, end) {
    console.log(start.dataset.path);
    const response = await fetch(start.dataset.path);
    const text = await response.text();

    let el = start;
    while (el) {
        if (el == end) {
            break;
        }
        const tmp = el.nextSibling;
        el.remove();
        el = tmp;
    }

    end.insertAdjacentHTML('beforebegin', text);
    el.remove();
}

evtSource.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    // resource type
    if (data.resourceType) {
        const starts = Array.from(
            document.querySelectorAll(`meta[data-type="start"][data-resource-type="${data.resourceType}"]`)
        );
        for (const start of starts) {
            const end = document.querySelector(`meta[data-type="end"][data-path="${start.dataset.path}"]`);
            await reload(start, end);
        }

        if (!starts) {
            window.location.reload();
        }
    }

    // path
    if (data.path) {
        const start = document.querySelector(`meta[data-type="start"][data-path="${data.path}"]`);
        const end = document.querySelector(`meta[data-type="end"][data-path="${data.path}"]`);
        if (start && end) {
            await reload(start, end);
        } else {
            window.location.reload();
        }
    }
};
