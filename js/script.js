
document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.querySelector('.boton-menu');
    const menu = document.querySelector('.menu');
    const dropdowns = document.querySelectorAll('.menu-dropdown');

    if (menuBtn && menu) {
        menuBtn.addEventListener('click', function () {
            menu.classList.toggle('activo');
            menuBtn.classList.toggle('activo');
        });
    }

    const esMobile = () => window.innerWidth <= 768;

    dropdowns.forEach((dropdown) => {
        const toggle = dropdown.querySelector('.menu-dropdown-toggle');
        if (!toggle) {
            return;
        }

        const cerrarDropdown = () => {
            dropdown.classList.remove('abierto');
            toggle.setAttribute('aria-expanded', 'false');
        };

        const abrirDropdown = () => {
            dropdown.classList.add('abierto');
            toggle.setAttribute('aria-expanded', 'true');
        };

        toggle.addEventListener('click', (event) => {
            if (!esMobile()) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            const abierto = dropdown.classList.contains('abierto');
            dropdowns.forEach((item) => {
                const button = item.querySelector('.menu-dropdown-toggle');
                item.classList.remove('abierto');
                if (button) {
                    button.setAttribute('aria-expanded', 'false');
                }
            });

            if (!abierto) {
                abrirDropdown();
            }
        });

        dropdown.addEventListener('focusout', (event) => {
            if (dropdown.contains(event.relatedTarget)) {
                return;
            }

            if (!esMobile()) {
                cerrarDropdown();
            }
        });

        dropdown.addEventListener('mouseenter', () => {
            if (!esMobile()) {
                abrirDropdown();
            }
        });

        dropdown.addEventListener('mouseleave', () => {
            if (!esMobile()) {
                cerrarDropdown();
            }
        });

        dropdown.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cerrarDropdown();
                toggle.focus();
            }
        });
    });

 
    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (menu) {
                menu.classList.remove('activo');
            }
            if (menuBtn) {
                menuBtn.classList.remove('activo');
            }
            dropdowns.forEach((dropdown) => {
                dropdown.classList.remove('abierto');
                const toggle = dropdown.querySelector('.menu-dropdown-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    });

    window.addEventListener('resize', () => {
        if (!esMobile()) {
            dropdowns.forEach((dropdown) => {
                dropdown.classList.remove('abierto');
                const toggle = dropdown.querySelector('.menu-dropdown-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });

 
    const animarAlScroll = (selector) => {
        const elementos = document.querySelectorAll(selector);
        const observer = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visible');
                }
            });
        }, { threshold: 0.2 });
        elementos.forEach(el => observer.observe(el));
    };
    animarAlScroll('.valor-card');
    animarAlScroll('.foto-historica');

    document.querySelectorAll('a[href^="#"]').forEach(enlace => {
        enlace.addEventListener('click', function (e) {
            const destino = document.querySelector(this.getAttribute('href'));
            if (destino) {
                e.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
