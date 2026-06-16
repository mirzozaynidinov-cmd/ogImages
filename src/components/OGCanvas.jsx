import { forwardRef } from 'react'
import LogoSvg from '../assets/Logo.svg'

const OGCanvas = forwardRef(({ meta, children }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        backgroundColor: '#000000',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'TestDieGroteskVF', Inter, system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {children}

      {/* Logo always on top */}
      <img
        src={LogoSvg}
        alt="Logo"
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          width: 128,
          height: 32,
          display: 'block',
          zIndex: 10,
        }}
      />
    </div>
  )
})

OGCanvas.displayName = 'OGCanvas'
export default OGCanvas
