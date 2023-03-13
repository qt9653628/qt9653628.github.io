import { XIcon } from '@heroicons/react/outline'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useFirebase } from './adapters/firebase'
import Button from './components/Button'

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

type BannerItem = {
  id: string
  text: string

  cta: string
  url: string

  env: 'prod' | 'dev'
  active: boolean
}

export default function Banner() {
  const firebase = useFirebase()
  const [banner, setBanner] = useState<BannerItem>()

  useEffect(() => {
    if (!firebase?.firestore) {
      return
    }
    // Retrieve the banner content from the Firestore collection.
    const col = collection(firebase.firestore, 'banners')

    const q = query(
      col,
      where('env', '==', IS_DEV ? 'dev' : 'prod'),
      where('active', '==', true),
      limit(1)
    )
    onSnapshot(q, snapshot => {
      const doc = snapshot.docs[0]
      if (!doc) {
        return
      }
      if (doc.id && sessionStorage.getItem('closedBanner') !== doc.id) {
        const data = doc?.data()
        setBanner({ ...(data as BannerItem), id: doc.id })
      }
    })
  }, [firebase])

  if (!banner) {
    return <></>
  }
  return (
    <div className="bg-primary text-black p-3 sm:p-7 text-center font-semibold text-lg relative">
      {banner.text}
      <a
        className="underline pl-2"
        href={banner.url}
        target="_blank"
        rel="noreferrer dofollow"
      >
        {banner.cta}
      </a>
      <div className="absolute right-1 top-0 h-full flex items-center">
        <Button
          icon={<XIcon className="w-6 h-6" />}
          onClick={() => {
            // Write banner id to sessionStorage
            sessionStorage.setItem('closedBanner', banner?.id)
            setBanner(undefined)
          }}
        />
      </div>
    </div>
  )
}
