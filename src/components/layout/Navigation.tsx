import { NavLink } from 'react-router-dom'
import { ShoppingCart, Package, History, BarChart3 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { FileText } from 'lucide-react'  // ← Añadir al import de lucide

export function Navigation() {
  const links = [
    { to: '/', icon: ShoppingCart, label: 'Lista' },
    { to: '/productos', icon: Package, label: 'Productos' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
  ]

 return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                  'border-b-2',
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )
              }
            >
              <link.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>{link.label}</span>
            </NavLink>
          ))}
          
          {/* Template link */}
          <NavLink
            to="/templates"
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                'border-b-2',
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              )
            }
          >
            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Templates</span>
          </NavLink>
        </div>
      </div>
    </nav>
  )
}