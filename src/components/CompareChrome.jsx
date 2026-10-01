import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPackage, getUnit } from '../data/package'
import { COMPARE_MAX, unitWhisper, useCompareSet } from '../lib/compareSet'
import ListingPhoto from './ListingPhoto'

export default function CompareChrome() {
  const { packageId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const compare = useCompareSet()
  const pkg = getPackage(packageId)
  const ids = compare.idsFor(packageId)
  const onFullCompare = location.pathname.endsWith('/compare')
  const trayVisible = Boolean(pkg) && compare.trayOpen && compare.packageId === packageId && !onFullCompare && ids.length > 0 && !compare.maxPrompt
  const nubVisible = Boolean(pkg) && ids.length > 0 && !compare.trayOpen && compare.packageId === packageId && !onFullCompare

  if (!pkg) return null

  const units = ids.map((id) => getUnit(packageId, id)).filter(Boolean)

  function openFull() {
    if (ids.length < 2) return
    compare.closeTray()
    navigate(`/package/${packageId}/compare`, { state: location.state })
  }

  return (
    <>
      {nubVisible ? (
        <button
          type="button"
          className="compare-nub"
          aria-label={`Compare set, ${ids.length} units`}
          onClick={() => compare.openTray()}
        >
          <span className="compare-nub-mark" aria-hidden="true" />
          <span className="compare-nub-count">{ids.length}</span>
        </button>
      ) : null}

      {trayVisible ? (
        <aside className="compare-tray" aria-label="Compare tray">
          <div className="compare-tray-head">
            <p className="compare-tray-title">Compare</p>
            <button type="button" className="compare-tray-close" onClick={() => compare.closeTray()} aria-label="Hide compare tray">
              ×
            </button>
          </div>
          <ul className="compare-tray-thumbs">
            {units.map((unit) => (
              <li key={unit.id}>
                <button
                  type="button"
                  className="compare-tray-thumb"
                  onClick={() => {
                    if (ids.length >= 2) openFull()
                  }}
                >
                  <ListingPhoto vehicle={unit} className="compare-tray-photo" />
                  <span className="compare-tray-whisper">{unitWhisper(unit)}</span>
                </button>
                <button
                  type="button"
                  className="compare-tray-remove"
                  aria-label={`Remove ${unitWhisper(unit)} from compare`}
                  onClick={() => compare.remove(unit.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {ids.length >= 2 ? (
            <button type="button" className="btn btn-primary compare-tray-cta" onClick={openFull}>
              Compare {ids.length}
            </button>
          ) : (
            <p className="compare-tray-hint">Add another to compare</p>
          )}
        </aside>
      ) : null}

      {compare.maxPrompt && compare.maxPrompt.packageId === packageId ? (
        <div className="compare-max" role="dialog" aria-labelledby="compare-max-title" aria-modal="true">
          <div className="compare-max-card">
            <h2 id="compare-max-title" className="compare-max-title">Compare up to {COMPARE_MAX}</h2>
            <p className="compare-max-lead">
              Remove one to add this unit. No rush — keep the set that helps.
            </p>
            <ul className="compare-max-thumbs">
              {units.map((unit) => (
                <li key={unit.id}>
                  <ListingPhoto vehicle={unit} className="compare-tray-photo" />
                  <button
                    type="button"
                    className="compare-tray-remove"
                    aria-label={`Remove ${unitWhisper(unit)}`}
                    onClick={() => compare.replace(unit.id, packageId, compare.maxPrompt.unitId)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn compare-max-keep" onClick={() => compare.dismissMax()}>
              Keep current set
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
