(function () {
    const SUPABASE_URL = 'https://dguqkvbwbzqbicyeltjo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndXFrdmJ3YnpxYmljeWVsdGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODAyNDEsImV4cCI6MjA4ODc1NjI0MX0.5hpdfuJsHQmBktgrtbpHViCYXJVarSBHYMn_P_e6j88';
    const FIXTURE_COLUMNS = 'id, temporada, fecha_partido, rival, condicion, torneo, estado, created_at, updated_at';
    const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

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

    async function fetchActiveSeason() {
        const { data, error } = await getSupabaseClient()
            .from('fixture_partidos')
            .select('temporada')
            .order('temporada', { ascending: false })
            .limit(1);

        if (error) {
            throw new Error('No se pudo obtener la temporada activa.');
        }

        return data && data.length ? data[0].temporada : null;
    }

    async function fetchSeasonFixture(temporada) {
        let activeSeason = temporada;

        if (activeSeason == null) {
            activeSeason = await fetchActiveSeason();
        }

        if (activeSeason == null) {
            return {
                temporada: null,
                partidos: [],
            };
        }

        const { data, error } = await buildFixtureQuery()
            .eq('temporada', activeSeason)
            .order('fecha_partido', { ascending: true })
            .order('id', { ascending: true });

        if (error) {
            throw new Error('No se pudo cargar el calendario completo.');
        }

        return {
            temporada: activeSeason,
            partidos: data || [],
        };
    }

    function formatFecha(value) {
        if (!value) {
            return 'Sin fecha';
        }

        return DATE_FORMATTER.format(new Date(value));
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
        fetchActiveSeason,
        fetchSeasonFixture,
        fetchUpcomingMatches,
        formatCondicion,
        formatFecha,
    };
})();
