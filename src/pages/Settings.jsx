import { playAlertBeep } from '../components/alertSound.js'
import PageTitle from '../components/PageTitle.jsx'
import Segmented from '../components/Segmented.jsx'
import { CARD, LABEL } from '../components/ui.js'
import { usePreferences } from '../store/PreferencesContext.jsx'

function Row({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-oc-gray">{description}</p>
      </div>
      {children}
    </div>
  )
}

// App preferences. Saved in localStorage through store/storage.js (separate from mission data).
export default function Settings() {
  const { theme, tempUnit, alertSound, setPreference } = usePreferences()

  return (
    <div className="max-w-3xl space-y-8">
      <PageTitle title="Settings" accent="Settings" />

      <section>
        <PageTitle title="Display" as="h2" size="text-xl" />
        <div className={`${CARD} mt-3 py-1`}>
          <Row title="Theme" description="Light uses white backgrounds with navy text. The top bar stays dark.">
            <Segmented label="Theme" value={theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={(v) => setPreference('theme', v)} />
          </Row>
        </div>
      </section>

      <section>
        <PageTitle title="Units" as="h2" size="text-xl" />
        <div className={`${CARD} mt-3 py-1`}>
          <Row title="Temperature" description="Changes how temperatures are shown. Readings are always stored in °C.">
            <Segmented label="Temperature unit" value={tempUnit} options={[['C', '°C'], ['F', '°F']]} onChange={(v) => setPreference('tempUnit', v)} />
          </Row>
        </div>
      </section>

      <section>
        <PageTitle title="Alerts" as="h2" size="text-xl" />
        <div className={`${CARD} mt-3 py-1`}>
          <Row title="Sound on red alerts" description="A short beep when a newly logged reading is red, and when radiation first turns red.">
            <Segmented
              label="Sound on red alerts"
              value={alertSound}
              options={[[true, 'On'], [false, 'Off']]}
              onChange={(v) => {
                setPreference('alertSound', v)
                if (v) playAlertBeep() // let the user hear what it sounds like
              }}
            />
          </Row>
        </div>
      </section>

      <section>
        <PageTitle title="About" as="h2" size="text-xl" />
        <div className={`${CARD} mt-3 space-y-3`}>
          <p className="text-white">
            <span className="font-bold">OrbitCare</span> · <span className="font-mono">Version 0.1</span>
          </p>
          <div>
            <p className={LABEL}>Data sources</p>
            <ul className="mt-1 list-disc pl-6 text-white/90">
              <li>NASA Human Research Program (health risks)</li>
              <li>NASA space weather data (radiation)</li>
            </ul>
          </div>
          <p className="text-oc-gray">Guidance tool. Does not replace flight surgeons.</p>
        </div>
      </section>
    </div>
  )
}
