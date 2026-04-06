document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDENoticiasApi;
    const state = document.getElementById('noticia-estado');
    const article = document.getElementById('noticia-detalle');
    const image = document.getElementById('noticia-imagen');
    const date = document.getElementById('noticia-fecha');
    const title = document.getElementById('noticia-titulo');
    const content = document.getElementById('noticia-texto');
    const slug = new URLSearchParams(window.location.search).get('slug');

    if (!api || !state || !article || !image || !date || !title || !content) {
        return;
    }

    const setState = (message, type) => {
        state.textContent = message;
        state.className = 'estado-noticia ' + type;
        state.hidden = false;
        article.hidden = true;
    };

    if (!slug) {
        setState('No se encontro la noticia solicitada.', 'error');
        return;
    }

    try {
        const noticia = await api.fetchNoticiaBySlug(slug);

        if (!noticia) {
            setState('La noticia solicitada no existe o ya no esta disponible.', 'error');
            return;
        }

        image.src = noticia.imageUrl;
        image.alt = noticia.titulo;
        date.textContent = api.formatFecha(noticia.fecha);
        title.textContent = noticia.titulo;
        api.renderParagraphs(content, noticia.descripcion);

        document.title = noticia.titulo + ' - Club Deportivo Espanol';
        state.hidden = true;
        article.hidden = false;
    } catch (error) {
        console.error(error);
        setState('No pudimos cargar la noticia en este momento.', 'error');
    }
});
