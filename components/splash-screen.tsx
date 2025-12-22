/**
 * SplashScreen Component
 * 
 * NOTE: This component is currently not used. The app relies on the Farcaster SDK
 * splash screen configured in farcaster.json and the embed metadata in page.tsx/layout.tsx.
 * 
 * Kept for potential future use as a fallback for non-Farcaster clients.
 */

import Image from 'next/image';

const SplashScreen = () => {
  return (
    <div
      style={{
        backgroundColor: '#8A63D3',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        margin: 0,
        padding: 0,
        fontFamily: "'Ubuntu', sans-serif",
      }}
    >
      <Image
        src="/appicon(whiteontransparent).png"
        alt="App Icon"
        width={128}
        height={128}
        style={{
          borderRadius: '24px',
          marginBottom: '24px',
          background: 'transparent'
        }}
      />
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}
      >
        Add Play Button
      </h1>
      {/* <p
        style={{
          fontSize: '16px',
          fontWeight: '400',
          color: 'white',
          margin: 0,
          textAlign: 'center',
          opacity: 0.9,
        }}
      >
        Share and drive traffic anywhere.
      </p> */}
    </div>
  );
};

export default SplashScreen; 