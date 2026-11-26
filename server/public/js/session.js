const Session = {
  token() {
    return localStorage.getItem("jwt");
  },
  logout() {
    localStorage.clear();
    window.location.replace("/index.html");
  },
  async fetch(url, options = {}) {
    const token = Session.token();
    if (!token) {
      Session.logout();
      throw new Error("Sessão ausente");
    }
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      Session.logout();
      throw new Error(data.error || "Sessão expirada");
    }
    if (!response.ok) throw new Error(data.error || "Erro na requisição");
    return data;
  },
  user() {
    return Session.fetch("/auth/user");
  }
};
