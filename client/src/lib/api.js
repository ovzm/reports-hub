const TOKEN_KEY = "reports-hub:token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: token => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

export async function api(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(path, { method, headers, body: payload, signal });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event("auth:expired"));
  }
  if (!response.ok) throw new ApiError(data.error || "Não foi possível concluir a operação.", response.status);
  return data;
}

export function withToken(url) {
  const token = tokenStore.get();
  return token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;
}
