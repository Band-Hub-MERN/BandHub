type ApiErrorShape = {
  response?: {
    data?: {
      error?: unknown;
      details?: unknown;
    };
  };
};

export function hasApiResponse(error: unknown): error is Required<Pick<ApiErrorShape, 'response'>> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  );
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!hasApiResponse(error)) {
    return fallback;
  }

  const apiError = (error as ApiErrorShape).response?.data?.error;
  return typeof apiError === 'string' && apiError.trim() ? apiError : fallback;
}

export function getApiErrorDetails(error: unknown): string[] {
  if (!hasApiResponse(error)) {
    return [];
  }

  const details = (error as ApiErrorShape).response?.data?.details;
  if (!Array.isArray(details)) {
    return [];
  }

  return details.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
