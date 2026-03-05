import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { ProductosPage } from './pages/ProductosPage'
import { HistoricoPage } from './pages/HistoricoPage'
import { EstadisticasPage } from './pages/EstadisticasPage'
import { ModoCompraPage } from './pages/ModoCompraPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { UserSetup } from './components/layout/UserSetup'

function App() {
  return (
    <BrowserRouter>
      <UserSetup />
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
    </BrowserRouter>
  )
}

export default App
