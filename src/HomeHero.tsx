import './home-hero.css';

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <h1 id="hero-title"><span>Graciano</span>{' '}compartiendo emociones</h1>
          <p>Vinos, espumantes y destilados.<br />Elegí online y decidí cómo recibir tu compra.</p>
          <a className="button primary home-hero-cta" href="#catalogo-completo">Ver productos</a>
        </div>
      </div>
      <div className="home-hero-photo" aria-hidden="true">
        <img src="/assets/graciano-hero-botellas.webp" alt="" width={1062} height={724} fetchPriority="high" />
      </div>
    </section>
  );
}
