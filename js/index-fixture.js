document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('home-fixture-list');
    const feedback = document.getElementById('home-fixture-feedback');
    const clubName = 'Deportivo Español';

    if (!api || !list || !feedback) {
        return;
    }

    function renderRivalLogo(rivalName) {
        const team = api.getFixtureTeamByName(rivalName);

        if (!team) {
            return `
                <span class="fixture-home-rival-logo fixture-team-logo-fallback" aria-hidden="true">
                    <i class="fas fa-shield-alt"></i>
                </span>
            `;
        }

        return `
            <span class="fixture-home-rival-logo">
                <img src="${api.escapeHtml(team.image_url)}" alt="Escudo de ${api.escapeHtml(team.nombre)}" loading="lazy" decoding="async">
            </span>
        `;
    }

    function renderHomeMatchCard(partido) {
        const isLocal = partido.condicion === 'local';
        const rivalLabel = isLocal ? 'Recibimos a' : 'Visitamos a';
        const horario = api.formatHora(partido.fecha_partido);

        return `
            <article class="fixture-item fixture-item-home">
                <div class="fixture-home-top">
                    <div class="fixture-fecha fixture-fecha-home">
                        <i class="fas fa-calendar-days" aria-hidden="true"></i>
                        <span>${api.escapeHtml(api.formatFecha(partido.fecha_partido))}</span>
                    </div>
                </div>
                <div class="fixture-home-body">
                    <span class="fixture-home-kicker">${api.escapeHtml(rivalLabel)}</span>
                    <div class="fixture-home-rival-row">
                        ${renderRivalLogo(partido.rival)}
                        <h3 class="fixture-rival fixture-rival-home">${api.escapeHtml(partido.rival)}</h3>
                    </div>
                    <div class="fixture-home-clubline">
                        <span class="fixture-home-club">${api.escapeHtml(clubName)}</span>
                        <span class="fixture-home-divider"></span>
                        <span class="fixture-home-subcopy">Próximo Partido</span>
                    </div>
                    <div class="fixture-home-data-row">
                        <span class="fixture-home-data-pill">
                            <i class="fas fa-clock" aria-hidden="true"></i>
                            <span>${api.escapeHtml(horario)}</span>
                        </span>
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
