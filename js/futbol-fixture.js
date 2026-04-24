document.addEventListener('DOMContentLoaded', async function () {
    const api = window.CDEFixtureApi;
    const list = document.getElementById('fixture-complete-list');
    const feedback = document.getElementById('fixture-complete-feedback');
    const clubName = 'Deportivo Español';

    if (!api || !list || !feedback) {
        return;
    }

    function renderTeamLogo(teamName) {
        const team = api.getFixtureTeamByName(teamName);

        if (!team) {
            return `
                <span class="fixture-team-logo fixture-team-logo-fallback" aria-hidden="true">
                    <i class="fas fa-shield-alt"></i>
                </span>
            `;
        }

        return `
            <span class="fixture-team-logo">
                <img src="${api.escapeHtml(team.image_url)}" alt="Escudo de ${api.escapeHtml(team.nombre)}" loading="lazy" decoding="async">
            </span>
        `;
    }

    function renderMatchCard(partido) {
        const isLocal = partido.condicion === 'local';
        const homeTeam = isLocal ? clubName : partido.rival;
        const awayTeam = isLocal ? partido.rival : clubName;
        const horario = api.formatHora(partido.fecha_partido);

        return `
            <article class="fixture-item fixture-item-complete">
                <div class="fixture-card-head">
                    <div class="fixture-fecha fixture-fecha-complete">
                        <i class="fas fa-calendar-days" aria-hidden="true"></i>
                        <span>${api.escapeHtml(api.formatFecha(partido.fecha_partido))}</span>
                    </div>
                </div>
                <div class="fixture-duelo">
                    <div class="fixture-equipo fixture-equipo-home">
                        <span class="fixture-equipo-label">Local</span>
                        ${renderTeamLogo(homeTeam)}
                        <h3 class="fixture-equipo-nombre">${api.escapeHtml(homeTeam)}</h3>
                    </div>
                    <div class="fixture-versus" aria-label="Versus">
                        <span>VS</span>
                    </div>
                    <div class="fixture-equipo fixture-equipo-away">
                        <span class="fixture-equipo-label">Visitante</span>
                        ${renderTeamLogo(awayTeam)}
                        <h3 class="fixture-equipo-nombre">${api.escapeHtml(awayTeam)}</h3>
                    </div>
                </div>
                <div class="fixture-match-info">
                    <div class="fixture-info-item">
                        <span class="fixture-info-icon"><i class="fas fa-clock" aria-hidden="true"></i></span>
                        <span class="fixture-info-copy">
                            <span class="fixture-info-label">Horario</span>
                            <strong class="fixture-info-value">${api.escapeHtml(horario)}</strong>
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    try {
        const fixture = await api.fetchFixture();

        if (!fixture.partidos.length) {
            feedback.textContent = 'No hay partidos cargados en el fixture.';
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
