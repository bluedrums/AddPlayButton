import Image from 'next/image';

const SplashScreen = () => {
  return (
    <div
      style={{
        backgroundColor: '#8A63D2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      <Image src="/appicon.jpg" alt="App Icon" width={128} height={128} className="rounded-3xl" />
    </div>
  );
};

export default SplashScreen; 