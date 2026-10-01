import axios from 'axios';

/**
 * Obtiene el mensaje más descriptivo posible de un error de axios.
 * Combina el mensaje genérico del backend (data.message) con el detalle de la base (data.error)
 * para que el usuario vea la causa real, ej: "Error al agregar cliente: Violation of UNIQUE KEY...".
 */
export const getErrorMessage = (error: any, fallback = 'Ocurrió un error inesperado'): string => {
  const data = error?.response?.data;

  if (data && typeof data === 'object') {
    const message: string | undefined = data.message;
    const detalle: string | undefined = data.error;

    if (message && detalle && !message.includes(detalle)) return `${message}: ${detalle}`;
    if (message) return message;
    if (detalle) return detalle;
  }

  if (error?.request && !error?.response) return 'No se pudo conectar con el servidor';

  return error?.message || fallback;
};

/**
 * Registra un interceptor global que deja el mensaje detallado en error.message y en
 * error.response.data.message, así los servicios existentes lo muestran sin cambios.
 */
export const setupAxiosErrorInterceptor = (): void => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!axios.isCancel(error)) {
        const mensaje = getErrorMessage(error);
        if (error.response?.data && typeof error.response.data === 'object') {
          error.response.data.message = mensaje;
        }
        error.message = mensaje;
      }
      return Promise.reject(error);
    }
  );
};
