import { useEffect, useRef, useState } from 'react'
import OGCanvas from './OGCanvas'

export default function OGPreview({ meta, canvasRef, showTagline }) {
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        setScale(wrapperRef.current.clientWidth / 1200)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  if (!meta) return null

  const hasImage = Boolean(meta.image)

  return (
    <div className="preview-wrapper">
      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          height: 630 * scale,
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <OGCanvas ref={canvasRef} meta={meta}>

            {/* bg image — right side, bleeds to edges */}
            {hasImage && (
              <img
                src={meta.image}
                alt=""
                crossOrigin="anonymous"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 780,
                  height: 630,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            )}

            {/* left gradient */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: hasImage
                ? 'linear-gradient(to right, #000000 30%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.1) 100%)'
                : 'transparent',
              pointerEvents: 'none',
            }} />

            {/* bottom gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 320,
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {/* main text — bottom left */}
            <div style={{
              position: 'absolute',
              left: 80,
              bottom: 80,
              right: 520,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {meta.siteName && (
                <span style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 16,
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                }}>
                  {meta.siteName}
                </span>
              )}

              <h1 style={{
                color: '#ffffff',
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1.0,
                margin: 0,
                letterSpacing: '-0.03em',
              }}>
                {meta.title}
              </h1>

              {meta.description && (
                <p style={{
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 24,
                  lineHeight: 1.4,
                  margin: 0,
                  fontWeight: 400,
                }}>
                  {meta.description}
                </p>
              )}
            </div>

            {/* tagline — right: 80, bottom: 48 */}
            {showTagline && (
              <div style={{
                position: 'absolute',
                right: 80,
                bottom: 48,
                color: 'rgba(255,255,255,0.45)',
                fontSize: 15,
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}>
                Building What&apos;s Next
              </div>
            )}

          </OGCanvas>
        </div>
      </div>
    </div>
  )
}
