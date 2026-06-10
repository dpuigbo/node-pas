import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Intervenciones from './pages/Intervenciones';
import Sistemas from './pages/Sistemas';
import Fabricantes from './pages/Fabricantes';
import Modelos from './pages/Modelos';
import Consumibles from './pages/Consumibles';
import Ofertas from './pages/Ofertas';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="intervenciones" element={<Intervenciones />} />
        <Route path="sistemas" element={<Sistemas />} />
        <Route path="fabricantes" element={<Fabricantes />} />
        <Route path="modelos" element={<Modelos />} />
        <Route path="consumibles" element={<Consumibles />} />
        <Route path="ofertas" element={<Ofertas />} />
      </Route>
    </Routes>
  );
}
