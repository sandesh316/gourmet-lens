
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ScanResult, HistoryItem, Dish } from './types';
import { extractDishesFromMenu, generateVisualForDish } from './services/geminiService';
import CameraScanner from './components/CameraScanner';
import DishCard from './components/DishCard';

const STORAGE_KEY = 'gourmet_lens_history';
const MAX_HISTORY = 10;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (result: ScanResult) => {
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      result: { ...result, timestamp: Date.now() }
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateHistoryItem = (dishId: string, imageUrl: string) => {
    setHistory(prev => {
      const updated = prev.map(item => {
        if (item.result.dishes.some(d => d.id === dishId)) {
          const updatedDishes = item.result.dishes.map(d => 
            d.id === dishId ? { ...d, imageUrl } : d
          );
          return { ...item, result: { ...item.result, dishes: updatedDishes } };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const processImage = async (base64: string) => {
    setState(AppState.PROCESSING);
    setIsCameraActive(false);
    setError(null);
    try {
      const data = await extractDishesFromMenu(base64);
      setResults(data);
      setState(AppState.RESULTS);
      saveToHistory(data);
      
      if (data.dishes.length > 0) {
        handleVisualize(data.dishes[0].id, data);
      }
    } catch (err: any) {
      console.error(err);
      setState(AppState.ERROR);
      
      switch (err.message) {
        case "EMPTY_MENU":
          setError("NO DISHES FOUND. TRY A CLEARER SHOT OR A DIFFERENT MENU.");
          break;
        case "RATE_LIMIT":
          setError("SYSTEM BUSY. COOL DOWN FOR A SEC.");
          break;
        case "SAFETY_BLOCKED":
          setError("CONTENT FILTERED. TRY AGAIN.");
          break;
        default:
          setError("READ ERROR. CHECK CONNECTION OR IMAGE.");
      }
    }
  };

  const handleCapture = (base64: string) => {
    processImage(base64);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVisualize = async (dishId: string, currentResults?: ScanResult) => {
    const activeResults = currentResults || results;
    if (!activeResults) return;

    setResults(prev => prev ? ({
      ...prev,
      dishes: prev.dishes.map(d => d.id === dishId ? { ...d, isGenerating: true, error: undefined } : d)
    }) : null);

    const dish = activeResults.dishes.find(d => d.id === dishId);
    if (!dish) return;

    try {
      const imageUrl = await generateVisualForDish(dish.name);
      if (imageUrl) {
        setResults(prev => prev ? ({
          ...prev,
          dishes: prev.dishes.map(d => d.id === dishId ? { ...d, imageUrl, isGenerating: false } : d)
        }) : null);
        updateHistoryItem(dishId, imageUrl);
      } else {
        throw new Error("GEN_FAILED");
      }
    } catch (err: any) {
      console.error(err);
      let dishErrorMessage = "FAILED";
      if (err.message === "VISUAL_SAFETY") {
        dishErrorMessage = "FILTERED";
      } else if (err.message === "RATE_LIMIT") {
        dishErrorMessage = "BUSY";
      }

      setResults(prev => prev ? ({
        ...prev,
        dishes: prev.dishes.map(d => d.id === dishId ? { ...d, isGenerating: false, error: dishErrorMessage } : d)
      }) : null);
    }
  };

  const resetScanner = () => {
    setResults(null);
    setState(AppState.IDLE);
    setIsCameraActive(false);
    setError(null);
  };

  const viewHistoryItem = (item: HistoryItem) => {
    setResults(item.result);
    setState(AppState.RESULTS);
  };

  const clearHistory = () => {
    if (window.confirm("NUKE HISTORY?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-screen flex flex-col bg-[#FFFCF0] font-sans pb-20 border-x-[3px] border-black">
      {/* Brutalist Header */}
      <header className="p-8 bg-[#FACC15] border-b-[3px] border-black text-center">
        <h1 className="text-6xl font-black text-black tracking-tighter uppercase mb-1">Gourmet Lens</h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/60">Visualize the Unfamiliar</p>
      </header>

      {/* Navigation Toggles */}
      <div className="flex bg-black p-1 gap-1">
        <button 
          onClick={resetScanner}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${state !== AppState.HISTORY ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
        >
          Scanner
        </button>
        <button 
          onClick={() => setState(AppState.HISTORY)}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${state === AppState.HISTORY ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'}`}
        >
          History ({history.length})
        </button>
      </div>

      <main className="flex-grow p-6">
        {state === AppState.IDLE && !isCameraActive && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="brutalist-card p-8 bg-[#A3E635]">
              <h2 className="text-3xl font-black text-black leading-none mb-4 uppercase">See it before you eat it.</h2>
              <p className="text-black font-medium leading-tight text-lg">
                Stop guessing. Scan European menus and get high-def AI visuals of complex dishes instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <button 
                onClick={() => setIsCameraActive(true)}
                className="brutalist-button py-12 bg-[#FF52D9] text-white flex flex-col items-center gap-4 group"
              >
                <div className="w-16 h-16 bg-black text-white rounded-none flex items-center justify-center border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter">Scan Menu Now</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="brutalist-button py-6 bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Gallery
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
        )}

        {isCameraActive && (
          <CameraScanner 
            onCapture={handleCapture} 
            isProcessing={state === AppState.PROCESSING} 
            onClose={() => setIsCameraActive(false)}
          />
        )}

        {state === AppState.PROCESSING && !isCameraActive && (
          <div className="fixed inset-0 bg-[#FACC15] z-[100] flex flex-col items-center justify-center p-10 text-center border-[8px] border-black">
            <div className="w-24 h-24 border-[6px] border-black border-t-white bg-black animate-spin mb-10"></div>
            <h2 className="text-5xl font-black text-black mb-4 tracking-tighter uppercase italic">Decoding...</h2>
            <p className="text-black font-bold uppercase tracking-[0.2em] text-sm bg-white px-4 py-1 border-2 border-black">Prices ignored • Flavors detected</p>
          </div>
        )}

        {state === AppState.RESULTS && results && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter bg-white px-4 py-1 border-[3px] border-black">
                {results.dishes.length} Items Found
              </h2>
              <button onClick={resetScanner} className="brutalist-button text-xs font-black uppercase tracking-widest text-black bg-[#FACC15] px-6 py-2">
                New Scan
              </button>
            </div>

            <div className="grid gap-8">
              {results.dishes.map(dish => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  onVisualize={handleVisualize} 
                />
              ))}
            </div>
          </div>
        )}

        {state === AppState.HISTORY && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter bg-white px-4 py-1 border-[3px] border-black">Archive</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="brutalist-button text-xs font-black uppercase tracking-widest text-white bg-red-600 px-4 py-2">
                  Clear All
                </button>
              )}
            </div>
            
            <div className="grid gap-4">
              {history.length > 0 ? history.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => viewHistoryItem(item)}
                  className="brutalist-card p-6 text-left flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-2xl font-black text-black uppercase leading-none">
                      {item.result.cafeName || 'Untitled Cafe'}
                    </h3>
                    <p className="text-xs text-black/40 font-black uppercase tracking-widest mt-2">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.result.dishes.length} Items
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center group-hover:bg-[#FACC15] group-hover:text-black transition-colors border-2 border-black">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              )) : (
                <div className="brutalist-card text-center py-20 px-10 bg-white border-dashed">
                  <h3 className="text-3xl font-black text-black/20 uppercase tracking-tighter">Empty Archive</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {state === AppState.ERROR && (
          <div className="brutalist-card text-center py-16 px-8 bg-white">
             <div className="w-20 h-20 bg-red-600 text-white border-[3px] border-black flex items-center justify-center mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             <h2 className="text-3xl font-black text-black mb-4 uppercase">System Error</h2>
             <p className="text-black font-bold mb-8 leading-tight">{error}</p>
             <button onClick={resetScanner} className="brutalist-button w-full bg-black text-white py-5 font-black uppercase tracking-widest">
               Retry Operation
             </button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-none z-50">
        <div className="bg-black text-white px-8 py-2 border-[3px] border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neo-Brutalist Engine</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
