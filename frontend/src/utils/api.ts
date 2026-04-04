export function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return `/${route}`;
  }

  const apiPort = import.meta.env.VITE_API_PORT || '5001';
  return `http://localhost:${apiPort}/${route}`;
}
