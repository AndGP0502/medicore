import { AxiosError } from 'axios';

interface FastAPIErrorBody {
  detail?: string | { msg?: string; loc?: (string | number)[] }[];
}

/** Traduce errores HTTP del backend a mensajes claros para el usuario. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Sin conexión con el servidor. Verifica tu red o la URL del servidor en Perfil.';
    }
    const { status } = error.response;
    const body = error.response.data as FastAPIErrorBody | undefined;
    const detail = body?.detail;

    if (typeof detail === 'string' && detail.trim()) return detail;

    if (status === 422 && Array.isArray(detail)) {
      const first = detail[0];
      const field = first?.loc?.slice(1).join('.') ?? '';
      const msg = first?.msg ?? 'Datos inválidos';
      return field ? `${field}: ${msg}` : msg;
    }

    switch (status) {
      case 400:
        return 'Solicitud inválida. Revisa los datos ingresados.';
      case 401:
        return 'Sesión expirada. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return 'Conflicto: el registro ya existe o está en uso.';
      case 422:
        return 'Los datos enviados no son válidos.';
      default:
        return status >= 500
          ? 'Error interno del servidor. Intenta de nuevo más tarde.'
          : `Error inesperado (${status}).`;
    }
  }
  return 'Ocurrió un error inesperado.';
}
