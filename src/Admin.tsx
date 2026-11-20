import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
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

function AdminHeader() {
  return <>
    <div id="admin-top" className="preview-note" role="region" aria-label="Aviso de demostración"><span>Panel de demostración</span><span>Los cambios se guardan en este navegador</span></div>
    <header className="header admin-header">
      <a href="#admin-top" className="brand" aria-label="Volver arriba en el panel"><img src="/assets/graciano-logo-violeta.png" alt="Graciano" /></a>
      <Link to="/" className="button outline">Ver tienda</Link>
    </header>
  </>;
}

export function AdminLanding({ products }: { products: Product[] }) {
  return <>
    <a className="skip-link" href="#admin-branches">Ir a sucursales</a>
    <AdminHeader />
    <main className="admin-main section-wrap" id="admin-branches" tabIndex={-1}>
      <h1>Panel de sucursales</h1>
      <p>Elegí un local para consultar y editar su stock de ejemplo.</p>
      <div className="admin-branches" aria-label="Sucursales">
        {branches.map((branch) => {
          const available = products.filter((product) => product.stock[branch.id] > 0).length;
          const units = products.reduce((sum, product) => sum + product.stock[branch.id], 0);
          return <Link className="admin-branch" key={branch.id} to={`/admin/sucursal/${branch.id}`}>
            <strong>{branch.name}</strong><span>{branch.area}</span>
            <small>{available} {available === 1 ? 'producto' : 'productos'} con stock · {units} {units === 1 ? 'unidad' : 'unidades'}</small>
            <span className="admin-branch-action">Ver stock →</span>
          </Link>;
        })}
      </div>
    </main>
  </>;
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
  const { branchId } = useParams();
  const savePending = useRef(false);
  const existing = editor && editor !== 'new' ? editor : undefined;
  const currentBranch = branches.find((branch) => branch.id === branchId);

  useEffect(() => {
    setStatus('');
    setEditor(undefined);
    setResetOpen(false);
  }, [branchId]);

  function openEditor(product: Product | 'new') {
    setError('');
    setEditor(product);
  }

  function closeEditor() {
    if (!savePending.current) setEditor(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savePending.current || !currentBranch) return;
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
      const stock: Record<BranchId, number> = { ...emptyStock, ...existing?.stock };
      stock[currentBranch.id] = Number(fields.get(currentBranch.id));
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

  if (!currentBranch) return <Navigate to="/admin" replace />;
  const currentAvailable = products.filter((product) => product.stock[currentBranch.id] > 0).length;
  const currentUnits = products.reduce((sum, product) => sum + product.stock[currentBranch.id], 0);

  return (
    <>
      <a className="skip-link" href="#admin-products">Ir a productos</a>
      <AdminHeader />
      <main className="admin-main section-wrap" id="admin-products" tabIndex={-1}>
        <Link to="/admin" className="admin-back">← Todas las sucursales</Link>
        <div className="section-heading admin-heading"><h1>{currentBranch.name}</h1>
          <button className="button primary" onClick={() => openEditor('new')}>Cargar producto</button></div>
        <p>{currentBranch.area} · Stock de ejemplo. Los datos de producto se comparten entre locales; acá editás las unidades de esta sucursal.</p>
        <p role="status">{status}</p>
        <div className="admin-branch-heading">
          <div><h2 id="branch-stock-heading">Inventario</h2><p>{currentAvailable} {currentAvailable === 1 ? 'producto disponible' : 'productos disponibles'} · {currentUnits} {currentUnits === 1 ? 'unidad' : 'unidades'}</p></div>
        </div>
        <div className="admin-directory" role="region" aria-labelledby="branch-stock-heading">
          {products.map((product) => <article className="admin-row" key={product.id}>
            <img src={productImage(product)} alt="" />
            <div><h2>{product.name}</h2><p>{product.category} · {product.size}</p>
              <p className={product.stock[currentBranch.id] > 0 ? 'admin-stock available' : 'admin-stock empty'}>
                {product.stock[currentBranch.id] > 0
                  ? `${product.stock[currentBranch.id]} ${product.stock[currentBranch.id] === 1 ? 'unidad disponible' : 'unidades disponibles'}`
                  : 'Sin stock en esta sucursal'}
              </p>
            </div>
            <b>{money(product.price)}</b>
            <button className="button outline" aria-label={`Editar ${product.name} en ${currentBranch.name}`} onClick={() => openEditor(product)}>Editar</button>
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
            <legend>Stock en {currentBranch.name}</legend>
            <label className="field">Unidades disponibles
              <input type="number" name={currentBranch.id} min={0} max={9999} step={1} required defaultValue={existing?.stock[currentBranch.id] ?? 0} />
            </label>
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
