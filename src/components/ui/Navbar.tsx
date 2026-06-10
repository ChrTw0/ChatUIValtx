import './Navbar.styles.css';

interface Props {
  title: string;
}

export function Navbar({ title }: Props) {
  return (
    <div className="Navbar">
      <div className="Navbar-main">
        <h1 className="Navbar-title">{title}</h1>
      </div>
    </div>
  );
}
