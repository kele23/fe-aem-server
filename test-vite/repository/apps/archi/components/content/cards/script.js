console.log('pippo');

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('hot');
    });
}
