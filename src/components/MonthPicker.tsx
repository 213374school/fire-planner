const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 251 }, (_, i) => 1950 + i);

interface Props {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

export function MonthPicker({ value, onChange }: Props) {
  const [y, m] = value.split("-").map(Number);

  const setYear = (year: number) => onChange(`${year}-${String(m).padStart(2, "0")}`);
  const setMonth = (month: number) => onChange(`${y}-${String(month).padStart(2, "0")}`);

  return (
    <div className="flex gap-1">
      <select value={m} onChange={e => setMonth(Number(e.target.value))} className="input w-auto">
        {MONTH_LABELS.map((label, i) => (
          <option key={i + 1} value={i + 1}>{label}</option>
        ))}
      </select>
      <select value={y} onChange={e => setYear(Number(e.target.value))} className="input flex-1">
        {YEARS.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
}
