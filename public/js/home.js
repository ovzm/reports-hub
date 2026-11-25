(async () => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  if (tokenFromUrl) {
    localStorage.setItem("jwt", tokenFromUrl);
    window.history.replaceState({}, "", "/page/home.html");
  }

  document.getElementById("logoutBtn").addEventListener("click", Session.logout);

  try {
    const user = await Session.user();
    document.getElementById("userLabel").textContent = `${user.nome || user.email} · ${user.role === "admin" ? "Admin" : "Usuário"}`;
    document.getElementById("bookAdminChoice").hidden = !user.isBookAdmin;
  } catch {
    Session.logout();
  }
})();
