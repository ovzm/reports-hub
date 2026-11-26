import { loadUsers, saveUsers, hashPassword, normalizeEmail, ROLES } from "../src/users.js";
import { REPORTS_FILE } from "../src/paths.js";
import { readJson } from "../src/store.js";

const [command, ...args] = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function positional() {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) { i++; continue; }
    values.push(args[i]);
  }
  return values;
}

function parseAccess(value) {
  if (value === undefined) return undefined;
  const list = String(value).split(",").map(item => item.trim()).filter(Boolean);
  const known = readJson(REPORTS_FILE, []).map(report => report.id);
  const unknown = list.filter(id => id !== "*" && !known.includes(id));
  if (unknown.length) console.warn(`Aviso: relatórios não encontrados no catálogo: ${unknown.join(", ")}`);
  return list;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function help() {
  console.log(`
Uso: npm run user -- <comando> [argumentos]

  list                                         Lista usuários e permissões
  reports                                      Lista os IDs de relatórios disponíveis
  add <email> <senha> --nome "Nome" [--role admin|user] [--acessos id1,id2|*]
  access <email> <id1,id2|*>                   Define os relatórios que o usuário vê
  role <email> <admin|user>                    Altera o perfil do usuário
  password <email> <nova-senha>                Altera a senha
  remove <email>                               Remove o usuário
`);
}

const users = loadUsers();
const [emailArg, second] = positional();
const email = normalizeEmail(emailArg);
const user = users.find(item => item.email === email);

switch (command) {
  case "list":
    console.table(users.map(u => ({ email: u.email, nome: u.nome, role: u.role, acessos: (u.acessos || []).join(", ") || "(nenhum)" })));
    break;
  case "reports":
    console.table(readJson(REPORTS_FILE, []).map(r => ({ id: r.id, titulo: r.title, tipo: r.tipo })));
    break;
  case "add": {
    if (!email || !second) fail("Informe e-mail e senha.");
    if (user) fail("Já existe um usuário com esse e-mail.");
    const role = option("role") || "user";
    if (!ROLES.includes(role)) fail(`Perfil inválido. Use: ${ROLES.join(", ")}`);
    users.push({
      email,
      nome: option("nome") || email.split("@")[0],
      role,
      acessos: parseAccess(option("acessos")) || [],
      senhaHash: hashPassword(second)
    });
    saveUsers(users);
    console.log(`Usuário ${email} criado.`);
    break;
  }
  case "access":
    if (!user) fail("Usuário não encontrado.");
    user.acessos = parseAccess(second || "");
    saveUsers(users);
    console.log(`Acessos de ${email}: ${user.acessos.join(", ") || "(nenhum)"}`);
    break;
  case "role":
    if (!user) fail("Usuário não encontrado.");
    if (!ROLES.includes(second)) fail(`Perfil inválido. Use: ${ROLES.join(", ")}`);
    user.role = second;
    saveUsers(users);
    console.log(`${email} agora é ${second}.`);
    break;
  case "password":
    if (!user || !second) fail("Informe um usuário existente e a nova senha.");
    user.senhaHash = hashPassword(second);
    saveUsers(users);
    console.log(`Senha de ${email} alterada.`);
    break;
  case "remove":
    if (!user) fail("Usuário não encontrado.");
    saveUsers(users.filter(item => item !== user));
    console.log(`Usuário ${email} removido.`);
    break;
  default:
    help();
}
