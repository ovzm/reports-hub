document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("jwt")) {
    window.location.replace("/page/home.html");
    return;
  }

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    msg.textContent = "";
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("email").value,
          senha: document.getElementById("senha").value
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      localStorage.setItem("jwt", data.token);
      window.location.replace("/page/home.html");
    } catch (error) {
      msg.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  // document.getElementById("msLoginBtn")?.addEventListener("click", () => {
  //   window.location.href = "/auth/microsoft";
  // });
});
