
import React from 'react';
import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  onVisualize: (id: string) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onVisualize }) => {
  return (
    <div className="brutalist-card flex flex-col group">
      <div className="relative w-full aspect-[4/3] bg-gray-200 border-b-[3px] border-black flex-shrink-0 overflow-hidden">
        {dish.imageUrl ? (
          <img 
            src={dish.imageUrl} 
            alt={dish.name} 
            className="w-full h-full object-cover animate-in zoom-in-110 duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#F3F4F6]">
            {dish.isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-[5px] border-black border-t-white animate-spin mb-4" />
                <span className="text-xs text-black font-black uppercase tracking-[0.2em] animate-pulse">Rendering...</span>
              </div>
            ) : dish.error ? (
              <div className="flex flex-col items-center text-center px-4">
                <div className="w-12 h-12 bg-red-100 border-2 border-black flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-xs text-red-600 font-black uppercase tracking-widest mb-4">{dish.error}</span>
                <button 
                  onClick={() => onVisualize(dish.id)}
                  className="brutalist-button text-xs font-black uppercase tracking-widest text-black border border-black px-6 py-2 bg-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onVisualize(dish.id)}
                className="flex flex-col items-center text-center group w-full h-full justify-center"
              >
                <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center group-hover:bg-[#FACC15] transition-all mb-4 rotate-2 group-hover:rotate-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-black uppercase tracking-tighter">View Visual</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-white">
        <div className="flex flex-col gap-2 mb-4">
          <span className="self-start text-[10px] bg-black text-white px-3 py-1 font-black uppercase tracking-[0.2em]">
            {dish.category}
          </span>
          <h3 className="text-3xl font-black text-black uppercase leading-none tracking-tighter">{dish.name}</h3>
        </div>
        <p className="text-black font-medium leading-tight text-lg">
          {dish.description}
        </p>
      </div>
    </div>
  );
};

export default DishCard;
