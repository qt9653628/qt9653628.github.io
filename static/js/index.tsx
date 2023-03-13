import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import FirebaseProvider from './adapters/firebase'
import UserProvider from './adapters/user'
import App from './App'
import { AlertProvider } from './components/Alert'
import { EditorProvider } from './context/EditorContext'
import './styles/index.css'

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
})

const root = document.createElement('div')
root.id = 'root'
document.body.prepend(root)

ReactDOM.render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <FirebaseProvider>
        <AlertProvider>
          <UserProvider>
            <EditorProvider>
              <App />
            </EditorProvider>
          </UserProvider>
        </AlertProvider>
      </FirebaseProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
  root
)
