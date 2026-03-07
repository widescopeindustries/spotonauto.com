import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SpotOnAuto - Free DIY Auto Repair Guides'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050505 0%, #0a1628 50%, #050505 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)',
          }}
        />

        {/* Logo text */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          SPOTON
          <span style={{ color: '#3b82f6' }}>AUTO</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          Free DIY Auto Repair Guides for Your Car
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {['AI Diagnostics', 'OBD2 Codes', 'Wiring Diagrams', 'Repair Guides'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '24px',
                  padding: '8px 20px',
                  fontSize: 18,
                  color: '#93c5fd',
                  display: 'flex',
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Veteran badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '32px',
            fontSize: 14,
            color: '#64748b',
            display: 'flex',
          }}
        >
          Veteran-Owned SDVOSB | spotonauto.com
        </div>
      </div>
    ),
    { ...size }
  )
}
