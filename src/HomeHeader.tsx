import { useEffect, useRef, useState } from 'react';
import './home-header.css';

type HomeHeaderProps = {
  count: number;
  showSearch: boolean;
  onToggleSearch: (returnFocus: HTMLButtonElement) => void;
  onOpenCart: () => void;
};

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
}

export function HomeHeader({ count, showSearch, onToggleSearch, onOpenCart }: HomeHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (menuOpen) firstLink.current?.focus({ preventScroll: true });
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    if (menuOpen) menuToggle.current?.focus({ preventScroll: true });
  }

  const searchLabel = showSearch ? 'Cerrar búsqueda' : 'Buscar productos';

  return (
    <header className="header home-header" onKeyDown={(event) => {
      if (!menuOpen || event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu();
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
    }}>
      <button type="button" className="icon-button home-header__menu" ref={menuToggle}
        aria-controls="home-navigation" aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      <a href="#inicio" className="brand home-header__brand" aria-label="Graciano, inicio"
        onClick={() => setMenuOpen(false)}>
        <img src="/assets/graciano-logo-violeta.png" alt="Graciano Bebidas & Sabores" />
      </a>
      <nav className="home-header__nav" id="home-navigation" aria-label="Navegación principal" data-open={menuOpen}>
        <a href="#tienda" ref={firstLink} onClick={closeMenu}>Promos</a>
        <a href="#catalogo-completo" onClick={closeMenu}>Catálogo</a>
        <a href="#locales" onClick={closeMenu}>Sucursales</a>
        <a href="#contacto" onClick={closeMenu}>Contacto</a>
        <button type="button" className="home-header__mobile-search"
          aria-controls="catalog-search" aria-expanded={showSearch}
          onClick={(event) => {
            if (showSearch) closeMenu();
            else setMenuOpen(false);
            onToggleSearch(menuToggle.current ?? event.currentTarget);
          }}>
          <SearchIcon />{searchLabel}
        </button>
      </nav>
      <div className="header-actions home-header__actions">
        <button type="button" className="icon-button home-header__desktop-search"
          aria-controls="catalog-search" aria-expanded={showSearch}
          aria-label={searchLabel} onClick={(event) => onToggleSearch(event.currentTarget)}>
          <SearchIcon />
        </button>
        <button type="button" className="cart-button home-header__cart"
          aria-label={`Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
          onClick={() => { setMenuOpen(false); onOpenCart(); }}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2" /></svg>
          <span className="home-header__cart-count" id="cart-count" aria-hidden="true">{count}</span>
        </button>
      </div>
    </header>
  );
}
