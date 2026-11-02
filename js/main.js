document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header-primary');
    document.querySelector('.burger').addEventListener('click', () => {
        header.classList.toggle('menu-open');
    });

    const music = document.querySelector('.btn__music');
    music.addEventListener('click', () => {
        const off = music.classList.toggle('is-off');
        music.textContent = off ? 'Sound Off' : 'Sound On';
    });

    // single-choice groups: only one item is active at a time
    const groups = [
        ['.tabs__item', 'tabs__item--active'],
        ['.open-panel__count-btn', 'is-active'],
        ['.open-panel__anim button', 'is-active'],
    ];
    groups.forEach(([selector, activeClass]) => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove(activeClass));
                item.classList.add(activeClass);
            });
        });
    });

    document.querySelectorAll('button.rarity').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('is-active'));
    });

    const filter = document.querySelector('.filter');
    if (filter) {
        filter.addEventListener('reset', () => {
            document.querySelectorAll('button.rarity.is-active').forEach(btn => btn.classList.remove('is-active'));
        });
    }

    // case page: open button price follows the chosen count
    const openBtn = document.querySelector('.open-panel__open');
    if (openBtn) {
        const price = parseInt(openBtn.textContent, 10);
        document.querySelectorAll('.open-panel__count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openBtn.firstChild.textContent = price * parseInt(btn.textContent.slice(1), 10) + ' ';
            });
        });
    }
});
