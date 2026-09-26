import { Outlet } from 'react-router-dom'
import CompareChrome from '../components/CompareChrome'

export default function PackageLayout() {
  return (
    <>
      <Outlet />
      <CompareChrome />
    </>
  )
}
