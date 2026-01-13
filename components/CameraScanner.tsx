
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraScannerProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, isProcessing, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  }, [onCapture]);

  if (hasPermission === false) {
    return (
      <div className="brutalist-card flex flex-col items-center justify-center min-h-[400px] bg-red-100 p-8 text-center">
        <div className="text-black mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xl font-black text-black uppercase tracking-tighter">Access Denied</p>
        <button onClick={onClose} className="mt-8 brutalist-button bg-white text-black px-8 py-3 font-black uppercase tracking-widest text-xs">Return</button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden border-[6px] border-black bg-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover grayscale brightness-125 contrast-125"
      />
      
      {/* HUD Overlay - Industrial Style */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
           <div className="w-12 h-12 border-t-[6px] border-l-[6px] border-black"></div>
           <div className="w-12 h-12 border-t-[6px] border-r-[6px] border-black"></div>
        </div>
        <div className="flex justify-between items-end">
           <div className="w-12 h-12 border-b-[6px] border-l-[6px] border-black"></div>
           <div className="w-12 h-12 border-b-[6px] border-r-[6px] border-black"></div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between bg-white border-t-[6px] border-black">
        <button onClick={onClose} className="brutalist-button bg-red-600 text-white p-3 border-2 border-black">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <button
          onClick={handleCapture}
          disabled={isProcessing}
          className="w-24 h-24 bg-black border-[4px] border-white flex items-center justify-center brutalist-button rotate-45 active:rotate-0"
        >
          <div className="w-12 h-12 border-4 border-white -rotate-45" />
        </button>

        <div className="w-12" /> {/* Spacer */}
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-[#FACC15] flex flex-col items-center justify-center text-black p-12 text-center border-[8px] border-black animate-in zoom-in-50 duration-200">
          <div className="w-20 h-20 border-[6px] border-black border-t-white bg-black animate-spin mb-8"></div>
          <h3 className="text-4xl font-black uppercase italic tracking-tighter">Filtering...</h3>
          <p className="text-xs font-black uppercase tracking-[0.2em] mt-4 bg-white border-2 border-black px-4 py-1">AI Scan in Progress</p>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;
