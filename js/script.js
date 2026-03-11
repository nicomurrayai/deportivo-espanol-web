
document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.querySelector('.boton-menu');
    const menu = document.querySelector('.menu');
    menuBtn.addEventListener('click', function () {
        menu.classList.toggle('activo');
        menuBtn.classList.toggle('activo');
    });

 
    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('activo');
            menuBtn.classList.remove('activo');
        });
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
