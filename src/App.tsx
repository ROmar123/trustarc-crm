import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/ui'
import { AccountDetail } from './pages/AccountDetail'
import { Accounts } from './pages/Accounts'
import { Audit } from './pages/Audit'
import { Dashboard } from './pages/Dashboard'
import { Pipeline } from './pages/Pipeline'
import { Products } from './pages/Products'
import { Renewals } from './pages/Renewals'
import { Tasks } from './pages/Tasks'
import { Team } from './pages/Team'
import { StoreProvider } from './store/store'

export default function App() {
  return (
    <StoreProvider><ToastProvider><HashRouter><Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="renewals" element={<Renewals />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="products" element={<Products />} />
        <Route path="audit" element={<Audit />} />
        <Route path="team" element={<Team />} />
        <Route path="*" element={<div className="card empty">Page not found.</div>} />
      </Route>
    </Routes></HashRouter></ToastProvider></StoreProvider>
  )
}
