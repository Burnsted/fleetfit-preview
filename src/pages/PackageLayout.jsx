import { Outlet } from 'react-router-dom'
import CompareChrome from '../components/CompareChrome'
import PathChrome from '../components/PathChrome'

export default function PackageLayout() {
  return (
    <>
      <PathChrome active="add" className="path-chrome-flow" />
      <Outlet />
      <CompareChrome />
    </>
  )
}
