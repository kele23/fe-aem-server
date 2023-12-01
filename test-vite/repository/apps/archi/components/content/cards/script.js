export function run() {
    console.log('Test run');
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (newModule) {
            newModule?.run();
        }
    });
}
