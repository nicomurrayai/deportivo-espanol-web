document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('home-fixture-list');
    const feedback = document.getElementById('home-fixture-feedback');

    if (!api || !list || !feedback) {
        return;
    }

    try {
        const partidos = await api.fetchUpcomingMatches(3);

        if (!partidos.length) {
            feedback.textContent = 'No hay próximos partidos cargados.';
            feedback.classList.add('vacio');
            return;
        }

        list.innerHTML = partidos.map((partido) => `
            <article class="fixture-item">
                <div class="fixture-fecha">${api.escapeHtml(api.formatFecha(partido.fecha_partido))}</div>
                <div class="fixture-detalle">
                    <span class="fixture-meta">${api.escapeHtml(api.formatCondicion(partido.condicion))}</span>
                    <h3 class="fixture-rival">Deportivo Español vs ${api.escapeHtml(partido.rival)}</h3>
                </div>
            </article>
        `).join('');

        feedback.hidden = true;
        list.hidden = false;
    } catch (error) {
        feedback.textContent = 'No pudimos cargar el fixture en este momento.';
        feedback.classList.add('error');
    }
});
