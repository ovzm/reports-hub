export default function Spinner({ fullscreen = false, label = "Carregando..." }) {
  return (
    <div className={fullscreen ? "spinner-screen" : "spinner-inline"} role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
