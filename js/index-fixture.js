document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('home-fixture-list');
    const feedback = document.getElementById('home-fixture-feedback');
    const clubName = 'Deportivo Español';

    if (!api || !list || !feedback) {
        return;
    }

    function renderHomeMatchCard(partido) {
        const condicion = api.formatCondicion(partido.condicion);
        const isLocal = partido.condicion === 'local';
        const rivalLabel = isLocal ? 'Recibimos a' : 'Visitamos a';
        const metaClass = isLocal ? 'fixture-meta-home' : 'fixture-meta-away';

        return `
            <article class="fixture-item fixture-item-home">
                <div class="fixture-home-top">
                    <div class="fixture-fecha fixture-fecha-home">${api.escapeHtml(api.formatFecha(partido.fecha_partido))}</div>
                    <span class="fixture-meta fixture-meta-home-chip ${metaClass}">${api.escapeHtml(condicion)}</span>
                </div>
                <div class="fixture-home-body">
                    <span class="fixture-home-kicker">${api.escapeHtml(rivalLabel)}</span>
                    <h3 class="fixture-rival fixture-rival-home">${api.escapeHtml(partido.rival)}</h3>
                    <div class="fixture-home-clubline">
                        <span class="fixture-home-club">${api.escapeHtml(clubName)}</span>
                        <span class="fixture-home-divider"></span>
                        <span class="fixture-home-subcopy">Próximo Partido</span>
                    </div>
                </div>
            </article>
        `;
    }

    try {
        const partidos = await api.fetchUpcomingMatches(2);

        if (!partidos.length) {
            feedback.textContent = 'No hay próximos partidos cargados.';
            feedback.classList.add('vacio');
            return;
        }

        list.innerHTML = partidos.map(renderHomeMatchCard).join('');

        feedback.hidden = true;
        list.hidden = false;
    } catch (error) {
        feedback.textContent = 'No pudimos cargar el fixture en este momento.';
        feedback.classList.add('error');
    }
});
