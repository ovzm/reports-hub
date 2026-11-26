import { BarChart3 } from "lucide-react";

export default function Brand({ light = false }) {
  return (
    <div className={`brand ${light ? "light" : ""}`}>
      <span className="brand-mark">
        <BarChart3 size={18} />
      </span>
      <span className="brand-name">Reports Hub</span>
    </div>
  );
}
