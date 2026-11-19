import './add-to-cart-button.css';

type AddToCartButtonProps = {
  productName: string;
  onAdd: () => void;
  className?: string;
};

export function AddToCartButton({ productName, onAdd, className }: AddToCartButtonProps) {
  const classes = ['button primary add-to-cart-button', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} aria-label={`Agregar ${productName} al carrito`} onClick={onAdd}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h3l3 13h11l3-10H6" />
        <circle cx="9" cy="20" r="1.25" />
        <circle cx="18" cy="20" r="1.25" />
      </svg>
      <span>Agregar</span>
    </button>
  );
}
