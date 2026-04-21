document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('fixture-complete-list');
    const feedback = document.getElementById('fixture-complete-feedback');
    const heading = document.getElementById('fixture-season-heading');

    if (!api || !list || !feedback || !heading) {
        return;
    }

    try {
        const fixture = await api.fetchSeasonFixture();

        if (fixture.temporada) {
            heading.textContent = 'Temporada ' + fixture.temporada;
        }

        if (!fixture.partidos.length) {
            feedback.textContent = 'No hay partidos cargados para la temporada actual.';
            feedback.classList.add('vacio');
            return;
        }

        list.innerHTML = fixture.partidos.map((partido) => `
            <article class="fixture-item fixture-item-complete">
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
        feedback.textContent = 'No pudimos cargar el calendario completo en este momento.';
        feedback.classList.add('error');
    }
});
