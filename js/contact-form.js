document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario-contacto');

    if (!formulario) {
        return;
    }

    const boton = formulario.querySelector('.boton-enviar');
    const feedback = document.getElementById('mensaje-contacto-feedback');
    const endpoint = formulario.dataset.contactEndpoint;
    const nombreInput = document.getElementById('nombre-contacto');
    const telefonoInput = document.getElementById('telefono-contacto');
    const correoInput = document.getElementById('correo-contacto');
    const mensajeInput = document.getElementById('mensaje-contacto');
    const companyInput = document.getElementById('empresa-contacto');

    if (!boton || !feedback || !nombreInput || !telefonoInput || !correoInput || !mensajeInput || !companyInput) {
        return;
    }

    const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,120}$/;
    const telefonoRegex = /^[0-9+\s()-]{7,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setFeedback = (tipo, mensaje) => {
        feedback.textContent = mensaje;
        feedback.className = `mensaje-contacto-feedback visible ${tipo}`;
    };

    const limpiarFeedback = () => {
        feedback.textContent = '';
        feedback.className = 'mensaje-contacto-feedback';
    };

    const setLoading = (activo) => {
        boton.disabled = activo;
        boton.textContent = activo ? 'Enviando...' : 'Enviar consulta';
        formulario.setAttribute('aria-busy', activo ? 'true' : 'false');
    };

    const normalizarTexto = (valor) => valor.trim().replace(/\s+/g, ' ');

    const validar = () => {
        const nombre = normalizarTexto(nombreInput.value);
        const telefono = normalizarTexto(telefonoInput.value);
        const email = normalizarTexto(correoInput.value).toLowerCase();
        const mensaje = mensajeInput.value.replace(/\r\n/g, '\n').trim();
        const company = companyInput.value.trim();

        if (!nombreRegex.test(nombre)) {
            return { error: 'Ingresá un nombre válido, usando solo letras y al menos 3 caracteres.' };
        }

        if (!telefonoRegex.test(telefono)) {
            return { error: 'Ingresá un teléfono válido, con entre 7 y 20 caracteres.' };
        }

        if (!emailRegex.test(email)) {
            return { error: 'Ingresá un correo electrónico válido.' };
        }

        if (mensaje.length < 10 || mensaje.length > 2000) {
            return { error: 'El mensaje debe tener entre 10 y 2000 caracteres.' };
        }

        return {
            data: {
                nombre,
                telefono,
                email,
                mensaje,
                company,
            },
        };
    };

    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();
        limpiarFeedback();

        if (!endpoint) {
            setFeedback('error', 'El formulario no está configurado correctamente.');
            return;
        }

        const resultado = validar();

        if (resultado.error) {
            setFeedback('error', resultado.error);
            return;
        }

        setLoading(true);
        setFeedback('info', 'Enviando consulta...');

        try {
            const respuesta = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(resultado.data),
            });

            const payload = await respuesta.json().catch(() => ({}));
            const mensaje = payload.message || 'No pudimos procesar tu consulta.';

            if (respuesta.ok) {
                if (respuesta.status === 202 || payload.status === 'stored_without_email') {
                    setFeedback('warning', mensaje);
                } else {
                    setFeedback('success', mensaje);
                }

                formulario.reset();
                return;
            }

            if (respuesta.status === 429) {
                setFeedback('error', mensaje);
                return;
            }

            if (respuesta.status === 400 || respuesta.status === 415) {
                setFeedback('error', mensaje);
                return;
            }

            setFeedback('error', mensaje);
        } catch (error) {
            console.error(error);
            setFeedback('error', 'No pudimos enviar la consulta. Revisá tu conexión e intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    });
});