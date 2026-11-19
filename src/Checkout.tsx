import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import styled from 'styled-components';
import { Dialog } from './Dialog';
import { assessCart, branches, maxQuantity, money, productImage, transferMessage } from './commerce';
import { NationalDestinationFields } from './NationalDestinationFields';
import { exampleDays, quoteFeedback } from './shipping';
import type { NationalDestination, QuoteScenario } from './shipping';
import type { BranchId, Cart, Delivery, Payment, Product } from './commerce';

const Notice = styled.div`
  border-left: 3px solid #a05217;
  background: #fff4e7;
  color: #783b11;
  padding: 10px 12px;
  margin-block: 10px;
  font-size: .875rem;
  line-height: 1.5;
  p { margin: 0; }
`;

const paymentLabels: Record<Payment, string> = {
  'mercado-pago': 'Mercado Pago',
  transfer: 'Transferencia',
  cash: 'Pago al retirar',
};

type Order = {
  amounts: Pick<ReturnType<typeof assessCart>, 'subtotal' | 'shipping' | 'total' | 'quote'>;
  destination: string;
  method: Payment;
  state: string;
  dedication: string;
};
type Step = 'cart' | 'details' | 'message' | 'payment' | 'result';
type Outcome = 'approved' | 'pending' | 'rejected';

function Totals({ subtotal, shipping, total, quote }: Order['amounts']) {
  return (
    <div className="summary-totals">
      <div className="total-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="total-row">
        <span>{quote ? 'Costo de envío de ejemplo' : 'Retiro'}</span>
        <span>{shipping === null ? 'Sin calcular' : shipping ? money(shipping) : 'Sin costo'}</span>
      </div>
      {quote?.status === 'quoted' && <div className="total-row shipping-estimate">
        <span>Plazo estimado de ejemplo</span><span>{exampleDays(quote.days)}</span>
      </div>}
      <div className="total-row grand-total">
        <span>Total de ejemplo</span><strong aria-live="polite">{total === null ? 'Pendiente de envío' : money(total)}</strong>
      </div>
    </div>
  );
}

function SummaryItems({ lines }: Pick<ReturnType<typeof assessCart>, 'lines'>) {
  return lines.map(({ id, product, quantity, amount }) => (
    <div className="summary-item" key={id}>
      {product && <img src={productImage(product)} alt="" />}
      <div><p>{product?.name}</p><span>Cantidad: {quantity}</span></div>
      <b>{money(amount)}</b>
    </div>
  ));
}

