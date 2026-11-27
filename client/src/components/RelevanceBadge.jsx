export default function RelevanceBadge({ value = "Middle" }) {
  return <span className={`chip relevance-${value.toLowerCase()}`}>Relevância: {value}</span>;
}
