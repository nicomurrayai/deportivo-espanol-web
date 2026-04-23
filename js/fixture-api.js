(function () {
    const SUPABASE_URL = 'https://dguqkvbwbzqbicyeltjo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndXFrdmJ3YnpxYmljeWVsdGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODAyNDEsImV4cCI6MjA4ODc1NjI0MX0.5hpdfuJsHQmBktgrtbpHViCYXJVarSBHYMn_P_e6j88';
    const FIXTURE_COLUMNS = 'id, fecha_partido, rival, condicion, estado, created_at, updated_at';
    const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
    });
    const TIME_FORMATTER = new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires',
    });
    const FIXTURE_TEAMS = [
        { nombre: 'Deportivo Español', image_url: 'img/escudo.png' },
        { nombre: 'Berazategui', image_url: 'https://api.promiedos.com.ar/images/team/bbiia/4' },
        { nombre: 'Sacachispas', image_url: 'https://api.promiedos.com.ar/images/team/bbihj/4' },
        { nombre: 'Centro Español', image_url: 'https://api.promiedos.com.ar/images/team/bbjee/4' },
        { nombre: 'CA Lugano', image_url: 'https://api.promiedos.com.ar/images/team/bedhd/4' },
        { nombre: 'Estrella del Sur', image_url: 'https://api.promiedos.com.ar/images/team/hjbfb/4' },
        { nombre: 'Mercedes', image_url: 'https://api.promiedos.com.ar/images/team/gjiac/4' },
        { nombre: 'Puerto Nuevo', image_url: 'https://api.promiedos.com.ar/images/team/bbjab/4' },
        { nombre: 'Cambaceres', image_url: 'https://api.promiedos.com.ar/images/team/bbijg/4' },
        { nombre: 'Victoriano', image_url: 'https://api.promiedos.com.ar/images/team/bbjdh/4' },
        { nombre: 'JJ Urquiza', image_url: 'https://api.promiedos.com.ar/images/team/bfjej/4' },
        { nombre: 'Paraguayo', image_url: 'https://api.promiedos.com.ar/images/team/bbjed/4' },
        { nombre: 'Leandro N. Alem', image_url: 'https://api.promiedos.com.ar/images/team/bbjac/4' },
        { nombre: 'Argentino Rosario', image_url: 'https://api.promiedos.com.ar/images/team/bbjdj/4' },
        { nombre: 'Juventud Unida SM', image_url: 'https://api.promiedos.com.ar/images/team/bejfe/4' },
        { nombre: 'Lamadrid', image_url: 'https://api.promiedos.com.ar/images/team/jaff/4' },
        { nombre: 'Leones de Rosario FC', image_url: 'https://api.promiedos.com.ar/images/team/jcbji/4' },
        { nombre: 'Central Ballester', image_url: 'https://api.promiedos.com.ar/images/team/bedhc/4' },
        { nombre: 'Cañuelas', image_url: 'https://api.promiedos.com.ar/images/team/bbjef/4' },
        { nombre: 'Yupanqui', image_url: 'https://api.promiedos.com.ar/images/team/bbjdf/4' },
        { nombre: 'Claypole', image_url: 'https://api.promiedos.com.ar/images/team/bbijh/4' },
        { nombre: 'Sp. Barracas', image_url: 'https://api.promiedos.com.ar/images/team/bedhb/4' },
        { nombre: 'El Porvenir', image_url: 'https://api.promiedos.com.ar/images/team/bbjec/4' },
        { nombre: 'Luján', image_url: 'https://api.promiedos.com.ar/images/team/bbjaa/4' },
        { nombre: 'Central Córdoba', image_url: 'https://api.promiedos.com.ar/images/team/hbbf/4' },
        { nombre: 'Fenix', image_url: 'https://api.promiedos.com.ar/images/team/bdgjd/4' },
        { nombre: 'Muñiz', image_url: 'https://api.promiedos.com.ar/images/team/bedhh/4' },
        { nombre: 'CA Atlas', image_url: 'https://api.promiedos.com.ar/images/team/bbjde/4' },
    ];
    const TEAM_BY_NORMALIZED_NAME = new Map(
        FIXTURE_TEAMS.map((team) => [normalizeTeamName(team.nombre), team])
    );

    let supabaseClient = null;

    function getSupabaseClient() {
        if (supabaseClient) {
            return supabaseClient;
        }

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('No se pudo inicializar el cliente de Supabase.');
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }

    function buildFixtureQuery() {
        return getSupabaseClient()
            .from('fixture_partidos')
            .select(FIXTURE_COLUMNS);
    }

    async function fetchUpcomingMatches(limit) {
        const now = new Date().toISOString();
        const queryLimit = typeof limit === 'number' ? limit : 3;
        const { data, error } = await buildFixtureQuery()
            .eq('estado', 'programado')
            .gte('fecha_partido', now)
            .order('fecha_partido', { ascending: true })
            .order('id', { ascending: true })
            .limit(queryLimit);

        if (error) {
            throw new Error('No se pudo cargar el fixture.');
        }

        return data || [];
    }

    async function fetchFixture() {
        const { data, error } = await buildFixtureQuery()
            .order('fecha_partido', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            throw new Error('No se pudo cargar el calendario completo.');
        }

        return {
            partidos: data || [],
        };
    }

    function formatFecha(value) {
        if (!value) {
            return 'Sin fecha';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 'Sin fecha';
        }

        return DATE_FORMATTER.format(date);
    }

    function formatHora(value) {
        if (!value) {
            return 'A confirmar';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 'A confirmar';
        }

        return `${TIME_FORMATTER.format(date)} hs`;
    }

    function formatCondicion(value) {
        if (value === 'local') {
            return 'Local';
        }

        if (value === 'visitante') {
            return 'Visitante';
        }

        return 'Partido';
    }

    function normalizeTeamName(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function getFixtureTeamByName(value) {
        if (!value) {
            return null;
        }

        return TEAM_BY_NORMALIZED_NAME.get(normalizeTeamName(value)) || null;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    window.CDEFixtureApi = {
        escapeHtml,
        fetchFixture,
        fetchUpcomingMatches,
        formatCondicion,
        formatFecha,
        formatHora,
        getFixtureTeamByName,
    };
})();
