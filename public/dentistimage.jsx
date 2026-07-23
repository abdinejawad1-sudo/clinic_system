import { useState, useEffect, useRef } from 'react';

const DentistImage = () => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startRotation = useRef(0);

  // دوران تلقائي
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setRotation((prev) => (prev + 0.3) % 360);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging]);

  // التحكم بالمؤشر
  const handleMouseDown = (e) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startRotation.current = rotation;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diff = (e.clientX - startX.current) * 0.5;
    setRotation(startRotation.current + diff);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: '20px'
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: 'grab', 
          display: 'inline-block',
          perspective: '1000px'
        }}
      >
        <img 
          src="/images/tooth.png"  // ← غير اسم الملف هنا
          alt="سن ثلاثي الأبعاد"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s linear',
            width: '400px',
            height: '400px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.2))'
          }}
        />
      </div>
      <p style={{ 
        marginTop: '15px', 
        color: '#666',
        fontSize: '14px'
      }}>
        🖱️ اسحب الصورة لليمين أو اليسار للتدوير
      </p>
    </div>
  );
};

export default DentistImage;