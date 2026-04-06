(function () {
    const SUPABASE_URL = 'https://dguqkvbwbzqbicyeltjo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndXFrdmJ3YnpxYmljeWVsdGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODAyNDEsImV4cCI6MjA4ODc1NjI0MX0.5hpdfuJsHQmBktgrtbpHViCYXJVarSBHYMn_P_e6j88';
    const NOTICIA_COLUMNS = 'id, titulo, slug, descripcion, imageUrl, fecha, created_at, updated_at';
    const LEGACY_NOTICIA_COLUMNS = 'id, titulo, descripcion, imageUrl, fecha, created_at, updated_at';
    const SLUG_FALLBACK = 'noticia';
    const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    let supabaseClient = null;
    let slugSchemaSupported = null;

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

    function buildNoticiasQuery(columns) {
        return getSupabaseClient()
            .from('noticias')
            .select(columns)
            .order('fecha', { ascending: false })
            .order('created_at', { ascending: false })
            .order('id', { ascending: true });
    }

    function slugifyTitulo(value) {
        const normalizedSlug = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return normalizedSlug || SLUG_FALLBACK;
    }

    function assignGeneratedSlugs(records) {
        const slugCounts = new Map();

        return records.map((record) => {
            if (record.slug) {
                return record;
            }

            const baseSlug = slugifyTitulo(record.titulo);
            const nextCount = (slugCounts.get(baseSlug) || 0) + 1;
            slugCounts.set(baseSlug, nextCount);

            return {
                ...record,
                slug: nextCount === 1 ? baseSlug : baseSlug + '-' + nextCount,
            };
        });
    }

    function shouldFallbackToLegacySchema(error) {
        if (!error) {
            return false;
        }

        const errorMessage = [error.message, error.details, error.hint]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return errorMessage.includes('slug');
    }

    async function fetchNoticiasRecords(limit) {
        const columns = slugSchemaSupported === false ? LEGACY_NOTICIA_COLUMNS : NOTICIA_COLUMNS;
        let query = buildNoticiasQuery(columns);

        if (typeof limit === 'number') {
            query = query.limit(limit);
        }

        let { data, error } = await query;

        if (error && slugSchemaSupported !== false && shouldFallbackToLegacySchema(error)) {
            slugSchemaSupported = false;
            ({ data, error } = await (typeof limit === 'number'
                ? buildNoticiasQuery(LEGACY_NOTICIA_COLUMNS).limit(limit)
                : buildNoticiasQuery(LEGACY_NOTICIA_COLUMNS)));
        }

        if (error) {
            throw new Error('No se pudieron cargar las noticias.');
        }

        if (slugSchemaSupported === null) {
            slugSchemaSupported = columns === NOTICIA_COLUMNS;
        }

        return assignGeneratedSlugs(data || []);
    }

    async function fetchLatestNoticias(limit) {
        return fetchNoticiasRecords(limit);
    }

    async function fetchNoticias() {
        return fetchNoticiasRecords();
    }

    async function fetchNoticiaBySlug(slug) {
        if (slugSchemaSupported !== false) {
            const { data, error } = await getSupabaseClient()
                .from('noticias')
                .select(NOTICIA_COLUMNS)
                .eq('slug', slug)
                .maybeSingle();

            if (!error) {
                slugSchemaSupported = true;
                return data;
            }

            if (!shouldFallbackToLegacySchema(error)) {
                throw new Error('No se pudo cargar la noticia.');
            }

            slugSchemaSupported = false;
        }

        const noticias = await fetchNoticiasRecords();
        return noticias.find((noticia) => noticia.slug === slug) || null;
    }

    function formatFecha(value) {
        if (!value) {
            return 'Sin fecha';
        }

        return DATE_FORMATTER.format(new Date(value));
    }

    function createExcerpt(value, maxLength) {
        const normalizedText = (value || '').replace(/\s+/g, ' ').trim();

        if (!normalizedText) {
            return '';
        }

        if (normalizedText.length <= maxLength) {
            return normalizedText;
        }

        const truncatedText = normalizedText.slice(0, maxLength);
        const cutIndex = truncatedText.lastIndexOf(' ');
        const safeText = cutIndex > 0 ? truncatedText.slice(0, cutIndex) : truncatedText;

        return safeText.trim() + '...';
    }

    function buildNoticiaUrl(slug) {
        return 'noticia.html?slug=' + encodeURIComponent(slug);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderParagraphs(container, text) {
        if (!container) {
            return;
        }

        const paragraphs = String(text || '')
            .replace(/\r\n/g, '\n')
            .split(/\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

        container.innerHTML = '';

        if (!paragraphs.length) {
            const emptyParagraph = document.createElement('p');
            emptyParagraph.textContent = 'Esta noticia no tiene contenido disponible por el momento.';
            container.appendChild(emptyParagraph);
            return;
        }

        const fragment = document.createDocumentFragment();

        paragraphs.forEach((paragraph) => {
            const paragraphElement = document.createElement('p');
            paragraphElement.textContent = paragraph;
            fragment.appendChild(paragraphElement);
        });

        container.appendChild(fragment);
    }

    window.CDENoticiasApi = {
        buildNoticiaUrl,
        createExcerpt,
        escapeHtml,
        fetchLatestNoticias,
        fetchNoticias,
        fetchNoticiaBySlug,
        formatFecha,
        renderParagraphs,
    };
})();
