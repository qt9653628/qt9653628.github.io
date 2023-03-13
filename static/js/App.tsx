import { useEffect, useState } from 'react'
import { RESIZE_HD, RESIZE_LD } from './adapters/config'
import { useFirebase } from './adapters/firebase'
import { useUser } from './adapters/user'
import DownscaleModal from './components/DownscaleModal'
import SignInModal from './components/SigninModal'
import UpgradeModal from './components/UpgradeModal'
import { useEditor } from './context/EditorContext'
import EditorHeader from './EditorHeader'
import EditorUI from './EditorUI'
import Homepage from './Homepage'
import { getImage, resizeImageFile } from './utils'

function App() {
  const editor = useEditor()
  const [upgradeFlowScreen, setUpgradeFlowScreen] = useState(
    new URLSearchParams(window.location.search).get('upgrade')
  )
  const [showUpgrade, setShowUpgrade] = useState(
    upgradeFlowScreen !== null && typeof upgradeFlowScreen !== 'undefined'
  )
  useEffect(() => {
    const listener = () => setShowUpgrade(true)

    document.addEventListener('@cleanup/display-upgrade-modal', listener)
    return () => {
      document.removeEventListener('@cleanup/display-upgrade-modal', listener)
    }
  }, [])
  const [showSignin, setShowSignin] = useState(false)

  const [showOriginal, setShowOriginal] = useState(false)
  const [showSeparator, setShowSeparator] = useState(false)

  const [downscaleModalImage, setDownscaleModalImage] =
    useState<HTMLImageElement>()

  const user = useUser()

  // Toggle the editor class on body when a file is selected
  useEffect(() => {
    if (editor.file) {
      document.body.classList.add('editor')
    } else {
      document.body.classList.remove('editor')
    }
  }, [editor.file])

  const firebase = useFirebase()

  if (!firebase) {
    return <></>
  }

  async function startWithDemoImage(img: string) {
    firebase?.logEvent('set_demo_file', { demo_image: img })
    const imgBlob = await fetch(`/exemples/${img}.jpeg`).then(r => r.blob())
    const f = new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' })
    editor.setFile(f)
    editor.setOriginalFile(f)
  }

  async function onFileChange(f: File) {
    if (!firebase) {
      throw new Error('No firebase')
    }
    const image = await getImage(f)

    firebase.logEvent('set_file', {
      originalWidth: image.width,
      originalHeight: image.height,
    })

    // If user is not pro and image is larger than LD
    if (
      !user?.isPro() &&
      (image.width > RESIZE_LD || image.height > RESIZE_LD)
    ) {
      setDownscaleModalImage(image)
      return
    }

    const { file: resizedFile } = await resizeImageFile(f, RESIZE_HD)
    editor.setFile(resizedFile)
  }

  async function onDownscaleAndContinue() {
    if (!editor.originalFile) {
      throw new Error('No original file')
    }

    const {
      file: resizedFile,
      originalHeight,
      originalWidth,
    } = await resizeImageFile(editor.originalFile, RESIZE_LD)
    editor.setFile(resizedFile)
    setDownscaleModalImage(undefined)

    firebase?.logEvent('downscale_and_continue', {
      originalWidth,
      originalHeight,
    })
  }

  function closeUpgradeFlow() {
    firebase?.logEvent('upgrade_close')
    window.history.pushState({}, document.title, '/')
    setUpgradeFlowScreen(null)
    setShowUpgrade(false)
  }

  function closeDownscale() {
    firebase?.logEvent('close_downscale_modal')
    setDownscaleModalImage(undefined)
    editor.setFile(undefined)
    editor.setOriginalFile(undefined)
  }

  return (
    <div
      className={[
        'app min-h-full flex flex-col',
        editor.file ? 'fixed w-full h-full overflow-hidden' : '',
      ].join(' ')}
    >
      {editor.file ? (
        <>
          <EditorHeader
            useHD={editor.useHD}
            refiner={editor.refiner}
            setRefiner={editor.setRefiner}
            onBack={() => {
              firebase?.logEvent('start_new')
              editor.setOriginalFile(undefined)
              editor.setFile(undefined)
            }}
            setShowUpgrade={setShowUpgrade}
            showOriginal={showOriginal}
            setShowOriginal={setShowOriginal}
            setShowSignin={setShowSignin}
          />
          <EditorUI
            showOriginal={showOriginal}
            setShowOriginal={setShowOriginal}
            showSeparator={showSeparator}
            setShowSeparator={setShowSeparator}
          />
        </>
      ) : (
        <Homepage
          setOriginalFile={editor.setOriginalFile}
          onFileChange={f => onFileChange(f)}
          startWithDemoImage={startWithDemoImage}
          setShowUpgrade={setShowUpgrade}
          setShowSignin={setShowSignin}
        />
      )}

      {downscaleModalImage && (
        <DownscaleModal
          onClose={closeDownscale}
          onDownscale={onDownscaleAndContinue}
          onUpgrade={() => setShowUpgrade(true)}
          image={downscaleModalImage}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={closeUpgradeFlow}
          screen={upgradeFlowScreen}
          isProUser={user?.isPro()}
        />
      )}

      {showSignin && <SignInModal onClose={() => setShowSignin(false)} />}
    </div>
  )
}

export default App
