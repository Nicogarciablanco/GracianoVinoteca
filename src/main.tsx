import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Admin } from './Admin';
import { Store } from './Store';
import { demoRepository } from './repository';
import type { Product } from './commerce';
import '../referencia/style.css';
import '../referencia/identity.css';
import './ui.css';

function App() {
  const [products, setProducts] = useState(demoRepository.loadCatalog);

  function saveCatalog(next: Product[]) {
    demoRepository.saveCatalog(next);
    setProducts(next);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Store products={products} />} />
        <Route path="/admin" element={<Admin products={products} save={saveCatalog}
          reset={() => setProducts(demoRepository.restoreCatalog())} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento raíz de la aplicación.');
createRoot(root).render(<App />);
