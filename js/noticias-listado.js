document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDENoticiasApi;
    const grid = document.getElementById('noticias-grid');
    const feedback = document.getElementById('noticias-feedback');

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
        const noticias = await api.fetchNoticias();

        if (!noticias.length) {
            setFeedback('Todavia no hay noticias publicadas.', 'vacio');
            return;
        }

        grid.innerHTML = noticias.map((noticia) => `
            <article class="noticia">
                <img src="${api.escapeHtml(noticia.imageUrl)}" alt="${api.escapeHtml(noticia.titulo)}" class="imagen-noticia" loading="lazy">
                <div class="contenido-noticia">
                    <div class="fecha-noticia">${api.escapeHtml(api.formatFecha(noticia.fecha))}</div>
                    <h3 class="titulo-noticia">${api.escapeHtml(noticia.titulo)}</h3>
                    <p class="descripcion-noticia">${api.escapeHtml(api.createExcerpt(noticia.descripcion, 220))}</p>
                    <a href="${api.escapeHtml(api.buildNoticiaUrl(noticia.slug))}" class="boton-leer-mas">Leer mas</a>
                </div>
            </article>
        `).join('');

        feedback.hidden = true;
        grid.hidden = false;
    } catch (error) {
        console.error(error);
        setFeedback('No pudimos cargar las noticias en este momento.', 'error');
    }
});
