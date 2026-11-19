import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { Dialog } from './Dialog';
import { branches, categories, money, productImage } from './commerce';
import type { BranchId, Category, Product } from './commerce';

const editable = [
  { key: 'name', label: 'Nombre', required: true },
  { key: 'brand', label: 'Marca o bodega', required: true },
  { key: 'size', label: 'Presentación', required: true },
  { key: 'variety', label: 'Variedad', required: true },
  { key: 'origin', label: 'Origen', required: false },
] as const;

const emptyStock = { ituzaingo: 0, trejo: 0, 'rio-negro': 0 };
const allowedPhotos = ['image/jpeg', 'image/png', 'image/webp'];

async function readPhoto(file: File) {
  if (!allowedPhotos.includes(file.type) || file.size > 1024 * 1024) {
    throw new Error('Elegí un JPG, PNG o WebP de hasta 1 MB.');
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('No se pudo leer la imagen.');
  });
  bitmap.close();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.'));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

export function Admin({ products, save, reset }: {
  products: Product[];
  save: (products: Product[]) => void;
  reset: () => void;
}) {
  const [editor, setEditor] = useState<Product | 'new'>();
  const [resetOpen, setResetOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savePending = useRef(false);
  const existing = editor && editor !== 'new' ? editor : undefined;

  function openEditor(product: Product | 'new') {
    setError('');
    setEditor(product);
  }

  function closeEditor() {
    if (!savePending.current) setEditor(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savePending.current) return;
    const fields = new FormData(event.currentTarget);
    const text = (field: string) => String(fields.get(field) ?? '').trim();
    if (editable.some(({ key, required }) => required && !text(key))) {
      setError('Completá los campos obligatorios.');
      return;
    }
    savePending.current = true;
    setSaving(true);
    setError('');
    try {
      const photoFile = fields.get('photo');
      const photo = photoFile instanceof File && photoFile.size ? await readPhoto(photoFile) : existing?.photo;
      const stock: Record<BranchId, number> = { ...emptyStock };
      for (const branch of branches) stock[branch.id] = Number(fields.get(branch.id));
      const product: Product = {
        id: existing?.id ?? `producto-${crypto.randomUUID()}`,
        name: text('name'),
        brand: text('brand'),
        size: text('size'),
        variety: text('variety'),
        origin: text('origin'),
        category: text('category') as Category,
        description: text('description'),
        price: Number(fields.get('price')),
        stock,
        photo,
        images: existing?.images ?? [],
      };

      save(existing ? products.map((current) => current.id === product.id ? product : current) : [...products, product]);
      setStatus(`${product.name} se guardó en este navegador.`);
      setEditor(undefined);
    } catch (failure) {
      setError(failure instanceof DOMException
        ? 'El navegador no pudo guardar los cambios. Probá con una foto más liviana.'
        : failure instanceof Error ? failure.message : 'No se pudo guardar el producto.');
    } finally {
      savePending.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#admin-products">Ir a productos</a>
      <div className="preview-note" role="region" aria-label="Aviso de demostración"><span>Panel de demostración</span><span>Los cambios se guardan en este navegador</span></div>
      <header className="header admin-header">
        <Link to="/" className="brand" aria-label="Ir a la tienda"><img src="/assets/graciano-logo-violeta.png" alt="Graciano" /></Link>
        <Link to="/" className="button outline">Ver tienda</Link>
      </header>
      <main className="admin-main section-wrap" id="admin-products" tabIndex={-1}>
        <div className="section-heading admin-heading"><h1>Productos</h1>
          <button className="button primary" onClick={() => openEditor('new')}>Cargar producto</button></div>
        <p>Editá el catálogo y las unidades de ejemplo por sucursal.</p>
        <p role="status">{status}</p>
        <div className="admin-directory">
          {products.map((product) => <article className="admin-row" key={product.id}>
            <img src={productImage(product)} alt="" />
            <div><h2>{product.name}</h2><p>{product.category} · {product.size}</p>
              <ul className="stock-overview">{branches.map((branch) =>
                <li key={branch.id}>{branch.name} <strong>{product.stock[branch.id]}</strong></li>)}</ul>
            </div>
            <b>{money(product.price)}</b>
            <button className="button outline" aria-label={`Editar ${product.name}`} onClick={() => openEditor(product)}>Editar</button>
          </article>)}
        </div>
        <button className="text-link" onClick={() => setResetOpen(true)}>Restablecer ejemplos</button>
      </main>
      {editor && <Dialog label={existing ? 'Editar producto' : 'Cargar producto'} className="product-dialog admin-editor" close={closeEditor}>
        <div className="modal-dismiss">
          <button className="close-dialog icon-button" aria-label="Cerrar editor" disabled={saving} onClick={closeEditor}>×</button>
        </div>
        <h2>{existing ? 'Editar producto' : 'Cargar producto'}</h2>
        <form onSubmit={submit}>
          <div className="editor-grid">
            {editable.map(({ key, label, required }) => <label className="field" key={key}>{label}
              <input name={key} defaultValue={existing?.[key]} maxLength={100} required={required} />
            </label>)}
            <label className="field">Categoría
              <select name="category" defaultValue={existing?.category ?? 'Tintos'}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <label className="field">Precio en pesos
            <input name="price" required type="number" min={1} max={100_000_000} step={1} defaultValue={existing?.price} />
          </label>
          <label className="field">Descripción<textarea name="description" defaultValue={existing?.description} maxLength={600} rows={3} /></label>
          <fieldset className="demo-stock">
            <legend>Unidades por sucursal</legend>
            {branches.map((branch) => <label key={branch.id} className="field">{branch.name}
              <input type="number" name={branch.id} min={0} max={9999} step={1} required defaultValue={existing?.stock[branch.id] ?? 0} />
            </label>)}
          </fieldset>
          {existing && <img className="admin-photo" src={productImage(existing)} alt="" />}
          <label className="field">Foto JPG, PNG o WebP de hasta 1 MB
            <input name="photo" type="file" accept={allowedPhotos.join(',')} />
          </label>
          {error && <p className="demo-error" role="alert">{error}</p>}
          <button className="button primary" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar producto'}</button>
        </form>
      </Dialog>}
      {resetOpen && <Dialog label="Restablecer catálogo" className="product-dialog admin-editor" close={() => setResetOpen(false)}>
        <h2>Restablecer ejemplos</h2><p>Se van a borrar las ediciones de catálogo de este navegador.</p>
        <div className="demo-actions"><button className="button outline" onClick={() => setResetOpen(false)}>Cancelar</button>
          <button className="button primary" onClick={() => {
            try {
              reset();
              setStatus('Catálogo de ejemplo restablecido.');
            } catch {
              setStatus('El navegador no pudo restablecer los ejemplos.');
            }
            setResetOpen(false);
          }}>Restablecer</button></div>
      </Dialog>}
    </>
  );
}
