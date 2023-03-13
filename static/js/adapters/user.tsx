import * as Sentry from '@sentry/react'
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  signInAnonymously,
  signInWithEmailLink,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useFirebase } from './firebase'

interface User {
  firebaseUser: FirebaseUser
  accessToken: string
  entitlement: string | undefined
  anonymous: boolean
}

interface UserController {
  user?: User | null
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  isPro: () => boolean
  hasPortal: () => boolean
  openPortal: () => Promise<void>
}

const UserContext = createContext<UserController | undefined>(undefined)

interface Props {
  children: ReactNode
}

export default function UserProvider(props: Props) {
  const { children } = props
  const [user, setUser] = useState<User | null>()
  const firebase = useFirebase()
  const [portalLink, setPortalLink] = useState<string>()

  // Detect when the user's authentication status changes
  useEffect(() => {
    if (!firebase?.app) {
      return
    }
    const onAuthChangedCallback = async (firebaseUser: FirebaseUser | null) => {
      try {
        if (!firebaseUser) {
          // setUser(null)
          const auth = getAuth()
          await signInAnonymously(auth)
          return
        }
        const token = await firebaseUser.getIdToken()
        if (!token) {
          throw new Error('No access token')
        }
        // Retrieve the claims
        const decodedToken = await firebaseUser.getIdTokenResult(true)
        const entitlement = decodedToken.claims.stripeRole?.toString()
        // The signed-in user info.
        setUser({
          firebaseUser,
          accessToken: token,
          entitlement,
          anonymous: firebaseUser.isAnonymous,
        })
        Sentry.setUser({
          id: firebaseUser.uid,
          entitlement,
        })
      } catch (error: any) {
        // eslint-disable-next-line no-alert
        alert(`Error ${error.code}: ${error.message}`)
        Sentry.captureException(error)
      }
    }

    const unsub = getAuth().onAuthStateChanged(onAuthChangedCallback)
    return unsub
  }, [firebase?.app])

  // Check if the user has a portal link
  const uid = useMemo(() => user?.firebaseUser.uid, [user])
  const db = useMemo(() => firebase?.firestore, [firebase])
  useEffect(() => {
    if (!db || !uid) {
      return
    }
    getDoc(doc(db, `customers/${uid}`)).then(d => {
      if (d.exists()) {
        const data = d.data()
        setPortalLink(data?.stripeLink)
      }
    })
  }, [uid, db])

  // Check if the URL is a sign-in link
  useEffect(() => {
    if (!firebase?.app) {
      return
    }
    // Confirm the link is a sign-in with email link.
    const auth = getAuth()
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Additional state parameters can also be passed via URL.
      // This can be used to continue the user's intended action before triggering
      // the sign-in operation.
      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again.
        // eslint-disable-next-line no-alert
        email = window.prompt('Please provide your email for confirmation')
      }
      if (!email) {
        throw new Error('No email')
      }
      // The client SDK will parse the code from the link for you.
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          // Clear email from storage.
          window.localStorage.removeItem('emailForSignIn')
          // You can access the new user via result.user
          // Additional user info profile not available via:
          // result.additionalUserInfo.profile == null
          // You can check if the user is new or existing:
          // result.additionalUserInfo.isNewUser
        })
        .catch((error: any) => {
          // eslint-disable-next-line no-alert
          alert(error.message)
          Sentry.captureException(error)
        })
    }
  }, [firebase?.app])

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const auth = getAuth()
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        // eslint-disable-next-line no-alert
        alert(`Error ${error.code}: ${error.message}`)
        Sentry.captureException(error)
      }
    }
  }

  async function openPortal() {
    if (!firebase) {
      throw new Error('Firebase not initialized')
    }
    const functionRef = httpsCallable(
      getFunctions(firebase.app),
      'ext-firestore-stripe-payments-createPortalLink'
    )
    const { data } = await functionRef({
      returnUrl: window.location.origin,
      // Optional, defaults to "auto"
      locale: 'auto',
      // Optional ID of a portal configuration:
      // https://stripe.com/docs/api/customer_portal/configuration
      // configuration: 'bpc_1JSEAKHYgolSBA358VNoc2Hs',
    })
    if (!data) {
      throw new Error('No data returned')
    }
    window.location.assign((data as any).url)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        signInWithGoogle,
        signOut: () => getAuth().signOut(),
        openPortal,
        hasPortal: () => portalLink !== undefined,
        isPro: () => user?.entitlement === 'pro',
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
