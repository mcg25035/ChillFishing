import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

const FishingAnimation = forwardRef(({ onAnimationComplete }, ref) => { // Removed raffleResult prop
  const [animationClasses, setAnimationClasses] = useState({
    rod: '',
    bobber: '',
  });

  const rodRef = useRef(null);
  const bobberRef = useRef(null);

  const triggerAnimationSequence = useCallback(() => {
    setAnimationClasses({ rod: '', bobber: '' }); // Reset rod and bobber animations

    // 1. Rod swings down (0.75s)
    setAnimationClasses((prev) => ({ ...prev, rod: 'swing-down' }));
    setAnimationClasses((prev) => ({ ...prev, bobber: 'grow' })); // Bobber grows simultaneously

    // 2. Pause (0.5s)
    setTimeout(() => {
      // 3. Rod swings reverse (0.375s)
      setAnimationClasses((prev) => ({ ...prev, rod: 'swing-reverse' }));
      // After swing-reverse (0.375s)
      setTimeout(() => {
        setAnimationClasses((prev) => ({ ...prev, rod: '' })); // Clear swing-reverse class
        // 4. Rod flies away (0.75s)
        setTimeout(() => {
          setAnimationClasses((prev) => ({ ...prev, rod: 'fly-away' }));
          // Animation sequence complete, notify parent
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 0); // fly-away starts immediately after swing-reverse finishes
      }, 375);
    }, 500);
  }, [onAnimationComplete]);

  // Expose triggerAnimationSequence to parent component
  useImperativeHandle(ref, () => ({
    start: () => {
      triggerAnimationSequence();
    },
    reset: () => {
      setAnimationClasses({ rod: '', bobber: '' }); // Reset only rod and bobber
    }
  }));

  return (
    <div className="fishing-animation-container">
      <img
        src="/fishing_rod.webp"
        alt="Fishing Rod"
        ref={rodRef}
        className={`fishing-rod ${animationClasses.rod}`}
      />
      <img
        src="/fishing_bobber.webp"
        alt="Fishing Bobber"
        ref={bobberRef}
        className={`fishing-bobber ${animationClasses.bobber}`}
      />
    </div>
  );
});

export default FishingAnimation;
