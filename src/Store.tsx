import { useEffect, useRef, useState } from 'react';
import { AddToCartButton } from './AddToCartButton';
import { Checkout } from './Checkout';
import { Dialog } from './Dialog';
import { FeaturedCatalog } from './FeaturedCatalog';
import { HomeHeader } from './HomeHeader';
import { HomeHero } from './HomeHero';
import { StoreFooter } from './StoreFooter';
import { branches, categories, maxQuantity, money, productImage } from './commerce';
import type { Cart, Category, Product } from './commerce';
import { demoRepository } from './repository';

const allCategories = ['Todos', ...categories] as const;
type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

function normalize(text: string) {
  return text.toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function ProductImages({ product }: { product: Product }) {
  return (product.images.length ? product.images : [null]).map((_, index) =>
    <img key={index} src={productImage(product, index)} alt={product.name} loading="lazy" />,
  );
}

export function Store({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Cart>(demoRepository.loadCart);
  const [category, setCategory] = useState<Category | 'Todos'>('Todos');
  const [sort, setSort] = useState<Sort>('featured');
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [detail, setDetail] = useState<Product>();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const searchToggle = useRef<HTMLButtonElement>(null);
  const featuredGifts = products
    .filter(({ category, stock }) => category === 'Regalos' && Object.values(stock).some((units) => units > 0))
    .slice(0, 3);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const visible = products.filter((product) =>
    (category === 'Todos' || category === product.category)
    && normalize([product.name, product.brand, product.variety].join(' ')).includes(normalize(query)),
  );
  if (sort === 'price-asc') visible.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') visible.sort((a, b) => b.price - a.price);
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));

  useEffect(() => {
    if (showSearch) searchInput.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(''), 2700);
    return () => clearTimeout(timeout);
  }, [feedback]);

  function updateCart(next: Cart, message = '') {
    setCart(next);
    try {
      demoRepository.saveCart(next);
      setFeedback(message);
    } catch {
      setFeedback('El carrito funciona en esta página, pero el navegador no pudo guardarlo.');
    }
  }

  function add(product: Product, amount = 1) {
    const saved = cart[product.id] ?? 0;
    if (saved >= maxQuantity) {
      setFeedback('Máximo de 24 unidades por producto.');
      return;
    }
    const next = Math.min(saved + amount, maxQuantity);
    updateCart({ ...cart, [product.id]: next }, next < saved + amount
      ? 'Se agregó hasta el máximo de 24 unidades por producto.'
      : `${product.name} se agregó al carrito.`);
  }

  function viewProduct(product: Product) {
    setDetail(product);
    setQuantity(1);
  }

  function toggleSearch(returnFocus: HTMLButtonElement) {
    searchToggle.current = returnFocus;
    if (showSearch) setQuery('');
    else setCategory('Todos');
    setShowSearch(!showSearch);
  }

  return (
    <>
      <a className="skip-link" href="#catalogo-completo">Ir al catálogo</a>
      <div className="preview-note" role="region" aria-label="Aviso de demostración"><span>Boceto interactivo de LinusTec</span><span>Productos y precios de ejemplo · Sin cobros reales</span></div>
      <HomeHeader count={count} showSearch={showSearch} onToggleSearch={toggleSearch}
        onOpenCart={() => setCartOpen(true)} />
      <main id="inicio">
        <HomeHero />
        <div className="benefits home-services">
          <div><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 10V5h18v5M4 10v11h16V10M2 10h20M9 21v-7h6v7M3 5l2-3h14l2 3" /></svg><span>Retiro en <strong>tres sucursales</strong></span></div>
          <div><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 7h13v12H2ZM15 11h4l3 4v4h-7M7 19a2 2 0 1 0 4 0m7 0a2 2 0 1 0 4 0" /></svg><span>Envíos <strong>en Córdoba y a todo el país</strong></span></div>
          <div><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18v12H3ZM3 10h18M6 15h5" /></svg><span>Todos los <strong>medios de pago</strong></span></div>
        </div>
        <FeaturedCatalog products={featuredGifts} onAdd={add}
          onViewProduct={viewProduct} />
        <section id="catalogo-completo" className="shop section-wrap" tabIndex={-1}
          aria-labelledby="catalog-title">
          <div className="section-heading"><h2 id="catalog-title">Catálogo completo</h2></div>
          <div className="store-layout">
            <aside className="store-sidebar">
              <h3>Categorías</h3>
              <div className="categories" role="group" aria-label="Categorías">
                {allCategories.map((item) => (
                  <button key={item} aria-pressed={category === item}
                    className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>
                    {item === 'Todos' ? 'Ver todo' : item}
                  </button>
                ))}
              </div>
            </aside>
            <div className="store-results">
              <div className="catalog-toolbar">
                <span role="status">{visible.length} {visible.length === 1 ? 'producto' : 'productos'}</span>
                <label className="sort"><span className="sr-only">Ordenar productos</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                    <option value="featured">Recomendados</option><option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option><option value="name">Nombre A–Z</option>
                  </select>
                  <svg aria-hidden="true" viewBox="0 0 12 8"><path d="m1 1 5 5 5-5" /></svg>
                </label>
              </div>
              <div className="search-bar" id="catalog-search" hidden={!showSearch}>
                <label htmlFor="search">Buscá por nombre, bodega o variedad</label>
                <div><input ref={searchInput} type="search" id="search" value={query}
                  onChange={(event) => setQuery(event.target.value)} placeholder="Por ejemplo: malbec"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      setShowSearch(false);
                      setQuery('');
                      searchToggle.current?.focus();
                    }
                  }} />
                  <button onClick={() => { setQuery(''); searchInput.current?.focus(); }}>Limpiar</button></div>
              </div>
              {visible.length ? <div className="products">
                {visible.map((product) => (
                  <article className="product" key={product.id}>
                    <button className={`product-image ${product.images.length > 1 ? 'multi-image' : ''}`}
                      aria-label={`Ver detalle de ${product.name}`} onClick={() => viewProduct(product)}>
                      <ProductImages product={product} />
                    </button>
                    <div className="product-info">
                      <div className="product-type">{product.brand} · {product.category}</div>
                      <button className="product-title" onClick={() => viewProduct(product)}>{product.name}</button>
                      <div className="product-size">{product.variety} · {product.size}</div>
                      <div className="product-bottom"><span className="price">{money(product.price)}</span>
                        {Object.values(product.stock).some((stock) => stock > 0)
                          ? <AddToCartButton productName={product.name} onAdd={() => add(product)} />
                          : <span className="product-unavailable">Agotado</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div> : <div className="empty-state"><h3>No encontramos ese producto.</h3>
                <button className="button primary" onClick={() => { setCategory('Todos'); setQuery(''); }}>Ver todos los productos</button>
              </div>}
            </div>
          </div>
        </section>
        <section id="locales" className="locations section-wrap" tabIndex={-1} aria-labelledby="locations-title">
          <div className="section-heading"><h2 id="locations-title">Nuestras sucursales</h2></div>
          <div className="locations-grid">
            {branches.map((branch) => (
              <article key={branch.id}><span>{branch.area.toUpperCase()}</span><h3>{branch.name}</h3>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Graciano ${branch.name} Córdoba`)}`}
                  target="_blank" rel="noreferrer">Cómo llegar</a></article>
            ))}
          </div>
        </section>
      </main>
      <StoreFooter />
      <div className={`toast ${feedback ? 'visible' : ''}`} role="status">{feedback}</div>
      {detail && <Dialog label={detail.name} className="product-dialog" close={() => setDetail(undefined)}>
        <div className="modal-dismiss">
          <button className="close-dialog icon-button" aria-label="Cerrar detalle" onClick={() => setDetail(undefined)}>×</button>
        </div>
        <div className="detail">
          <div className={`detail-image ${detail.images.length > 1 ? 'multi-image' : ''}`}><ProductImages product={detail} /></div>
          <div className="detail-copy">
            <div className="eyebrow">{detail.brand}</div><h2>{detail.name}</h2><p>{detail.description}</p>
            <ul><li>{detail.variety}</li><li>{detail.size}</li></ul><p>Origen: {detail.origin}</p>
            <div className="price">{money(detail.price)}</div>
            {Object.values(detail.stock).some((stock) => stock > 0) ? <div className="detail-buy">
              <div className="quantity">
                <button aria-label="Quitar una unidad" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}>−</button>
                <span>{quantity}</span>
                <button aria-label="Sumar una unidad" disabled={quantity === maxQuantity} onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <AddToCartButton productName={detail.name} onAdd={() => { add(detail, quantity); setDetail(undefined); }} />
            </div> : <p>Agotado en todas las sucursales de la demo.</p>}
          </div>
        </div>
      </Dialog>}
      {cartOpen && <Checkout products={products} cart={cart} updateCart={updateCart} close={() => setCartOpen(false)} />}
    </>
  );
}
