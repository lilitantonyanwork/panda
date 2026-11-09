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

    // toasts: short notices in the top-right corner, gone after a few seconds
    const toast = (text, type = 'error') => {
        let box = document.querySelector('.toasts');
        if (!box) {
            box = document.createElement('div');
            box.className = 'toasts';
            box.setAttribute('aria-live', 'polite');
            document.body.appendChild(box);
        }
        const item = document.createElement('div');
        item.className = `toast toast--${type}`;
        item.innerHTML = `<span class="toast__icon">${type === 'error' ? '!' : '✓'}</span><span class="toast__text"></span>`
            + '<button class="toast__close" type="button" aria-label="Закрыть"><svg width="10" height="10" viewBox="0 0 24 24"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6 6.4 5Z" fill="currentColor"/></svg></button>';
        item.querySelector('.toast__text').textContent = text;
        const remove = () => {
            item.classList.add('is-leaving');
            item.addEventListener('animationend', () => item.remove(), { once: true });
        };
        item.querySelector('.toast__close').addEventListener('click', remove);
        setTimeout(remove, 4000);
        box.appendChild(item);
    };

    // dropdowns: toggle on click, close on outside click or Esc
    const dropdowns = document.querySelectorAll('.dropdown');
    const closeAll = except => dropdowns.forEach(d => {
        if (d === except) return;
        d.classList.remove('is-open');
        d.querySelector('[aria-expanded]').setAttribute('aria-expanded', 'false');
    });
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('[aria-expanded]');
        toggle.addEventListener('click', e => {
            e.stopPropagation();
            closeAll(dropdown);
            const open = dropdown.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open);
        });
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown__menu')) closeAll();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAll();
    });

    const lang = document.querySelector('.dropdown--lang');
    if (lang) {
        const items = lang.querySelectorAll('[data-lang]');
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('is-active'));
                item.classList.add('is-active');
                lang.querySelector('.btn__lang').textContent = item.dataset.lang;
                closeAll();
            });
        });
    }

    // spin page: one roulette per opened case (data-count), each stops on a random item
    const wheels = document.querySelector('.spin__wheels');
    if (wheels) {
        const pool = [...document.querySelectorAll('.contents__grid .drop')];
        const result = document.querySelector('.spin__result');
        const resultName = document.querySelector('.spin__result-name');
        const again = document.querySelector('.spin__again');
        const count = parseInt(wheels.dataset.count, 10) || 1;
        const ITEMS = 50;
        const WIN_INDEX = 42;
        const roulettes = [];

        wheels.classList.toggle('spin__wheels--multi', count > 1);
        for (let i = 0; i < count; i++) {
            const roulette = document.createElement('div');
            roulette.className = 'roulette';
            roulette.innerHTML = '<div class="roulette__track"></div><span class="roulette__marker"></span>';
            wheels.appendChild(roulette);
            roulettes.push({ roulette, track: roulette.firstChild, winner: null });
        }

        const fill = r => {
            r.track.innerHTML = '';
            for (let i = 0; i < ITEMS; i++) {
                const item = pool[Math.floor(Math.random() * pool.length)].cloneNode(true);
                r.track.appendChild(item);
                if (i === WIN_INDEX) r.winner = item;
            }
        };

        let left = 0;
        const finish = () => {
            const wins = roulettes.map(r => r.winner);
            if (wins.length === 1) {
                const type = wins[0].querySelector('.drop__type').textContent;
                const name = wins[0].querySelector('.drop__name').textContent;
                resultName.textContent = `${type} | ${name}`;
            } else {
                const total = wins.reduce((sum, w) => sum + parseInt(w.querySelector('.drop__price').textContent, 10), 0);
                resultName.textContent = `${wins.length} предметов на ${total} CR`;
            }
            result.hidden = false;
            again.disabled = false;
        };

        const spin = () => {
            result.hidden = true;
            again.disabled = true;
            left = roulettes.length;
            roulettes.forEach((r, i) => {
                r.track.classList.remove('is-done');
                fill(r);
                r.track.style.transition = 'none';
                r.track.style.transform = 'translateX(0)';
                r.track.offsetWidth; // apply the reset before animating
                // land somewhere inside the winning card, not always dead centre
                const jitter = (Math.random() - .5) * r.winner.offsetWidth * .7;
                const x = r.winner.offsetLeft + r.winner.offsetWidth / 2 - r.roulette.clientWidth / 2 + jitter;
                // wheels stop one after another
                const duration = 5 + i * .25 + Math.random() * .5;
                r.track.style.transition = `transform ${duration}s cubic-bezier(.12, .75, .15, 1)`;
                r.track.style.transform = `translateX(${-x}px)`;
            });
        };

        roulettes.forEach(r => {
            r.track.addEventListener('transitionend', e => {
                if (e.target !== r.track) return;
                r.track.classList.add('is-done');
                r.winner.classList.add('is-win');
                if (--left === 0) finish();
            });
        });
        again.addEventListener('click', spin);
        setTimeout(spin, 400);
    }

    // wheel page: one wheel per opened case (data-count); each ring turns until an item stops under the pointer
    const wheelsBox = document.querySelector('.wheels');
    if (wheelsBox) {
        const pool = [...document.querySelectorAll('.contents__grid .drop')];
        const result = document.querySelector('.spin__result');
        const resultName = document.querySelector('.spin__result-name');
        const again = document.querySelector('.spin__again');
        const count = parseInt(wheelsBox.dataset.count, 10) || 1;
        const template = wheelsBox.querySelector('.wheel');
        const ITEMS = parseInt(getComputedStyle(template).getPropertyValue('--items'), 10) || 26;
        const STEP = 360 / ITEMS;

        wheelsBox.classList.toggle('wheels--multi', count > 1);
        for (let i = 1; i < count; i++) wheelsBox.appendChild(template.cloneNode(true));
        const wheels = [...wheelsBox.querySelectorAll('.wheel')].map(wheel => ({
            ring: wheel.querySelector('.wheel__ring'),
            turned: 0,
            winner: null
        }));

        wheels.forEach(w => {
            for (let i = 0; i < ITEMS; i++) {
                const item = document.createElement('div');
                item.className = 'wheel__item';
                item.style.setProperty('--angle', `${i * STEP}deg`);
                item.appendChild(pool[Math.floor(Math.random() * pool.length)].cloneNode(true));
                w.ring.appendChild(item);
            }
        });

        let left = 0;
        const finish = () => {
            const wins = wheels.map(w => w.winner);
            if (wins.length === 1) {
                const type = wins[0].querySelector('.drop__type').textContent;
                const name = wins[0].querySelector('.drop__name').textContent;
                resultName.textContent = `${type} | ${name}`;
            } else {
                const total = wins.reduce((sum, w) => sum + parseInt(w.querySelector('.drop__price').textContent, 10), 0);
                resultName.textContent = `${wins.length} предметов на ${total} CR`;
            }
            result.hidden = false;
            again.disabled = false;
        };

        const spin = () => {
            result.hidden = true;
            again.disabled = true;
            left = wheels.length;
            wheels.forEach((w, n) => {
                w.ring.classList.remove('is-done');
                if (w.winner) w.winner.classList.remove('is-win');
                const index = Math.floor(Math.random() * ITEMS);
                w.winner = w.ring.children[index];
                // item i sits at i * STEP, so a turn of -i * STEP brings it to the top;
                // add five full turns on top of where the ring already is
                const jitter = (Math.random() - .5) * STEP * .6;
                const target = ((-index * STEP + jitter) % 360 + 360) % 360;
                w.turned += 360 * 5 + ((target - w.turned % 360 + 360) % 360);
                // wheels stop one after another
                const duration = 5 + n * .25 + Math.random() * .5;
                w.ring.style.transition = `transform ${duration}s cubic-bezier(.15, .7, .12, 1)`;
                w.ring.style.transform = `rotate(${w.turned}deg)`;
            });
        };

        wheels.forEach(w => {
            w.ring.addEventListener('transitionend', e => {
                if (e.target !== w.ring) return;
                w.ring.classList.add('is-done');
                w.winner.classList.add('is-win');
                if (--left === 0) finish();
            });
        });
        again.addEventListener('click', spin);
        setTimeout(spin, 400);
    }

    // simple modals: any [data-modal="id"] opens it, overlay / close button / Esc close it
    document.querySelectorAll('.modal--simple').forEach(modal => {
        const close = () => {
            modal.hidden = true;
            document.body.classList.remove('is-locked');
        };
        modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !modal.hidden) close();
        });
    });
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.modal).hidden = false;
            document.body.classList.add('is-locked');
        });
    });

    // pvp page: "join" opens the room modal; pick skins until the stake reaches the minimum
    const joinModal = document.querySelector('#join-modal');
    if (joinModal) {
        const form = joinModal.querySelector('.join');
        const min = parseInt(form.dataset.min, 10) || 0;
        const sum = form.querySelector('.join__sum');
        const submit = form.querySelector('.join__submit');
        const pass = form.querySelector('#join-pass');
        const eye = form.querySelector('.join__eye');

        const open = () => {
            joinModal.hidden = false;
            document.body.classList.add('is-locked');
        };
        const close = () => {
            joinModal.hidden = true;
            document.body.classList.remove('is-locked');
        };
        const update = () => {
            const total = [...form.querySelectorAll('.pick.is-picked')]
                .reduce((acc, pick) => acc + parseInt(pick.dataset.price, 10), 0);
            sum.textContent = total;
        };

        document.querySelectorAll('.pvp-row__btn--join').forEach(btn => btn.addEventListener('click', open));
        joinModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !joinModal.hidden) close();
        });
        form.querySelectorAll('.pick').forEach(pick => {
            pick.addEventListener('click', () => {
                pick.classList.toggle('is-picked');
                update();
            });
        });
        eye.addEventListener('click', () => {
            const show = pass.type === 'password';
            pass.type = show ? 'text' : 'password';
            eye.classList.toggle('is-on', show);
        });
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (parseInt(sum.textContent, 10) < min) {
                toast('Не хватает средств для игры');
                return;
            }
            close();
            toast('Вы вошли в комнату', 'success');
        });
        update();
    }

    // pvp page: "Создать PvP" opens the create-room modal
    const createModal = document.querySelector('#create-modal');
    if (createModal) {
        const form = createModal.querySelector('.create');
        const privacy = form.querySelector('.create__private');
        const passBox = form.querySelector('.create__pass');
        const pass = form.querySelector('#create-pass');
        const eye = form.querySelector('.join__eye');

        const open = () => {
            createModal.hidden = false;
            document.body.classList.add('is-locked');
        };
        const close = () => {
            createModal.hidden = true;
            document.body.classList.remove('is-locked');
        };

        document.querySelector('.pvp__create').addEventListener('click', open);
        createModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !createModal.hidden) close();
        });
        // each segmented group keeps its own active button
        form.querySelectorAll('.seg').forEach(seg => {
            const btns = seg.querySelectorAll('.seg__btn');
            btns.forEach(btn => btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
            }));
        });
        form.querySelectorAll('.pick').forEach(pick => {
            pick.addEventListener('click', () => pick.classList.toggle('is-picked'));
        });
        // the password only matters for a private room
        privacy.addEventListener('change', () => {
            passBox.hidden = !privacy.checked;
        });
        eye.addEventListener('click', () => {
            const show = pass.type === 'password';
            pass.type = show ? 'text' : 'password';
            eye.classList.toggle('is-on', show);
        });
        form.addEventListener('submit', e => {
            e.preventDefault();
            close();
        });
    }

    // pvp room: count down, then spin the pie; the winner's share decides where it stops
    const pie = document.querySelector('.pie__disc');
    if (pie) {
        const counter = document.querySelector('.room__count');
        const winnerBox = document.querySelector('.room__winner');
        const avatars = [...pie.querySelectorAll('.pie__avatar')];
        const players = [...document.querySelectorAll('.room__player')];
        const a = parseFloat(pie.style.getPropertyValue('--a'));
        const b = parseFloat(pie.style.getPropertyValue('--b'));
        // sector borders in degrees: [start, end] per player
        const sectors = [[0, a * 3.6], [a * 3.6, (a + b) * 3.6], [(a + b) * 3.6, 360]];
        let left = parseInt(counter.textContent, 10);
        let winner;

        const spin = () => {
            // pick by share: a random point on the circle lands in someone's sector
            const angle = Math.random() * 360;
            winner = sectors.findIndex(([from, to]) => angle >= from && angle < to);
            const [from, to] = sectors[winner];
            // keep away from the sector edges so the pointer clearly sits inside
            const margin = Math.min(8, (to - from) / 4);
            const inside = from + margin + Math.random() * (to - from - margin * 2);
            pie.style.transition = 'transform 6s cubic-bezier(.15, .7, .12, 1)';
            pie.style.transform = `rotate(${360 * 6 - inside}deg)`;
        };

        pie.addEventListener('transitionend', e => {
            if (e.target !== pie) return;
            const name = avatars[winner].alt;
            avatars[winner].classList.add('is-win');
            players[winner].classList.add('is-win');
            winnerBox.querySelector('span').textContent = name;
            winnerBox.hidden = false;
            toast(`Победитель: ${name}`, 'success');
        });

        const timer = setInterval(() => {
            left -= 1;
            counter.textContent = left;
            counter.classList.remove('is-tick');
            counter.offsetWidth; // restart the tick animation
            counter.classList.add('is-tick');
            if (left === 0) {
                clearInterval(timer);
                spin();
            }
        }, 1000);
    }

    // pvp room, square mode: wait for players, then a marker hops around the board
    // and lands in a zone; bigger zones win more often
    const square = document.querySelector('.square');
    if (square) {
        const zones = [...square.querySelectorAll('.square__zone')];
        const marker = square.querySelector('.square__marker');
        const status = document.querySelector('.room__timer--wait');
        const players = [...document.querySelectorAll('.room__player')];
        const winnerBox = document.querySelector('.room__winner');
        // zone boxes in percent, read from their inline position
        const boxes = zones.map(z => ({
            x: parseFloat(z.style.left), y: parseFloat(z.style.top),
            w: parseFloat(z.style.width), h: parseFloat(z.style.height)
        }));
        const pointIn = b => ({ x: b.x + b.w * (.2 + Math.random() * .6), y: b.y + b.h * (.2 + Math.random() * .6) });
        const moveTo = p => {
            marker.style.left = `${p.x}%`;
            marker.style.top = `${p.y}%`;
        };

        const play = () => {
            const total = boxes.reduce((acc, b) => acc + b.w * b.h, 0);
            let roll = Math.random() * total;
            const winner = boxes.findIndex(b => (roll -= b.w * b.h) < 0);
            square.classList.add('is-running');
            status.textContent = 'Игра идёт';
            // hops slow down towards the end, the last one lands in the winner's zone
            const hops = 18;
            let delay = 120;
            for (let i = 0; i < hops; i++) {
                const last = i === hops - 1;
                setTimeout(() => {
                    moveTo(pointIn(last ? boxes[winner] : boxes[Math.floor(Math.random() * boxes.length)]));
                    if (!last) return;
                    setTimeout(() => {
                        const name = zones[winner].querySelector('img').alt;
                        square.classList.add('is-done');
                        zones[winner].classList.add('is-win');
                        players[winner].classList.add('is-win');
                        status.textContent = 'Игра завершена';
                        winnerBox.querySelector('span').textContent = name;
                        winnerBox.hidden = false;
                        toast(`Победитель: ${name}`, 'success');
                    }, 400);
                }, delay);
                delay += 120 + i * i * 2.5;
            }
        };
        setTimeout(play, 3000);
    }

    // upgrade page: pick your item and a target, chance = stake / target price;
    // the marker spins round the gauge and wins if it stops inside the green arc
    const gauge = document.querySelector('.gauge');
    if (gauge) {
        const fromSlot = document.querySelector('.upgrade__slot--from');
        const toSlot = document.querySelector('.upgrade__slot--to');
        const fromBox = fromSlot.querySelector('.upgrade__picked');
        const toBox = toSlot.querySelector('.upgrade__picked');
        const resultText = gauge.querySelector('.gauge__result-text');
        const prize = gauge.querySelector('.gauge__prize');
        const balanceBox = document.querySelector('.upgrade__balance');
        const claim = document.querySelector('.upgrade__claim');
        let won = null;
        // after a win: keep the prize (it joins "my items") or sell it
        const closeClaim = () => {
            won = null;
            claim.hidden = true;
            balanceBox.hidden = false;
            gauge.classList.remove('is-win');
        };
        claim.querySelector('.upgrade__keep').addEventListener('click', () => {
            const item = won.cloneNode(true);
            item.classList.remove('is-picked');
            item.hidden = false;
            panels.mine.querySelector('.upgrade__grid').prepend(item);
            toast(`${won.dataset.name} в ваших предметах`, 'success');
            closeClaim();
        });
        claim.querySelector('.upgrade__sell').addEventListener('click', () => {
            toast(`Продано +${won.dataset.price} CR`, 'success');
            closeClaim();
        });
        // the last stake/target stays as a faded silhouette in the emptied slot
        const ghost = (slot, pick) => {
            const img = slot.querySelector('.upgrade__ghost');
            img.hidden = !pick;
            if (pick) img.src = pick.querySelector('img').src;
        };
        const start = document.querySelector('.upgrade__start');
        const range = document.querySelector('.upgrade__range');
        const balance = document.querySelector('.upgrade__bal b');
        const value = gauge.querySelector('.gauge__value span');
        const label = gauge.querySelector('.gauge__label');
        const marker = gauge.querySelector('.gauge__marker');
        const panels = {};
        document.querySelectorAll('.upgrade__panel').forEach(panel => { panels[panel.dataset.list] = panel; });
        const searchModal = document.querySelector('#search-modal');
        const searchInput = searchModal.querySelector('#search-input');
        // "Найти" applies the query to the list that opened the modal; an empty query clears it
        searchModal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            const panel = searchModal.panel;
            panel.dataset.query = searchInput.value.trim();
            panel.querySelector('[data-search]').classList.toggle('is-on', !!panel.dataset.query);
            panel.filter();
            searchModal.hidden = true;
            document.body.classList.remove('is-locked');
        });
        let mine = null;
        let target = null;
        let turned = 0;
        let busy = false;

        const price = pick => (pick ? parseInt(pick.dataset.price, 10) : 0);
        const show = (box, pick) => {
            box.innerHTML = '';
            if (pick) box.appendChild(pick.querySelector('.drop').cloneNode(true));
        };
        const update = () => {
            const stake = price(mine) + parseInt(range.value, 10);
            const chance = target && stake ? Math.min(95, stake / price(target) * 100) : 0;
            gauge.style.setProperty('--chance', chance.toFixed(2));
            value.textContent = chance.toFixed(2);
            label.textContent = !target || !stake ? 'Выберите предметы'
                : chance < 25 ? 'Низкий шанс' : chance < 60 ? 'Средний шанс' : 'Высокий шанс';
            balance.textContent = range.value;
            range.style.setProperty('--fill', `${range.value / range.max * 100}%`);
            fromSlot.classList.toggle('is-filled', !!mine);
            toSlot.classList.toggle('is-filled', !!target);
            start.disabled = busy || !target || chance === 0;
            return chance;
        };
        const choose = (list, pick) => {
            panels[list].querySelectorAll('.pick').forEach(p => p.classList.toggle('is-picked', p === pick && !p.classList.contains('is-picked')));
            const picked = pick.classList.contains('is-picked') ? pick : null;
            if (list === 'mine') { mine = picked; show(fromBox, mine); } else { target = picked; show(toBox, target); }
            gauge.classList.remove('is-win', 'is-lose');
            update();
        };

        Object.entries(panels).forEach(([list, panel]) => {
            const grid = panel.querySelector('.upgrade__grid');
            const min = panel.querySelector('[data-min]');
            const max = panel.querySelector('[data-max]');
            const sort = panel.querySelector('[data-sort]');
            const searchBtn = panel.querySelector('[data-search]');
            let asc = true;
            // price range and name search hide cards, sort reorders them
            const filter = () => {
                const lo = parseFloat(min.value) || 0;
                const hi = parseFloat(max.value) || Infinity;
                const q = (panel.dataset.query || '').toLowerCase();
                grid.querySelectorAll('.pick').forEach(p => {
                    const pr = price(p);
                    p.hidden = pr < lo || pr > hi || (q && !p.dataset.name.toLowerCase().includes(q));
                });
            };
            grid.addEventListener('click', e => {
                const pick = e.target.closest('.pick');
                if (pick && !busy && !won) choose(list, pick);
            });
            [min, max].forEach(el => el.addEventListener('input', filter));
            panel.filter = filter;
            sort.addEventListener('click', () => {
                [...grid.children].sort((a, b) => (asc ? price(b) - price(a) : price(a) - price(b))).forEach(p => grid.appendChild(p));
                asc = !asc;
                sort.classList.toggle('is-on', !asc);
            });
            // the magnifier opens the search modal for this list
            searchBtn.addEventListener('click', () => {
                searchModal.panel = panel;
                searchInput.value = panel.dataset.query || '';
                searchModal.hidden = false;
                document.body.classList.add('is-locked');
                searchInput.focus();
            });
        });
        range.addEventListener('input', () => {
            gauge.classList.remove('is-win', 'is-lose');
            update();
        });

        start.addEventListener('click', () => {
            const chance = update();
            busy = true;
            start.disabled = true;
            gauge.classList.remove('is-win', 'is-lose');
            // marker angle from the top, clockwise; the green arc covers 0 .. chance% of the circle
            const stop = Math.random() * 360;
            turned += 360 * 4 + ((stop - turned % 360 + 360) % 360);
            marker.style.transition = 'transform 4s cubic-bezier(.15, .7, .12, 1)';
            marker.style.setProperty('--turn', `${turned}deg`);
            marker.addEventListener('transitionend', () => {
                const win = stop < chance * 3.6;
                resultText.textContent = 'Не получилось 😔';
                if (win) {
                    won = target;
                    const [type, name] = target.dataset.name.split(' | ');
                    prize.querySelector('img').src = target.querySelector('img').src;
                    prize.querySelector('.gauge__prize-type').textContent = type;
                    prize.querySelector('.gauge__prize-name').textContent = name;
                    prize.querySelector('.gauge__prize-price').textContent = `${target.dataset.price} CR`;
                    balanceBox.hidden = true;
                    claim.hidden = false;
                }
                // the stake is spent either way, both slots empty out
                ghost(fromSlot, mine);
                ghost(toSlot, target);
                if (mine) mine.remove();
                target.classList.remove('is-picked');
                mine = null;
                target = null;
                show(fromBox, null);
                show(toBox, null);
                range.value = 0;
                busy = false;
                update();
                gauge.classList.add(win ? 'is-win' : 'is-lose');
            }, { once: true });
        });
        update();
    }

    // contracts: put 3-10 inventory items into slots; the result is worth 25%..400% of their total
    const slotsBox = document.querySelector('.contract__slots');
    if (slotsBox) {
        const SLOTS = 10;
        const MIN = 3;
        const grid = document.querySelector('.contract__grid');
        const sumEl = document.querySelector('.contract__sum');
        const minEl = document.querySelector('.contract__min');
        const maxEl = document.querySelector('.contract__max');
        const sellBtn = document.querySelector('.contract__sell');
        const signBtn = document.querySelector('.contract__sign');
        const removeSvg = '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6 6.4 5Z" fill="currentColor"/></svg>';
        const emptyHtml = '<span class="upgrade__plus"><svg viewBox="0 0 24 24"><path d="m6 6.4 6 6 6-6 1.4 1.4-7.4 7.4-7.4-7.4L6 6.4Zm0 6 6 6 6-6 1.4 1.4-7.4 7.4-7.4-7.4L6 12.4Z" fill="currentColor"/></svg></span><span>Добавьте оружие</span>';
        let chosen = [];

        const render = () => {
            slotsBox.innerHTML = '';
            for (let i = 0; i < SLOTS; i++) {
                const slot = document.createElement('div');
                const item = chosen[i];
                if (item) {
                    slot.className = 'contract__slot';
                    slot.appendChild(item.querySelector('.drop').cloneNode(true));
                    const remove = document.createElement('button');
                    remove.className = 'contract__remove';
                    remove.type = 'button';
                    remove.setAttribute('aria-label', 'Убрать из контракта');
                    remove.innerHTML = removeSvg;
                    remove.addEventListener('click', () => {
                        item.classList.remove('is-used');
                        chosen = chosen.filter(c => c !== item);
                        render();
                    });
                    slot.appendChild(remove);
                } else {
                    slot.className = 'contract__slot contract__slot--empty';
                    slot.innerHTML = emptyHtml;
                }
                slotsBox.appendChild(slot);
            }
            const sum = chosen.reduce((acc, item) => acc + parseInt(item.dataset.price, 10), 0);
            sumEl.textContent = sum;
            minEl.textContent = Math.round(sum * .25);
            maxEl.textContent = sum * 4;
            sellBtn.disabled = !chosen.length;
            const ready = chosen.length >= MIN;
            signBtn.disabled = !ready;
            signBtn.textContent = ready ? 'Подписать контракт' : `Добавьте минимум ${MIN} предмета`;
        };
        const clear = () => {
            chosen.forEach(item => item.remove());
            chosen = [];
            render();
        };

        grid.addEventListener('click', e => {
            const item = e.target.closest('.inv-item');
            if (!item || item.classList.contains('is-used') || prize) return;
            if (chosen.length >= SLOTS) {
                toast('В контракте максимум 10 предметов');
                return;
            }
            item.classList.add('is-used');
            chosen.push(item);
            render();
        });
        sellBtn.addEventListener('click', () => {
            toast(`Продано +${sumEl.textContent} CR`, 'success');
            clear();
        });
        // after signing the slots give way to "Твой дроп": take it, sell it or start again
        const section = document.querySelector('.contract');
        const titleText = section.querySelector('.contract__title-text');
        const resultBox = section.querySelector('.contract__result');
        const prizeBox = section.querySelector('.contract__prize');
        let prize = null;
        const closeResult = () => {
            prize = null;
            prizeBox.innerHTML = '';
            resultBox.hidden = true;
            section.classList.remove('is-result');
            titleText.textContent = 'Контракты';
        };
        const keepPrize = () => {
            prize.classList.remove('is-used');
            prize.hidden = false;
            grid.prepend(prize);
        };
        signBtn.addEventListener('click', () => {
            const lo = parseInt(minEl.textContent, 10);
            const hi = parseInt(maxEl.textContent, 10);
            // cheap results are more likely than expensive ones
            const result = Math.round(lo + (hi - lo) * Math.pow(Math.random(), 2.2));
            // the prize looks like one of the inventory skins, priced at the result
            const all = [...grid.querySelectorAll('.inv-item')];
            prize = all[Math.floor(Math.random() * all.length)].cloneNode(true);
            prize.dataset.price = result;
            prize.querySelector('.drop__price').innerHTML = `${result} <span>CR</span>`;
            prize.classList.remove('is-used');
            prizeBox.innerHTML = '';
            prizeBox.appendChild(prize.querySelector('.drop').cloneNode(true));
            clear();
            section.classList.add('is-result');
            titleText.textContent = 'Твой дроп';
            resultBox.hidden = false;
        });
        section.querySelector('.contract__take').addEventListener('click', () => {
            keepPrize();
            toast(`${prize.dataset.name} в инвентаре`, 'success');
            closeResult();
        });
        section.querySelector('.contract__sell-prize').addEventListener('click', () => {
            toast(`Продано +${prize.dataset.price} CR`, 'success');
            closeResult();
        });
        section.querySelector('.contract__again').addEventListener('click', () => {
            keepPrize();
            closeResult();
        });

        // inventory filters: price range and sort
        const panel = document.querySelector('.contract__inventory');
        const lo = panel.querySelector('[data-min]');
        const hi = panel.querySelector('[data-max]');
        const sort = panel.querySelector('[data-sort]');
        let asc = true;
        const filter = () => {
            const a = parseFloat(lo.value) || 0;
            const b = parseFloat(hi.value) || Infinity;
            const q = (panel.dataset.query || '').toLowerCase();
            grid.querySelectorAll('.inv-item').forEach(item => {
                const pr = parseInt(item.dataset.price, 10);
                item.hidden = pr < a || pr > b || (q && !item.dataset.name.toLowerCase().includes(q));
            });
        };
        [lo, hi].forEach(el => el.addEventListener('input', filter));
        // magnifier opens the shared search modal; "Найти" filters by name
        const searchModal = document.querySelector('#search-modal');
        const searchInput = searchModal.querySelector('#search-input');
        const searchBtn = panel.querySelector('[data-search]');
        searchBtn.addEventListener('click', () => {
            searchInput.value = panel.dataset.query || '';
            searchModal.hidden = false;
            document.body.classList.add('is-locked');
            searchInput.focus();
        });
        searchModal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            panel.dataset.query = searchInput.value.trim();
            searchBtn.classList.toggle('is-on', !!panel.dataset.query);
            filter();
            searchModal.hidden = true;
            document.body.classList.remove('is-locked');
        });
        sort.addEventListener('click', () => {
            const price = el => parseInt(el.dataset.price, 10);
            [...grid.children].sort((x, y) => (asc ? price(y) - price(x) : price(x) - price(y))).forEach(el => grid.appendChild(el));
            asc = !asc;
            sort.classList.toggle('is-on', !asc);
        });
        render();
    }

    // bonus page: claim today's ticket, then join the giveaway
    const today = document.querySelector('.bonus__day.is-today');
    if (today) {
        const got = document.querySelector('.bonus__got');
        const join = document.querySelector('.bonus__join');
        today.addEventListener('click', () => {
            today.classList.remove('is-today');
            today.classList.add('is-got');
            today.disabled = true;
            today.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="m9.5 16.2-4.2-4.2-1.4 1.4 5.6 5.6 11-11-1.4-1.4-9.6 9.6Z" fill="currentColor"/></svg>';
            got.textContent = parseInt(got.textContent, 10) + 1;
            toast('Билет за сегодня получен', 'success');
        }, { once: true });
        // "Участвовать" opens the rules; joining works once every condition is done
        const rules = document.querySelector('#rules-modal');
        const submit = rules.querySelector('.rules__submit');
        const allDone = [...rules.querySelectorAll('.rules__cond')].every(c => c.classList.contains('is-done'));
        submit.disabled = !allDone;
        submit.textContent = allDone ? 'Участвовать' : 'Не выполнены условия';
        submit.addEventListener('click', () => {
            join.disabled = true;
            join.textContent = 'Вы участвуете';
            rules.hidden = true;
            document.body.classList.remove('is-locked');
            toast(`В розыгрыше ваши билеты: ${got.textContent}`, 'success');
        });
        // "За билетами" closes the details and brings the day cells into view
        document.querySelector('.promo__go').addEventListener('click', () => {
            document.querySelector('.bonus__days').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        // countdowns: the draw in the rules modal and the next promo code
        const pad = n => String(n).padStart(2, '0');
        document.querySelectorAll('[data-ends-in]').forEach(timer => {
            const ends = Date.now() + parseInt(timer.dataset.endsIn, 10) * 1000;
            const units = {};
            timer.querySelectorAll('[data-unit]').forEach(el => { units[el.dataset.unit] = el; });
            const tick = () => {
                const left = Math.max(0, Math.floor((ends - Date.now()) / 1000));
                units.d.textContent = Math.floor(left / 86400);
                units.h.textContent = pad(Math.floor(left / 3600) % 24);
                units.m.textContent = pad(Math.floor(left / 60) % 60);
                units.s.textContent = pad(left % 60);
            };
            tick();
            setInterval(tick, 1000);
        });

        // active giveaways: joining adds you to the participants
        document.querySelectorAll('.raffle__join').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.raffle');
                const members = card.querySelector('.raffle__members b');
                members.textContent = parseInt(members.textContent, 10) + 1;
                btn.disabled = true;
                btn.textContent = 'Вы участвуете';
                toast(`Вы участвуете в розыгрыше ${card.querySelector('.drop__name').textContent}`, 'success');
            }, { once: true });
        });

        // promo codes: copy today's code, apply an entered one
        const copyBtn = document.querySelector('.promo-card__copy');
        copyBtn.addEventListener('click', () => {
            const code = copyBtn.previousElementSibling;
            const done = () => {
                copyBtn.textContent = 'Скопировано';
                toast('Промокод скопирован', 'success');
                setTimeout(() => { copyBtn.textContent = 'Скопировать'; }, 2000);
            };
            if (navigator.clipboard) navigator.clipboard.writeText(code.value).then(done, () => { code.select(); done(); });
            else { code.select(); document.execCommand('copy'); done(); }
        });
        const applyForm = document.querySelector('.promo-card--apply');
        applyForm.addEventListener('submit', e => {
            e.preventDefault();
            const input = applyForm.querySelector('.promo-card__input');
            const code = input.value.trim();
            input.classList.toggle('is-error', !code);
            if (!code) {
                toast('Введите промокод');
                return;
            }
            toast(`Промокод ${code} применён`, 'success');
            input.value = '';
        });
    }

    // policy page: highlight the section currently in view
    const policyNav = document.querySelector('.policy__nav');
    if (policyNav && 'IntersectionObserver' in window) {
        const links = [...policyNav.querySelectorAll('a')];
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
            });
        }, { rootMargin: '-30% 0px -60% 0px' });
        document.querySelectorAll('.policy__text section').forEach(section => observer.observe(section));
    }

    // exchange: pick up to 5 of your skins and up to 3 shop skins; yours must cover the shop total
    const swapStage = document.querySelector('.swap__stage');
    if (swapStage) {
        const go = swapStage.querySelector('.swap__go');
        const status = swapStage.querySelector('.swap__status');
        const sides = {};
        swapStage.querySelectorAll('.swap__side').forEach(el => { sides[el.dataset.side] = el; });
        const picked = list => [...document.querySelectorAll(`.upgrade__panel[data-list="${list}"] .pick.is-picked`)];
        const sum = items => items.reduce((acc, p) => acc + parseInt(p.dataset.price, 10), 0);

        const renderSide = (key, items) => {
            const side = sides[key];
            const box = side.querySelector('.swap__items');
            box.innerHTML = items.length ? '' : '<span class="swap__empty">Ничего не выбрано</span>';
            items.forEach(p => {
                const img = document.createElement('img');
                img.src = p.querySelector('img').src;
                img.alt = p.dataset.name;
                box.appendChild(img);
            });
            side.querySelector('.swap__n').textContent = items.length;
            const total = sum(items);
            side.querySelector('.swap__sum b').textContent = total;
            side.classList.toggle('is-ready', items.length > 0 && total >= parseInt(side.dataset.min, 10));
            return total;
        };
        const update = () => {
            const mine = picked('mine');
            const shop = picked('shop');
            const give = renderSide('mine', mine);
            const get = renderSide('shop', shop);
            let msg = 'Выберите скины с обеих сторон';
            let ok = false;
            if (mine.length && shop.length) {
                if (give < parseInt(sides.mine.dataset.min, 10)) msg = `Минимум ${sides.mine.dataset.min} CR из инвентаря`;
                else if (get < parseInt(sides.shop.dataset.min, 10)) msg = `Минимум ${sides.shop.dataset.min} CR из магазина`;
                else if (give < get) msg = `Не хватает ${get - give} CR — добавьте скины из инвентаря`;
                else { msg = `Вы отдаёте ${give} CR и получаете ${get} CR`; ok = true; }
            }
            status.textContent = msg;
            status.classList.toggle('is-error', mine.length > 0 && shop.length > 0 && !ok);
            go.disabled = !ok;
        };

        document.querySelectorAll('.upgrade__panel').forEach(panel => {
            const list = panel.dataset.list;
            const grid = panel.querySelector('.upgrade__grid');
            const max = parseInt(sides[list].dataset.max, 10);
            grid.addEventListener('click', e => {
                const pick = e.target.closest('.pick');
                if (!pick) return;
                if (!pick.classList.contains('is-picked') && picked(list).length >= max) {
                    toast(`Можно выбрать не больше ${max}`);
                    return;
                }
                pick.classList.toggle('is-picked');
                update();
            });
            // filters: price range, sort, search modal
            const lo = panel.querySelector('[data-min]');
            const hi = panel.querySelector('[data-max]');
            const sort = panel.querySelector('[data-sort]');
            let asc = true;
            panel.filter = () => {
                const a = parseFloat(lo.value) || 0;
                const b = parseFloat(hi.value) || Infinity;
                const q = (panel.dataset.query || '').toLowerCase();
                grid.querySelectorAll('.pick').forEach(p => {
                    const pr = parseInt(p.dataset.price, 10);
                    p.hidden = pr < a || pr > b || (q && !p.dataset.name.toLowerCase().includes(q));
                });
            };
            [lo, hi].forEach(el => el.addEventListener('input', panel.filter));
            sort.addEventListener('click', () => {
                const price = el => parseInt(el.dataset.price, 10);
                [...grid.children].sort((x, y) => (asc ? price(y) - price(x) : price(x) - price(y))).forEach(el => grid.appendChild(el));
                asc = !asc;
                sort.classList.toggle('is-on', !asc);
            });
        });
        const searchModal = document.querySelector('#search-modal');
        const searchInput = searchModal.querySelector('#search-input');
        document.querySelectorAll('.upgrade__panel [data-search]').forEach(btn => {
            btn.addEventListener('click', () => {
                searchModal.panel = btn.closest('.upgrade__panel');
                searchInput.value = searchModal.panel.dataset.query || '';
                searchModal.hidden = false;
                document.body.classList.add('is-locked');
                searchInput.focus();
            });
        });
        searchModal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            const panel = searchModal.panel;
            panel.dataset.query = searchInput.value.trim();
            panel.querySelector('[data-search]').classList.toggle('is-on', !!panel.dataset.query);
            panel.filter();
            searchModal.hidden = true;
            document.body.classList.remove('is-locked');
        });

        go.addEventListener('click', () => {
            const mine = picked('mine');
            const shop = picked('shop');
            const mineGrid = document.querySelector('.upgrade__panel[data-list="mine"] .upgrade__grid');
            // your skins leave, the shop skins join your inventory
            mine.forEach(p => p.remove());
            shop.forEach(p => {
                p.classList.remove('is-picked');
                mineGrid.prepend(p);
            });
            toast(`Обмен выполнен: получено ${shop.length} шт.`, 'success');
            update();
        });
        update();
    }

    // daily cases: each one can be taken once a day, then the button counts down to tomorrow
    const dailyCases = document.querySelectorAll('.daily-case');
    if (dailyCases.length) {
        const pad = n => String(n).padStart(2, '0');
        const untilMidnight = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(24, 0, 0, 0);
            const left = Math.floor((next - now) / 1000);
            return `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`;
        };
        dailyCases.forEach(card => {
            const btn = card.querySelector('.daily-case__get');
            btn.addEventListener('click', () => {
                btn.disabled = true;
                btn.classList.add('is-timer');
                const tick = () => { btn.textContent = `Следующий через ${untilMidnight()}`; };
                tick();
                setInterval(tick, 1000);
                toast(`Кейс ${card.querySelector('.case__img img').alt} получен`, 'success');
            }, { once: true });
        });
        const notify = document.querySelector('.daily__notify');
        notify.addEventListener('click', () => {
            const on = notify.classList.toggle('is-on');
            notify.lastChild.textContent = on ? 'Напоминания включены' : 'Напоминать мне';
            toast(on ? 'Будем напоминать о ежедневных кейсах' : 'Напоминания выключены', on ? 'success' : 'error');
        });
    }

    // profile: tabs, trade link, inventory (sell / withdraw) with filters and search
    const profile = document.querySelector('.profile');
    if (profile) {
        const tabs = profile.querySelectorAll('.profile__tab');
        const panels = profile.querySelectorAll('.profile__panel');
        tabs.forEach(tab => tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.toggle('is-active', t === tab));
            panels.forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
        }));

        // pvp history: newest first by default, the button flips the order
        const pvpSort = profile.querySelector('.profile__pvp-sort');
        if (pvpSort) {
            const list = profile.querySelector('.profile__pvp-list');
            pvpSort.addEventListener('click', () => {
                [...list.children].reverse().forEach(row => list.appendChild(row));
                const old = pvpSort.classList.toggle('is-on');
                pvpSort.setAttribute('aria-label', old ? 'Сначала новые' : 'Сначала старые');
            });
        }

        // history tables: the sort button flips the order
        profile.querySelectorAll('.hist__sort').forEach(btn => {
            const list = btn.closest('.profile__panel').querySelector('.hist__list');
            btn.addEventListener('click', () => {
                [...list.children].reverse().forEach(row => list.appendChild(row));
                const old = btn.classList.toggle('is-on');
                btn.setAttribute('aria-label', old ? 'Сначала новые' : 'Сначала старые');
            });
        });

        // bonuses: collecting one marks it as received
        profile.querySelectorAll('.bonus-card__btn.btn--primary').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.disabled = true;
                btn.classList.remove('btn--primary');
                btn.classList.add('is-claimed');
                btn.textContent = 'Получено';
                toast(`Бонус «${btn.closest('.bonus-card').querySelector('.bonus-card__title').textContent}» получен`, 'success');
            }, { once: true });
        });

        // funds: withdraw / deposit / history switch, payment method, picked skins total
        const funds = profile.querySelector('.profile__panel[data-panel="6"]');
        if (funds) {
            const segBtns = funds.querySelectorAll('.funds__seg .seg__btn');
            const views = funds.querySelectorAll('.funds__view');
            segBtns.forEach(btn => btn.addEventListener('click', () => {
                segBtns.forEach(b => b.classList.toggle('is-active', b === btn));
                views.forEach(v => { v.hidden = v.dataset.view !== btn.dataset.fund; });
            }));
            funds.querySelectorAll('.funds__methods').forEach(box => {
                const items = box.querySelectorAll('.fund-method');
                items.forEach(m => m.addEventListener('click', () => {
                    items.forEach(x => x.classList.toggle('is-active', x === m));
                }));
            });
            const out = funds.querySelector('[data-view="out"]');
            const sum = out.querySelector('.funds__sum');
            const outBtn = out.querySelector('.funds__go');
            const recount = () => {
                const picked = [...out.querySelectorAll('.pick.is-picked')];
                sum.textContent = picked.reduce((acc, p) => acc + parseInt(p.dataset.price, 10), 0);
                outBtn.disabled = !picked.length;
            };
            out.querySelector('.funds__grid').addEventListener('click', e => {
                const pick = e.target.closest('.pick');
                if (!pick) return;
                pick.classList.toggle('is-picked');
                recount();
            });
            outBtn.addEventListener('click', () => {
                const picked = [...out.querySelectorAll('.pick.is-picked')];
                const method = out.querySelector('.fund-method.is-active').dataset.method;
                toast(`Заявка на вывод ${sum.textContent} CR (${method}) создана`, 'success');
                picked.forEach(p => p.remove());
                recount();
            });
            recount();
            const deposit = funds.querySelector('.funds__deposit');
            const amount = deposit.querySelector('#fund-amount');
            const get = deposit.querySelector('#fund-get');
            const promo = deposit.querySelector('#fund-promo');
            const mail = deposit.querySelector('#fund-mail');
            const bonusOut = deposit.querySelector('.funds__bonus b');
            // demo promo codes: code -> bonus percent
            const promoCodes = { PANDA20: 20, PANDA: 10, BONUS50: 50 };
            const bonus = () => promoCodes[promo.value.trim().toUpperCase()] || 0;
            const recalc = () => {
                const value = Math.max(0, parseInt(amount.value, 10) || 0);
                const pct = bonus();
                get.value = Math.floor(value * (1 + pct / 100));
                bonusOut.textContent = `+${pct} %`;
                deposit.querySelector('.funds__bonus').classList.toggle('is-on', pct > 0);
                promo.classList.toggle('is-ok', pct > 0);
                promo.classList.remove('is-error');
            };
            amount.addEventListener('input', recalc);
            promo.addEventListener('input', recalc);
            mail.addEventListener('input', () => mail.classList.remove('is-error'));
            deposit.querySelectorAll('[data-amount]').forEach(chip => {
                chip.addEventListener('click', () => { amount.value = chip.dataset.amount; recalc(); });
            });
            deposit.addEventListener('submit', e => {
                e.preventDefault();
                const value = parseInt(amount.value, 10) || 0;
                if (value < 100) {
                    amount.closest('.join__field').classList.add('is-error');
                    toast('Минимальная сумма — 100 CR', 'error');
                    return;
                }
                amount.closest('.join__field').classList.remove('is-error');
                if (promo.value.trim() && !bonus()) {
                    promo.classList.add('is-error');
                    toast('Промокод не найден', 'error');
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) {
                    mail.classList.add('is-error');
                    toast('Укажите корректную почту для чека', 'error');
                    return;
                }
                if (!deposit.querySelector('.funds__agree input').checked) {
                    toast('Примите условия пополнения', 'error');
                    return;
                }
                const method = deposit.closest('.funds__view').querySelector('.fund-method.is-active').dataset.method;
                toast(`Пополнение на ${get.value} CR (${method})`, 'success');
            });
            recalc();

            // profile.html#deposit / #funds opens the funds tab straight away
            const openFromHash = () => {
                const hash = location.hash.slice(1);
                if (hash !== 'deposit' && hash !== 'funds') return;
                profile.querySelector('.profile__tab[data-tab="6"]').click();
                funds.querySelector(`.funds__seg .seg__btn[data-fund="${hash === 'deposit' ? 'in' : 'out'}"]`).click();
                funds.scrollIntoView({ block: 'start' });
            };
            openFromHash();
            window.addEventListener('hashchange', openFromHash);
        }

        const trade = profile.querySelector('.profile__trade');
        trade.addEventListener('submit', e => {
            e.preventDefault();
            const input = trade.querySelector('input');
            const ok = /steamcommunity\.com\/tradeoffer/i.test(input.value);
            input.classList.toggle('is-error', !ok);
            toast(ok ? 'Trade-ссылка сохранена' : 'Вставьте ссылку вида steamcommunity.com/tradeoffer/…', ok ? 'success' : 'error');
        });

        const grid = profile.querySelector('.profile__grid');
        grid.addEventListener('click', e => {
            const btn = e.target.closest('.loot__btn');
            if (!btn) return;
            const item = btn.closest('.loot');
            const sold = btn.classList.contains('loot__btn--sell');
            item.classList.add(sold ? 'is-sold' : 'is-taken');
            item.querySelector('.loot__status').textContent = sold ? `Продано +${item.dataset.price} CR` : 'Отправлено в Steam';
            toast(sold ? `${item.dataset.name} продан` : `${item.dataset.name} отправлен в Steam`, 'success');
        });

        const panel = profile.querySelector('.profile__inventory');
        const lo = panel.querySelector('[data-min]');
        const hi = panel.querySelector('[data-max]');
        const sort = panel.querySelector('[data-sort]');
        const searchBtn = panel.querySelector('[data-search]');
        let asc = true;
        const filter = () => {
            const a = parseFloat(lo.value) || 0;
            const b = parseFloat(hi.value) || Infinity;
            const q = (panel.dataset.query || '').toLowerCase();
            grid.querySelectorAll('.loot').forEach(item => {
                const pr = parseInt(item.dataset.price, 10);
                item.hidden = pr < a || pr > b || (q && !item.dataset.name.toLowerCase().includes(q));
            });
        };
        [lo, hi].forEach(el => el.addEventListener('input', filter));
        sort.addEventListener('click', () => {
            const price = el => parseInt(el.dataset.price, 10);
            [...grid.children].sort((x, y) => (asc ? price(y) - price(x) : price(x) - price(y))).forEach(el => grid.appendChild(el));
            asc = !asc;
            sort.classList.toggle('is-on', !asc);
        });
        const searchModal = document.querySelector('#search-modal');
        const searchInput = searchModal.querySelector('#search-input');
        searchBtn.addEventListener('click', () => {
            searchInput.value = panel.dataset.query || '';
            searchModal.hidden = false;
            document.body.classList.add('is-locked');
            searchInput.focus();
        });
        searchModal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            panel.dataset.query = searchInput.value.trim();
            searchBtn.classList.toggle('is-on', !!panel.dataset.query);
            filter();
            searchModal.hidden = true;
            document.body.classList.remove('is-locked');
        });
    }

    // drop result page: sell or take each item, or sell everything left
    const lootGrid = document.querySelector('.result__grid');
    if (lootGrid) {
        const sellAll = document.querySelector('.result__sell-all');
        const total = document.querySelector('.result__total');
        const price = loot => parseInt(loot.querySelector('.drop__price').textContent, 10);
        const unclaimed = () => [...lootGrid.querySelectorAll('.loot:not(.is-sold):not(.is-taken)')];
        const update = () => {
            if (!sellAll) return; // single-drop page has no "sell all"
            const items = unclaimed();
            const sum = items.reduce((acc, loot) => acc + price(loot), 0);
            total.textContent = items.length ? `(${sum} CR)` : '';
            sellAll.disabled = !items.length;
        };
        const sell = loot => {
            loot.classList.add('is-sold');
            loot.querySelector('.loot__status').textContent = `Продано +${price(loot)} CR`;
        };
        const take = loot => {
            loot.classList.add('is-taken');
            loot.querySelector('.loot__status').textContent = 'В инвентаре';
        };
        lootGrid.addEventListener('click', e => {
            const btn = e.target.closest('.loot__btn');
            if (!btn) return;
            const loot = btn.closest('.loot');
            if (btn.classList.contains('loot__btn--sell')) sell(loot);
            else take(loot);
            update();
        });
        if (sellAll) {
            sellAll.addEventListener('click', () => {
                unclaimed().forEach(sell);
                update();
            });
        }
        update();
    }

    // case page: open button picks the page from the chosen animation and count
    // Колесо → wheel.html / wheel-N.html, Нет → drop.html / drop-10.html, otherwise spin.html / spin-N.html
    const spinLink = document.querySelector('.open-panel__open[data-href]');
    if (spinLink) {
        spinLink.addEventListener('click', () => {
            const active = document.querySelector('.open-panel__count-btn.is-active');
            const count = active ? parseInt(active.textContent.slice(1), 10) : 1;
            const anim = document.querySelector('.open-panel__anim button.is-active');
            const mode = anim ? anim.textContent.trim() : '';
            const suffix = count > 1 ? `-${count}` : '';
            if (mode === 'Колесо') location.href = `wheel${suffix}.html`;
            else if (mode === 'Нет' && (count === 1 || count === 10)) location.href = `drop${suffix}.html`;
            else location.href = spinLink.dataset.href.replace('.html', `${suffix}.html`);
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
