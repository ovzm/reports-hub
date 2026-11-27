import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { sortWeeks, sortYears } from "../../lib/book.js";

export default function PeriodTree({ reports, weeks, filters, onSelect }) {
  const years = sortYears(reports.map(report => report.ano));
  const [open, setOpen] = useState(() => new Set(filters.ano ? [filters.ano] : years.slice(0, 1)));

  useEffect(() => {
    if (filters.ano) setOpen(current => new Set(current).add(String(filters.ano)));
  }, [filters.ano]);

  if (!years.length) return <p className="muted small">Ainda não há relatórios cadastrados.</p>;

  function toggle(year) {
    setOpen(current => {
      const next = new Set(current);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
    onSelect({ ano: year, weekId: "" });
  }

  return (
    <div className="period-tree">
      {years.map(year => {
        const yearReports = reports.filter(report => String(report.ano) === year);
        const weekIds = [...new Set(yearReports.map(report => String(report.weekId)))];
        const yearWeeks = sortWeeks(
          weekIds.map(id => weeks.find(week => String(week.id) === id) || { id, nome: yearReports.find(r => String(r.weekId) === id)?.weekNome || "Week" })
        );
        const expanded = open.has(year);
        const yearSelected = String(filters.ano) === year && !filters.weekId;

        return (
          <div key={year} className="period-year">
            <button className={`period-year-btn ${yearSelected ? "selected" : ""}`} onClick={() => toggle(year)} aria-expanded={expanded}>
              <ChevronRight size={16} className={`chevron ${expanded ? "open" : ""}`} />
              <span>{year}</span>
              <span className="count">{yearReports.length}</span>
            </button>
            {expanded && (
              <div className="period-weeks">
                {yearWeeks.map(week => {
                  const selected = String(filters.ano) === year && String(filters.weekId) === String(week.id);
                  const count = yearReports.filter(report => String(report.weekId) === String(week.id)).length;
                  return (
                    <button key={week.id} className={`period-week-btn ${selected ? "selected" : ""}`} onClick={() => onSelect({ ano: year, weekId: String(week.id) })}>
                      <span className="dot" />
                      <span>{week.nome}</span>
                      <span className="count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
