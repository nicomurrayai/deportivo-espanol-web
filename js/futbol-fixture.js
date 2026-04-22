document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('fixture-complete-list');
    const feedback = document.getElementById('fixture-complete-feedback');
    const heading = document.getElementById('fixture-season-heading');
    const clubName = 'Deportivo Español';

    if (!api || !list || !feedback || !heading) {
        return;
    }

    function renderMatchCard(partido) {
        const condicion = api.formatCondicion(partido.condicion);
        const isLocal = partido.condicion === 'local';
        const homeTeam = isLocal ? clubName : partido.rival;
        const awayTeam = isLocal ? partido.rival : clubName;
        const metaClass = isLocal ? 'fixture-meta-home' : 'fixture-meta-away';

        return `
            <article class="fixture-item fixture-item-complete">
                <div class="fixture-card-head">
                    <div class="fixture-fecha fixture-fecha-complete">${api.escapeHtml(api.formatFecha(partido.fecha_partido))}</div>
                    <span class="fixture-meta fixture-meta-complete ${metaClass}">${api.escapeHtml(condicion)}</span>
                </div>
                <div class="fixture-duelo">
                    <div class="fixture-equipo fixture-equipo-home">
                        <span class="fixture-equipo-label">Local</span>
                        <h3 class="fixture-equipo-nombre">${api.escapeHtml(homeTeam)}</h3>
                    </div>
                    <div class="fixture-versus" aria-label="Versus">
                        <span>VS</span>
                    </div>
                    <div class="fixture-equipo fixture-equipo-away">
                        <span class="fixture-equipo-label">Visitante</span>
                        <h3 class="fixture-equipo-nombre">${api.escapeHtml(awayTeam)}</h3>
                    </div>
                </div>
            </article>
        `;
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

        list.innerHTML = fixture.partidos.map(renderMatchCard).join('');

        feedback.hidden = true;
        list.hidden = false;
    } catch (error) {
        feedback.textContent = 'No pudimos cargar el calendario completo en este momento.';
        feedback.classList.add('error');
    }
});
