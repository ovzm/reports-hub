import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

export const RELEVANCE = [
  { value: "High", label: "High", description: "Alta" },
  { value: "Middle", label: "Middle", description: "Média" },
  { value: "Low", label: "Low", description: "Baixa" }
];

export const EMPTY_FILTERS = { query: "", ano: "", weekId: "", classeId: "", estrategiaId: "", relevancia: "" };

export const normalize = value => String(value ?? "").trim().toLocaleLowerCase("pt-BR");

export function sortYears(values) {
  return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => Number(b) - Number(a));
}

export function sortWeeks(items) {
  return [...items].sort((a, b) => {
    const aNum = Number(String(a.nome).match(/\d+/)?.[0]);
    const bNum = Number(String(b.nome).match(/\d+/)?.[0]);
    if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) return bNum - aNum;
    return String(a.nome).localeCompare(String(b.nome), "pt-BR", { numeric: true });
  });
}

export function sortByName(items) {
  return [...items].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function matchesReport(report, filters) {
  const query = normalize(filters.query);
  if (query) {
    const haystack = [report.nome, report.descricao, report.texto, report.textoPDF, report.weekNome, report.classeNome, report.estrategiaNome, report.relevancia]
      .map(normalize)
      .join(" ");
    if (!haystack.includes(query)) return false;
  }
  if (filters.ano && String(report.ano) !== String(filters.ano)) return false;
  if (filters.weekId && Number(report.weekId) !== Number(filters.weekId)) return false;
  if (filters.classeId && Number(report.classeId) !== Number(filters.classeId)) return false;
  if (filters.estrategiaId && Number(report.estrategiaId) !== Number(filters.estrategiaId)) return false;
  if (filters.relevancia && (report.relevancia || "Middle") !== filters.relevancia) return false;
  return true;
}

export function sortReports(list) {
  return [...list].sort(
    (a, b) =>
      String(b.ano).localeCompare(String(a.ano), "pt-BR", { numeric: true }) ||
      String(b.weekNome || "").localeCompare(String(a.weekNome || ""), "pt-BR", { numeric: true }) ||
      String(a.nome).localeCompare(String(b.nome), "pt-BR")
  );
}

export function useBookData() {
  const [data, setData] = useState({ reports: [], weeks: [], classes: [], strategies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const [reports, weeks, classes, strategies] = await Promise.all([
        api("/api/book/reports"),
        api("/api/book/weeks"),
        api("/api/book/classes"),
        api("/api/book/strategies")
      ]);
      setData({ reports, weeks, classes, strategies });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}
