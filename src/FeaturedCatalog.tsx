import { AddToCartButton } from './AddToCartButton';
import { money, productImage } from './commerce';
import type { Product } from './commerce';
import './featured-catalog.css';

type FeaturedCatalogProps = {
  products: Product[];
  onAdd: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
};

type PromotionCardProps = Pick<FeaturedCatalogProps, 'onAdd' | 'onViewProduct'> & { product: Product };

function PromotionCard({ product, onAdd, onViewProduct }: PromotionCardProps) {
  const available = Object.values(product.stock).some((quantity) => quantity > 0);

  return (
    <article className="featured-product">
      <img className="featured-product-image" src={productImage(product)} alt={product.name} loading="lazy" />
      <div className="featured-product-info">
        <div className="featured-product-copy">
          <h3>
            {onViewProduct
              ? <button type="button" className="featured-product-title"
                  onClick={() => onViewProduct(product)}>{product.name}</button>
              : product.name}
          </h3>
          <p className="featured-product-variety">{product.variety}</p>
          <p className="featured-product-origin">{product.origin}</p>
          <p className="featured-product-price">{money(product.price)}</p>
        </div>
        <div className="featured-product-action">
          {available
            ? <AddToCartButton productName={product.name} onAdd={() => onAdd(product)} className="featured-product-add" />
            : <p className="featured-product-origin">Agotado</p>}
        </div>
      </div>
    </article>
  );
}

export function FeaturedCatalog({ products, onAdd, onViewProduct }: FeaturedCatalogProps) {
  return (
    <section id="tienda" className="featured-catalog section-wrap" tabIndex={-1}
      aria-labelledby="featured-catalog-heading">
      <div className="featured-catalog-heading">
        <div>
          <h2 id="featured-catalog-heading">Promociones</h2>
          {products.length > 0 && <p>Selecciones para regalar</p>}
        </div>
        <a href="#catalogo-completo" className="featured-catalog-all">Ver todos</a>
      </div>
      {products.length > 0 ? (
        <div className="featured-catalog-grid">
          {products.map((product) => (
            <PromotionCard key={product.id} product={product} onAdd={onAdd} onViewProduct={onViewProduct} />
          ))}
        </div>
      ) : <p className="featured-catalog-empty">Por ahora no hay selecciones para regalar.</p>}
    </section>
  );
}
