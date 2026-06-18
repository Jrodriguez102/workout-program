import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, History, TrendingUp } from 'lucide-react'

export default function BottomNav() {
  const tabs = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/progress', icon: TrendingUp, label: 'Progress' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center z-50"
      style={{
        background: 'rgba(15,13,16,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        height: 'calc(4rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs transition-all min-w-[56px] py-2 ${
              isActive ? 'scale-105' : ''
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? '#2dd4bf' : 'rgba(255,255,255,0.35)',
          })}
        >
          <Icon size={20} />
          <span className="font-light tracking-wide">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
