import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Convert Axios errors to user-friendly messages
 */
export const handleApiError = (error: unknown): string => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Server returned an error response
    if (status && data) {
      // Check if server sent a custom error message
      if (data.message) {
        return data.message;
      }
      if (data.error) {
        return data.error;
      }
    }

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return 'Requête invalide. Veuillez vérifier vos données.';
      case 401:
        return 'Vous n\'êtes pas authentifié. Veuillez vous connecter.';
      case 403:
        return 'Vous n\'avez pas les permissions nécessaires pour cette action.';
      case 404:
        return 'Ressource introuvable.';
      case 409:
        return 'Cette ressource existe déjà.';
      case 422:
        return 'Les données fournies ne sont pas valides.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      case 503:
        return 'Service temporairement indisponible. Veuillez réessayer plus tard.';
      default:
        if (status && status >= 500) {
          return 'Erreur serveur. Veuillez réessayer plus tard.';
        }
        if (status && status >= 400) {
          return 'Erreur lors de la requête. Veuillez réessayer.';
        }
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return 'La requête a pris trop de temps. Veuillez réessayer.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Problème de connexion. Vérifiez votre connexion internet.';
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || 'Une erreur inattendue s\'est produite.';
  }

  // Fallback
  return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
};

/**
 * Extract error details for logging/debugging
 */
export const getErrorDetails = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return {
      message: handleApiError(error),
      status: error.response?.status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Une erreur inattendue s\'est produite.',
  };
};

