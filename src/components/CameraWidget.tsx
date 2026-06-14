import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { Camera, CameraOff, Hand, MousePointerClick, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NothingButton } from './NothingButton';

export const CameraWidget = ({ active, onClose }: { active: boolean, onClose: () => void }) => {
  const webcamRef = useRef<Webcam>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gesturesEnabled, setGesturesEnabled] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [showTour, setShowTour] = useState(true);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const requestRef = useRef<number>();

  useEffect(() => {
    // Load the model
    const loadModel = async () => {
      setIsModelLoading(true);
      await tf.ready();
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      setIsModelLoading(false);
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (!gesturesEnabled || !model || !active) return;

    const detect = async () => {
      if (!gesturesEnabled || !model || !active) return;
      
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        
        try {
          const hands = await model.estimateHands(video);

          if (hands.length > 0) {
            const hand = hands[0];
            
            // Index finger tip is landmark 8, thumb tip is 4
            const indexFingerTip = hand.landmarks[8];
            const thumbTip = hand.landmarks[4];

            // Mapping video coordinates to screen coordinates
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // X is mirrored (since video is mirrored), so we invert it
            // Or depending on the webcam feed it might be direct. Let's invert X for natural feel.
            const vx = videoWidth - indexFingerTip[0];
            const vy = indexFingerTip[1];

            // Calculate raw screen coordinates
            // Add some scaling to allow reaching edges without moving hand too far
            const scale = 1.5;
            const cx = Math.max(0, Math.min(screenWidth, (vx / videoWidth - 0.5) * scale * screenWidth + screenWidth / 2));
            const cy = Math.max(0, Math.min(screenHeight, (vy / videoHeight - 0.5) * scale * screenHeight + screenHeight / 2));

            if (cursorRef.current) {
              cursorRef.current.style.transform = `translate(${cx}px, ${cy}px)`;
            }

            // Distance between thumb and index for pinch click
            const distance = Math.sqrt(
              Math.pow(indexFingerTip[0] - thumbTip[0], 2) + 
              Math.pow(indexFingerTip[1] - thumbTip[1], 2) + 
              Math.pow(indexFingerTip[2] - thumbTip[2], 2)
            );

            // Threshold for pinch
            if (distance < 30) {
              if (!isClicking) {
                setIsClicking(true);
                if (cursorRef.current) {
                  cursorRef.current.style.backgroundColor = 'rgba(204, 0, 0, 0.8)';
                  cursorRef.current.style.transform = `translate(${cx}px, ${cy}px) scale(0.8)`;
                }
                // Simulate click
                const el = document.elementFromPoint(cx, cy);
                if (el && el instanceof HTMLElement) {
                  el.click();
                }
              }
            } else {
              if (isClicking) {
                setIsClicking(false);
                if (cursorRef.current) {
                  cursorRef.current.style.backgroundColor = 'var(--theme-white)';
                }
              }
            }
          }
        } catch (error) {
          console.error("Hand detection error:", error);
        }
      }
      
      // Throttle detection to ~20FPS (50ms interval) to prevent lagging the whole site
      requestRef.current = window.setTimeout(() => {
        requestAnimationFrame(detect);
      }, 50);
    };

    detect();

    return () => {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
    };
  }, [gesturesEnabled, model, active, isClicking]);

  if (!active) return null;

  const handleToggleGestures = () => {
    setGesturesEnabled(!gesturesEnabled);
    if (showTour) setShowTour(false);
  };

  return (
    <>
      {/* Floating Widget */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: window.innerWidth - 250, top: 0, bottom: window.innerHeight - 250 }}
        dragMomentum={false}
        className="fixed bottom-6 right-6 z-[9990] w-64 h-64 sm:w-72 sm:h-72 rounded-2xl md:rounded-3xl overflow-hidden border border-ntg-gray/40 shadow-2xl bg-ntg-black flex flex-col cursor-move"
      >
        <div className="absolute top-2 left-2 right-2 flex justify-between z-20 pointer-events-none">
           <NothingButton 
             variant="ghost" 
             className="!p-1.5 bg-ntg-black/50 backdrop-blur-sm pointer-events-auto"
             onClick={handleToggleGestures}
             title="Toggle Hand Gestures"
             disabled={isModelLoading}
           >
             {isModelLoading ? <Loader2 size={16} className="text-ntg-white animate-spin" /> : 
              gesturesEnabled ? <Camera size={16} className="text-ntg-white" /> : <CameraOff size={16} className="text-ntg-red" />}
           </NothingButton>
           <NothingButton 
             variant="ghost" 
             className="!p-1.5 bg-ntg-black/50 backdrop-blur-sm pointer-events-auto"
             onClick={onClose}
             title="Close Camera"
           >
             <span className="font-ndot text-xs">X</span>
           </NothingButton>
        </div>
        
        <Webcam
          ref={webcamRef}
          audio={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          videoConstraints={{ facingMode: "user" }}
          mirrored={true}
        />
        
        {/* Curved inner shadow for aesthetic */}
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none z-10"></div>

        {/* Onboarding Tour Overlay */}
        <AnimatePresence>
          {showTour && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 bg-ntg-black/80 backdrop-blur-md z-30 p-5 flex flex-col justify-center pointer-events-auto cursor-default"
            >
              <h3 className="font-ndot tracking-widest uppercase text-ntg-white mb-4 text-center">Hand Gestures</h3>
              
              <div className="space-y-3 mb-5 text-sm text-ntg-light">
                <div className="flex items-center gap-3">
                  <Hand size={18} className="shrink-0" />
                  <span>Point <strong className="text-ntg-white">Index finger</strong> to move cursor</span>
                </div>
                <div className="flex items-center gap-3">
                  <MousePointerClick size={18} className="shrink-0" />
                  <span>Pinch with <strong className="text-ntg-white">Thumb</strong> to click</span>
                </div>
              </div>

              {isModelLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-ntg-gray">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading AI Model...</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <NothingButton variant="outline" className="flex-1 py-1 text-xs" onClick={() => setShowTour(false)}>
                    Skip
                  </NothingButton>
                  <NothingButton className="flex-1 py-1 text-xs" onClick={() => { setGesturesEnabled(true); setShowTour(false); }}>
                    Enable Let's Go
                  </NothingButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual feedback when gestures are enabled */}
        {gesturesEnabled && !showTour && (
           <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
             <div className="bg-ntg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-ntg-white/10 text-[10px] uppercase font-ndot tracking-wider text-ntg-white/70">
                Pinch to Click
             </div>
           </div>
        )}
      </motion.div>

      {/* Virtual Cursor */}
      {gesturesEnabled && (
        <div
          ref={cursorRef}
          className="fixed top-0 left-0 w-6 h-6 rounded-full border-2 border-ntg-black pointer-events-none z-[9999] transition-transform duration-75 shadow-lg flex items-center justify-center bg-ntg-white"
          style={{ transform: 'translate(-100px, -100px)', willChange: 'transform' }}
        >
          {isClicking && <div className="w-2 h-2 bg-ntg-black rounded-full" />}
        </div>
      )}
    </>
  );
};
