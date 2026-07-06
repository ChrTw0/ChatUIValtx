import './Navbar.styles.css';

interface Props {
  title: string;
  onIndicadores?: () => void;
}

export function Navbar({ title, onIndicadores }: Props) {
  return (
    <div className="Navbar">
      <div className="Navbar-main">
        <h1 className="Navbar-title">{title}</h1>
      </div>
      {onIndicadores && (
        <button className="Navbar-indicadores" onClick={onIndicadores}>
          Indicadores
        </button>
      )}
    </div>
  );
}
