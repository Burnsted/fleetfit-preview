import { DEFAULT_PACKAGE_ID } from '../data/package'

const EXAMPLE = `/package/${DEFAULT_PACKAGE_ID}`

/** CLEARED PATH: Intake · Add to fleet · Budget */
export const PATH_STEPS = [
  { name: 'intake', label: 'Intake', to: '/intake', match: (path) => path.startsWith('/intake') },
  {
    name: 'add',
    label: 'Add to fleet',
    to: EXAMPLE,
    match: (path) => path.startsWith('/package') || path.startsWith('/checkout'),
  },
  { name: 'budget', label: 'Budget', to: '/budget', match: (path) => path.startsWith('/budget') },
]
