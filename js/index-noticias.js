document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDENoticiasApi;
    const grid = document.getElementById('home-news-grid');
    const feedback = document.getElementById('home-news-feedback');

    if (!api || !grid || !feedback) {
        return;
    }

    const setFeedback = (message, type) => {
        feedback.textContent = message;
        feedback.className = 'estado-noticias ' + type;
        feedback.hidden = false;
        grid.hidden = true;
    };

    try {
        const noticias = await api.fetchLatestNoticias(3);

        if (!noticias.length) {
            setFeedback('Todavia no hay noticias publicadas.', 'vacio');
            return;
        }

        grid.innerHTML = noticias.map((noticia) => {
            const noticiaUrl = api.buildNoticiaUrl(noticia.slug);
            const excerpt = api.createExcerpt(noticia.descripcion, 190);

            return `
                <article class="tarjeta">
                    <div class="tarjeta-imagen">
                        <img src="${api.escapeHtml(noticia.imageUrl)}" alt="${api.escapeHtml(noticia.titulo)}" loading="lazy">
                    </div>
                    <div class="tarjeta-contenido">
                        <span class="tarjeta-categoria">${api.escapeHtml(api.formatFecha(noticia.fecha))}</span>
                        <h3 class="tarjeta-titulo">${api.escapeHtml(noticia.titulo)}</h3>
                        <p class="tarjeta-texto">${api.escapeHtml(excerpt)}</p>
                        <a href="${api.escapeHtml(noticiaUrl)}" class="tarjeta-enlace">Ver noticia <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        }).join('');

        feedback.hidden = true;
        grid.hidden = false;
    } catch (error) {
        console.error(error);
        setFeedback('No pudimos cargar las noticias destacadas en este momento.', 'error');
    }
});
