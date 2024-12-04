import React, { useState, useEffect, useRef } from 'react';

const HeartRateBreathingApp = () => {
  const [heartRate, setHeartRate] = useState(70);
  const [breathingPhase, setBreathingPhase] = useState('Prepare');
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const breathingIntervalRef = useRef(null);

  // Simulate heart rate variations
  const updateHeartRate = () => {
    setHeartRate(prevRate => {
      const variation = Math.random() * 6 - 3;
      const newRate = Math.max(60, Math.min(prevRate + variation, 100));
      return Math.round(newRate);
    });
  };

  // Get background color based on heart rate
  const getBackgroundColor = () => {
    if (heartRate < 65) {
      // Calm, low heart rate - cool blue
      return 'bg-blue-100';
    } else if (heartRate < 75) {
      // Relaxed - soft green
      return 'bg-green-100';
    } else if (heartRate < 85) {
      // Moderately active - gentle yellow
      return 'bg-yellow-100';
    } else {
      // High intensity - warm orange/red
      return 'bg-red-100';
    }
  };

  // Determine breathing pattern based on heart rate
  const getBreathingTiming = () => {
    if (heartRate < 70) {
      return { inhale: 5, hold: 1, exhale: 5 };
    } else if (heartRate < 85) {
      return { inhale: 4, hold: 1, exhale: 4 };
    } else {
      return { inhale: 3, hold: 1, exhale: 3 };
    }
  };

  // Breathing cycle management
  const startBreathingCycle = () => {
    const { inhale, hold, exhale } = getBreathingTiming();
    let step = 0;

    breathingIntervalRef.current = setInterval(() => {
      switch (step) {
        case 0:
          setBreathingPhase('Inhale');
          break;
        case inhale:
          setBreathingPhase('Hold');
          break;
        case inhale + hold:
          setBreathingPhase('Exhale');
          break;
        case inhale + hold + exhale:
          setBreathingPhase('Prepare');
          step = -1;
          break;
      }
      step++;
    }, 1000);
  };

  // Start the entire process
  const startGuide = () => {
    if (isRunning) return;

    setIsRunning(true);
    // Heart rate variation interval
    intervalRef.current = setInterval(updateHeartRate, 2000);

    // Breathing cycle
    startBreathingCycle();
  };

  // Stop the guide
  const stopGuide = () => {
    if (!isRunning) return;

    setIsRunning(false);
    clearInterval(intervalRef.current);
    clearInterval(breathingIntervalRef.current);
    setBreathingPhase('Prepare');
    setHeartRate(70);
  };

  // Color and style for breathing phase
  const getPhaseStyle = () => {
    switch (breathingPhase) {
      case 'Inhale':
        return 'bg-green-200 text-green-800';
      case 'Hold':
        return 'bg-yellow-200 text-yellow-800';
      case 'Exhale':
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen flex justify-center items-center transition-colors duration-500 ${getBackgroundColor()}`}>
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Heart Rate Breathing Guide
        </h1>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="red"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span className="font-semibold">
              Heart Rate: {heartRate} bpm
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="blue"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 3a2.55 2.55 0 0 0 2 2h2a2.55 2.55 0 0 0 2-2 2.55 2.55 0 0 0 2 2h2a2.55 2.55 0 0 0 2-2"/>
              <path d="M2 13h4l3 9L16 4l3 9h4"/>
            </svg>
            <span className={`px-2 py-1 rounded ${getPhaseStyle()}`}>
              {breathingPhase}
            </span>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={startGuide}
            disabled={isRunning}
            className="bg-green-500 text-white px-4 py-2 rounded
                       hover:bg-green-600 disabled:opacity-50"
          >
            Start Guide
          </button>
          <button
            onClick={stopGuide}
            disabled={!isRunning}
            className="bg-red-500 text-white px-4 py-2 rounded
                       hover:bg-red-600 disabled:opacity-50"
          >
            Stop Guide
          </button>
        </div>

        <div className="text-center text-gray-600 text-sm">
          Your breathing rhythm adjusts based on your simulated heart rate
        </div>
      </div>
    </div>
  );
};

export default HeartRateBreathingApp;