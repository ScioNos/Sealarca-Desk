(() => {
    let theme = 'light';
    try {
        theme = localStorage.getItem('sealarca_theme')
            || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
        theme = 'light';
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
})();
