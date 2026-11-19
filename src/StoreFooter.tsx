import { Link } from 'react-router';
import './store-footer.css';

const whatsapp = 'https://wa.me/5493516751795';
const instagram = 'https://www.instagram.com/gracianovinoteca/';

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <section id="contacto" className="store-footer-contact" tabIndex={-1} aria-label="Contacto">
        <p>Córdoba, Argentina</p>
        <div className="store-footer-channels">
          <span>Redes y contacto</span>
          <ul>
            <li>
              <a href={instagram} target="_blank" rel="noreferrer" aria-label="Ver Instagram de Graciano" title="Instagram">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </li>
            <li>
              <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Escribir a Graciano por WhatsApp" title="WhatsApp">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.7a9 9 0 0 1-13.6 7.8L3 21l1.5-4.4A9 9 0 1 1 21 11.7Z" />
                  <path d="M9 7.5 8 8.6c-.6.6.2 2.6 2 4.4s3.8 2.6 4.4 2l1.1-1-2-1.4-.9.8a6 6 0 0 1-3-3l.8-.9Z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </section>
      <div className="store-footer-notes">
        <p>Venta exclusiva a mayores de 18 años. Beber con moderación.</p>
        <p className="store-footer-credit">
          <Link to="/admin">Panel de demostración</Link>
          <span aria-hidden="true"> · </span>
          <span>Una propuesta de <strong>LinusTec</strong></span>
        </p>
      </div>
    </footer>
  );
}
