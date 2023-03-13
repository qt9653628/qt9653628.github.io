import { ReactNode, useRef, useState } from 'react'

interface ButtonProps {
  children?: ReactNode
  className?: string
  icon?: ReactNode
  primary?: boolean
  disabled?: boolean
  onClick?: () => void
  onDown?: (ev: PointerEvent) => void
  onUp?: (ev: PointerEvent) => void
}

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    disabled,
    icon,
    primary,
    onClick,
    onDown,
    onUp,
  } = props
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>()
  let background = ''
  if (primary && !disabled) {
    background = 'bg-primary hover:bg-black hover:text-white'
  }
  if (primary && disabled) {
    background = 'bg-primary'
  }
  if (active) {
    background = 'bg-primary text-white'
  }
  if (!primary && !active) {
    background = 'hover:bg-primary'
  }
  return (
    <div
      ref={r => {
        if (r) {
          ref.current = r
        }
      }}
      role="button"
      onKeyDown={() => {
        // do nothing
      }}
      onClick={() => {
        ref.current?.blur()
        onClick?.()
      }}
      onPointerDown={(ev: React.PointerEvent<HTMLDivElement>) => {
        setActive(true)
        onDown?.(ev.nativeEvent)
      }}
      onPointerUp={(ev: React.PointerEvent<HTMLDivElement>) => {
        setActive(false)
        onUp?.(ev.nativeEvent)
      }}
      tabIndex={-1}
      className={[
        'inline-flex py-3 rounded-xl cursor-pointer',
        children ? 'space-x-3 px-5' : 'px-3 sm:px-5',
        background,
        disabled ? 'pointer-events-none opacity-50' : '',
        'justify-center items-center',
        className,
      ].join(' ')}
    >
      {icon}
      <span className="whitespace-nowrap select-none">{children}</span>
    </div>
  )
}
