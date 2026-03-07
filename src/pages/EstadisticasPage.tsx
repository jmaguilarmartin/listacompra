import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react'
import { getTodoElHistorico } from '../services/calculosService'
import { useProductos } from '../hooks/useProductos'
import { formatPrice } from '../lib/utils'
import { HistoricoCompra } from '../lib/supabase'

// ─── helpers ────────────────────────────────────────────────────────────────

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function getLast12Months(): { key: string; label: string; year: number; month: number }[] {
  const result = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    })
  }
  return result
}

function buildMonthlyData(historico: HistoricoCompra[]) {
  const months = getLast12Months()
  const countMap: Record<string, number> = {}
  const gastoMap: Record<string, number> = {}

  historico.forEach((item) => {
    const d = new Date(item.fecha_compra)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    countMap[key] = (countMap[key] || 0) + 1
    gastoMap[key] = (gastoMap[key] || 0) + (item.precio || 0)
  })

  return months.map((m) => ({
    mes: m.label,
    compras: countMap[m.key] || 0,
    gasto: Math.round((gastoMap[m.key] || 0) * 100) / 100,
  }))
}

function buildTopProductos(historico: HistoricoCompra[]) {
  const conteo: Record<string, { cantidad: number; gasto: number }> = {}
  historico.forEach((item) => {
    const nombre = item.producto?.nombre || 'Desconocido'
    if (!conteo[nombre]) conteo[nombre] = { cantidad: 0, gasto: 0 }
    conteo[nombre].cantidad += 1
    conteo[nombre].gasto += item.precio || 0
  })
  return Object.entries(conteo)
    .map(([nombre, { cantidad, gasto }]) => ({ nombre, cantidad, gasto }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10)
}

function buildCategorias(historico: HistoricoCompra[]) {
  const map: Record<string, { cantidad: number; gasto: number }> = {}
  historico.forEach((item) => {
    const cat = item.producto?.categoria || 'Sin categoría'
    if (!map[cat]) map[cat] = { cantidad: 0, gasto: 0 }
    map[cat].cantidad += 1
    map[cat].gasto += item.precio || 0
  })
  return Object.entries(map)
    .map(([categoria, { cantidad, gasto }]) => ({ categoria, cantidad, gasto }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

// ─── subcomponentes ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-gray-800 mb-4">{children}</h2>
  )
}

// ─── página principal ────────────────────────────────────────────────────────

export function EstadisticasPage() {
  const { productos } = useProductos()
  const [historico, setHistorico] = useState<HistoricoCompra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTodoElHistorico(2000)
      .then(setHistorico)
      .catch((err) => console.error('Error al cargar estadísticas:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  // ── Datos calculados ──
  const totalCompras = historico.length
  const totalGastado = historico.reduce((s, i) => s + (i.precio || 0), 0)
  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()
  const comprasEsteMes = historico.filter((i) => {
    const d = new Date(i.fecha_compra)
    return d.getMonth() + 1 === mesActual && d.getFullYear() === añoActual
  }).length

  const monthlyData = buildMonthlyData(historico)
  const topProductos = buildTopProductos(historico)
  const categorias = buildCategorias(historico)
  const maxCantidad = topProductos[0]?.cantidad || 1

  // Últimas 5 compras
  const ultimasCompras = [...historico].slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Análisis de tus patrones de compra</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total compras"
          value={String(totalCompras)}
          icon={ShoppingCart}
          color="bg-primary-600"
        />
        <StatCard
          label="Total gastado"
          value={formatPrice(totalGastado)}
          icon={DollarSign}
          color="bg-green-600"
        />
        <StatCard
          label="Este mes"
          value={String(comprasEsteMes)}
          icon={Clock}
          color="bg-blue-600"
        />
        <StatCard
          label="Productos activos"
          value={String(productos.length)}
          icon={Package}
          color="bg-purple-600"
        />
      </div>

      {/* Gráfico compras por mes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionTitle>Compras por mes (últimos 12 meses)</SectionTitle>
        {totalCompras === 0 ? (
          <p className="text-gray-400 text-sm">Sin datos todavía</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} compras`, 'Compras']} />
              <Bar dataKey="compras" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico gasto mensual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionTitle>Gasto mensual (€)</SectionTitle>
        {totalGastado === 0 ? (
          <p className="text-gray-400 text-sm">Sin precios registrados todavía</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Gasto']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="gasto"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Gasto (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top 10 productos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionTitle>Top 10 productos más comprados</SectionTitle>
        {topProductos.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin datos todavía</p>
        ) : (
          <div className="space-y-3">
            {topProductos.map((p, i) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <span className="w-6 text-right text-sm font-semibold text-gray-400">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 truncate">{p.nombre}</span>
                    <span className="text-gray-500 ml-2 shrink-0">
                      {p.cantidad}x · {p.gasto > 0 ? formatPrice(p.gasto) : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(p.cantidad / maxCantidad) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distribución por categoría */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionTitle>Compras por categoría</SectionTitle>
        {categorias.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin datos todavía</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, categorias.length * 36)}>
            <BarChart
              layout="vertical"
              data={categorias}
              margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(v) => [`${v} compras`, 'Cantidad']} />
              <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Últimas compras */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionTitle>Últimas compras</SectionTitle>
        {ultimasCompras.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin compras registradas</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {ultimasCompras.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {item.producto?.nombre || 'Desconocido'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.fecha_compra).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {item.lugar_compra ? ` · ${item.lugar_compra}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {item.precio != null ? formatPrice(item.precio) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm text-indigo-800 flex items-start gap-2">
          <TrendingUp size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Tip:</strong> Las estadísticas se actualizan en tiempo real con tu histórico de
            compras. Cuanto más uses la app, más precisas serán las sugerencias inteligentes.
          </span>
        </p>
      </div>
    </div>
  )
}
