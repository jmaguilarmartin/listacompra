import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { ProductosPage } from './pages/ProductosPage'
import { HistoricoPage } from './pages/HistoricoPage'
import { EstadisticasPage } from './pages/EstadisticasPage'
import { ModoCompraPage } from './pages/ModoCompraPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { ListaCompartidaPage } from './pages/ListaCompartidaPage'
import { UserSetup } from './components/layout/UserSetup'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserSetup />
      <Routes>
        {/* Vista pública de lista compartida — sin Layout */}
        <Route path="/compartida/:token" element={<ListaCompartidaPage />} />
        {/* Resto de la app con Layout normal */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
              <Route path="/estadisticas" element={<EstadisticasPage />} />
              <Route path="/compra" element={<ModoCompraPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
