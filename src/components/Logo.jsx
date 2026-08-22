export function LogoMark({ size = 28 }) {
  return (
    <img
      src="/logo-icon.png"
      alt="GlobalTrotter"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  )
}

export function LogoWordmark({ size = 17, dark = true, className = '' }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`} style={{ fontSize: size }}>
      <span style={{ color: dark ? '#fff' : 'var(--ink)' }}>GLOBAL</span>
      <span style={{ color: 'var(--ac)' }}>TROTTER</span>
    </span>
  )
}

export default function Logo({ size = 28, textSize = 17, dark = true, showText = true, textClassName = '', onClick, className = '' }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <LogoMark size={size} />
      {showText && <LogoWordmark size={textSize} dark={dark} className={textClassName} />}
    </div>
  )
}
