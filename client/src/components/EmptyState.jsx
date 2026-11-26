export default function EmptyState({ icon: Icon, title, children, tone = "neutral" }) {
  return (
    <div className={`empty-state ${tone}`}>
      {Icon && (
        <div className="empty-icon">
          <Icon size={26} />
        </div>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