export function Checkout({ products, cart, updateCart, close }: {
  products: Product[];
  cart: Cart;
  updateCart: (cart: Cart) => void;
  close: () => void;
}) {
  const [step, setStep] = useState<Step>('cart');
  const [branch, setBranch] = useState<BranchId>(branches[0].id);
  const [mode, setMode] = useState<Delivery['mode']>('pickup');
  const [method, setMethod] = useState<Payment>('mercado-pago');
  const [contact, setContact] = useState({ name: 'Cliente de ejemplo', email: 'cliente@example.com', address: '', postal: '', dedication: '' });
  const [nationalDestination, setNationalDestination] = useState<NationalDestination>({
    postal: '', province: '', locality: '', street: '', number: '', unit: '',
  });
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [scenario, setScenario] = useState<QuoteScenario>('standard');
  const [order, setOrder] = useState<Order>();
  const [paymentType, setPaymentType] = useState<'card' | 'balance'>('card');
  const [installments, setInstallments] = useState(1);
  const [outcome, setOutcome] = useState<Outcome>('approved');
  const [processing, setProcessing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const clickPending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const delivery: Delivery = mode === 'pickup' ? { mode, branch }
    : mode === 'national' ? { mode, destination: nationalDestination, requested: quoteRequested, scenario }
      : { mode };
  const assessment = assessCart(products, cart, delivery);
  const { source, lines, eligibleBranches, canConfirm, quote, total } = assessment;
  const branchName = branches.find(({ id }) => id === branch)?.name ?? '';
  const nationalAddress = [
    `${nationalDestination.street.trim()} ${nationalDestination.number.trim()}`.trim(),
    nationalDestination.unit.trim() && `piso/depto. ${nationalDestination.unit.trim()}`,
    nationalDestination.locality.trim(),
    nationalDestination.province,
    `CP ${nationalDestination.postal.trim()}`,
  ].filter(Boolean).join(', ');
  const destination = mode === 'national' ? nationalAddress : mode === 'shipping'
    ? `${contact.address.trim()}, Córdoba Capital, Córdoba, CP ${contact.postal.trim()}`
    : `Retiro en ${branchName}, Córdoba Capital, Córdoba`;
  const quoteStatus = mode === 'national' && quote && quote.status !== 'quoted' ? quoteFeedback[quote.status] : '';
  const previewMessage = step === 'message' ? transferMessage(assessment, destination, contact.dedication) : null;

  function consultQuote() {
    setQuoteRequested(true);
    setScenario('standard');
  }

  function changeNationalDestination(next: NationalDestination) {
    setNationalDestination(next);
    setScenario('standard');
  }

  const previousStep = useRef<Step>('cart');

  useEffect(() => {
    const target = heading.current;
    const dialog = target?.closest('dialog');
    if (previousStep.current !== step) {
      if (dialog) dialog.scrollTop = 0;
      target?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function changeQuantity(id: string, quantity: number) {
    const next = { ...cart };
    if (quantity <= 0) delete next[id];
    else next[id] = Math.min(quantity, maxQuantity);
    updateCart(next);
  }

  function finish(state: string) {
    if (!canConfirm || !source) {
      setStep('cart');
      return false;
    }
    setOrder({
      amounts: { subtotal: assessment.subtotal, total, shipping: assessment.shipping, quote },
      destination,
      method,
      state,
      dedication: contact.dedication.trim(),
    });
    setStep('result');
    return true;
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConfirm) {
      setStep('cart');
      return;
    }
    if (method === 'mercado-pago') setStep('payment');
    else if (method === 'transfer') setStep('message');
    else finish('Pago al retirar');
  }

  function simulatePayment() {
    if (clickPending.current || !canConfirm || total === null) return;
    clickPending.current = true;
    setProcessing(true);
    timer.current = setTimeout(() => {
      clickPending.current = false;
      setProcessing(false);
      const completed = finish({
        approved: 'Pago de prueba aprobado', pending: 'Pago de prueba pendiente', rejected: 'Pago de prueba rechazado',
      }[outcome]);
      if (completed && outcome === 'approved') updateCart({});
    }, 600);
  }

  const amountPerInstallment = Math.floor((total ?? 0) / 3);

  return (
    <Dialog label={step === 'cart' ? 'Mi carrito' : 'Compra de demostración'}
      className={step === 'cart' ? 'cart-dialog' : 'checkout-dialog'} close={close}>
      {step === 'cart' ? (
        <>
          <div className="drawer-header"><h2 ref={heading} tabIndex={-1}>Mi carrito</h2>
            <button className="icon-button" aria-label="Cerrar carrito" onClick={close}>×</button></div>
          {lines.length === 0 ? <div className="cart-empty"><h3>Tu carrito está vacío.</h3>
            <button className="button primary" onClick={close}>Explorar la tienda</button></div> : (
            <>
              <div className="cart-fulfillment">
                <label className="field">Entrega
                  <select value={mode} onChange={(event) => {
                    const next = event.target.value as Delivery['mode'];
                    setMode(next);
                    if (next !== 'pickup' && method === 'cash') setMethod('mercado-pago');
                  }}>
                    <option value="pickup">Retiro en local</option>
                    <option value="shipping">Envío local en Córdoba</option>
                    <option value="national">Envío nacional</option>
                  </select>
                </label>
                {mode === 'pickup' ? <label className="field">Sucursal
                  <select value={branch} onChange={(event) => setBranch(event.target.value as BranchId)}>
                    {branches.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </label> : <p className="shipping-note">{source
                  ? `Despacho simulado desde ${source.name}.`
                  : 'Ninguna sucursal puede completar el envío. Ajustá el carrito para continuar.'}</p>}
                {mode === 'national' && <div className="quote-fields">
                  <p className="field-hint">Usá datos ficticios. Esta demo no identifica la localidad por código postal: completá también provincia y localidad para calcular un costo de ejemplo.</p>
                  <NationalDestinationFields destination={nationalDestination} change={changeNationalDestination}
                    showLocation onConsult={consultQuote} />
                  <button type="button" className="button outline full" onClick={consultQuote}>Consultar costo de envío de ejemplo</button>
                  {quoteRequested && <p className="quote-feedback" role="status">
                    {quoteStatus || 'Envío de ejemplo calculado. Revisá el costo y el plazo en el total.'}
                  </p>}
                  {quoteRequested && quote?.status !== 'invalid-postal' && <details className="quote-scenarios">
                    <summary>Escenarios de cálculo de ejemplo</summary>
                    <label className="field">Resultado de la cotización simulada
                      <select value={scenario} onChange={(event) => setScenario(event.target.value as QuoteScenario)}>
                        <option value="standard">Calcular tarifa de ejemplo</option>
                        <option value="unavailable">Destino sin cotización</option>
                        <option value="error">Error al calcular</option>
                      </select>
                    </label>
                  </details>}
                </div>}
              </div>
              <div className="cart-items">
                {lines.map(({ id, product, quantity, amount, availableAt }) => {
                  const available = source && availableAt.some((item) => item.id === source.id);
                  const name = product?.name ?? 'Producto fuera del catálogo';
                  const units = product?.stock[branch] ?? 0;
                  const partialStock = branches.filter(({ id }) => {
                    const stock = product?.stock[id] ?? 0;
                    return stock > 0 && stock < quantity;
                  });
                  return (
                    <article key={id} className="cart-item">
                      <img src={product ? productImage(product) : '/assets/graciano-logo.png'} alt="" />
                      <div><h3>{name}</h3>{product && <><p>{product.size}</p><div className="cart-item-price">{money(amount)}</div></>}
                        {!available && <Notice>
                          <p>{mode === 'pickup'
                            ? units ? `En ${branchName} quedan ${units} de las ${quantity} unidades pedidas.`
                              : `Sin disponibilidad en ${branchName}.`
                            : 'Productos y cantidades sujetos a la sucursal de despacho.'}</p>
                          <p>{availableAt.length
                            ? `Cantidad disponible en: ${availableAt.map((item) => item.name).join(' · ')}.`
                            : 'La cantidad pedida no está disponible en ninguna sucursal.'}</p>
                          {partialStock.length > 0 && product && <p>Stock parcial: {partialStock.map((item) =>
                            `${item.name} (${product.stock[item.id]})`).join(' · ')}.</p>}
                        </Notice>}
                        <div className="cart-quantity">
                          <div className="quantity">
                            <button aria-label={`Quitar una unidad de ${name}`} disabled={quantity <= 1}
                              onClick={() => changeQuantity(id, quantity - 1)}>−</button>
                            <span>{quantity}</span>
                            <button aria-label={`Sumar una unidad de ${name}`} disabled={!product || quantity >= maxQuantity}
                              onClick={() => changeQuantity(id, quantity + 1)}>+</button>
                          </div>
                          <button className="remove-item" aria-label={`Eliminar ${name}`}
                            onClick={() => changeQuantity(id, 0)}>Eliminar</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!canConfirm && mode === 'pickup' && eligibleBranches.length > 0 && <div className="cart-fulfillment">
                <p>Podés retirar el pedido completo en:</p>
                {eligibleBranches.map((item) => <button className="button outline full" key={item.id}
                  onClick={() => setBranch(item.id)}>Cambiar a {item.name}</button>)}
              </div>}
              <div className="cart-summary">
                <Totals {...assessment} />
                {(!source || !eligibleBranches.some((item) => item.id === source.id)) && <p role="status">Resolvé los faltantes para continuar.</p>}
                <button className="button primary full" disabled={!canConfirm} onClick={() => setStep('details')}>Continuar con la compra</button>
                <button className="continue" onClick={close}>Seguir eligiendo</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="checkout-top"><span className="wordmark">GRACIANO</span>
            <span className="checkout-demo-label">Compra de demostración</span>
            <button className="icon-button" aria-label="Cerrar compra" onClick={close}>×</button>
          </div>
          {step === 'details' && <div className="checkout-layout">
            <div className="checkout-intro">
              <h2 ref={heading} tabIndex={-1}>Completá tu compra</h2>
              <p>{mode === 'pickup' ? `Retiro en ${branchName}`
                : mode === 'national' ? 'Envío nacional de ejemplo' : 'Envío local de ejemplo en Córdoba'}</p>
            </div>
            <aside className="order-summary" aria-labelledby="checkout-summary">
              <h3 id="checkout-summary">Resumen</h3>
              <Totals {...assessment} />
              <details className="checkout-products">
                <summary>Ver productos del carrito</summary>
                <SummaryItems lines={lines} />
              </details>
            </aside>
            <form className="checkout-form" onSubmit={submitDetails}>
              <label className="field">Medio de pago
                <select value={method} onChange={(event) => setMethod(event.target.value as Payment)}>
                  <option value="mercado-pago">Mercado Pago</option><option value="transfer">WhatsApp + transferencia</option>
                  {mode === 'pickup' && <option value="cash">Reserva con pago al retirar</option>}
                </select>
              </label>
              <h3 className="step-title">Datos de ejemplo</h3>
              <div className="field-row">
                <label className="field">Nombre<input required autoComplete="off" value={contact.name} maxLength={80}
                  onChange={(event) => setContact({ ...contact, name: event.target.value })} /></label>
                <label className="field">Email<input required autoComplete="off" type="email" value={contact.email} maxLength={120}
                  onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label>
              </div>
              {mode === 'shipping' && <div className="field-row">
                <label className="field">Calle y número<input required autoComplete="off" value={contact.address} maxLength={120}
                  placeholder="Calle de ejemplo 123" onChange={(event) => setContact({ ...contact, address: event.target.value })} /></label>
                <label className="field">Código postal<input required autoComplete="off" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                  value={contact.postal} placeholder="5000" onChange={(event) => setContact({ ...contact, postal: event.target.value })} /></label>
              </div>}
              {mode === 'national' && <>
                <h3 className="step-title">Destino de ejemplo</h3>
                <NationalDestinationFields destination={nationalDestination} change={changeNationalDestination} showLocation showAddress />
                {quoteStatus && <p className="quote-feedback" role="status">{quoteStatus}</p>}
              </>}
              <label className="field">Dedicatoria (opcional)<textarea rows={2} maxLength={250} value={contact.dedication}
                onChange={(event) => setContact({ ...contact, dedication: event.target.value })} /></label>
              {method === 'transfer' && <p className="checkout-note">En una compra real, después de transferir, enviá el comprobante por WhatsApp junto con los datos de tu compra. El comercio verifica la acreditación.</p>}
              <p className="checkout-note">Usá datos ficticios. El prototipo no realiza cobros ni envía pedidos.</p>
              <button className="button primary full" type="submit" disabled={!canConfirm}>
                {method === 'mercado-pago' ? 'Ir al simulador de pago'
                  : method === 'transfer' ? 'Ver mensaje de ejemplo' : 'Simular reserva al retirar'}
              </button>
              <button className="back-cart" type="button" onClick={() => setStep('cart')}>Volver al carrito</button>
            </form>
          </div>}
          {step === 'message' && previewMessage && <section className="offline-order">
            <h2 ref={heading} tabIndex={-1}>WhatsApp + transferencia</h2>
            <p>Demostración. El local confirma la disponibilidad, la entrega y la acreditación del pago.</p>
            <div className="field">
              <label htmlFor="transfer-preview">Vista previa del mensaje</label>
              <textarea id="transfer-preview" value={previewMessage} readOnly rows={12} />
            </div>
            <button className="button primary" onClick={() => finish('Pendiente de verificación')}>Ver estado de ejemplo</button>
            <button className="back-cart" onClick={() => setStep('details')}>Volver a los datos</button>
          </section>}
          {step === 'payment' && total !== null && <section className="offline-order">
            <h2 ref={heading} tabIndex={-1}>Mercado Pago · Simulación</h2>
            <Totals {...assessment} />
            <details className="checkout-products">
              <summary>Ver productos del carrito</summary>
              <SummaryItems lines={lines} />
            </details>
            <label className="field">Forma de pago de prueba
              <select disabled={processing} value={paymentType}
                onChange={(event) => setPaymentType(event.target.value as typeof paymentType)}>
                <option value="card">Tarjeta de prueba</option><option value="balance">Dinero en cuenta de prueba</option>
              </select>
            </label>
            {paymentType === 'card' && <label className="field">Cuotas de ejemplo
              <select disabled={processing} value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                <option value={1}>1 pago de {money(total)}</option>
                <option value={3}>{total % 3 === 0
                  ? `3 cuotas de ${money(amountPerInstallment)}`
                  : `2 cuotas de ${money(amountPerInstallment)} y 1 de ${money(total - amountPerInstallment * 2)}`}</option>
              </select>
            </label>}
            <label className="field">Resultado de la simulación
              <select value={outcome} disabled={processing} onChange={(event) => setOutcome(event.target.value as Outcome)}>
                <option value="approved">Aprobado</option><option value="pending">Pendiente</option><option value="rejected">Rechazado</option>
              </select>
            </label>
            <button className="button primary" disabled={processing} onClick={simulatePayment}>
              {processing ? 'Procesando simulación…' : 'Simular pago'}
            </button>
            <button className="back-cart" disabled={processing} onClick={() => setStep('details')}>Volver a los datos</button>
          </section>}
          {step === 'result' && order && <section className="offline-order">
            <h2 ref={heading} tabIndex={-1}>{order.state}</h2>
            <p>Compra de ejemplo · GRA-DEMO</p>
            <dl className="demo-receipt">
              <dt>Medio de pago</dt><dd>{paymentLabels[order.method]}</dd>
              <dt>Destino</dt><dd>{order.destination}</dd>
              <dt>Preparación</dt><dd>{order.method === 'cash' ? 'Reserva de ejemplo pendiente de confirmación' : 'Sin preparar · Demostración'}</dd>
              <dt>Pago</dt><dd>{order.state}</dd>
              <dt>Entrega</dt><dd>{order.amounts.quote ? 'Sin despacho · Demostración' : 'Sin retiro registrado · Demostración'}</dd>
              {order.dedication && <><dt>Dedicatoria</dt><dd>{order.dedication}</dd></>}
            </dl>
            <Totals {...order.amounts} />
            {order.method === 'transfer' && <p className="checkout-note">Comprobante con los datos de compra por WhatsApp en el flujo real. La acreditación queda pendiente de verificación.</p>}
            <p className="checkout-note">Demostración. No se enviaron pedidos, no se hicieron cobros y no se reservó stock.</p>
            {method === 'mercado-pago' && outcome !== 'approved' && <button className="button outline"
              onClick={() => setStep('payment')}>Volver al simulador</button>}
            <button className="button primary" onClick={close}>Volver a la tienda</button>
          </section>}
        </>
      )}
    </Dialog>
  );
}
