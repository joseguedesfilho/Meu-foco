import React from 'react';
import { motion } from 'motion/react';
import { Download, Trash2, Calendar } from 'lucide-react';
import { ProcessedImage } from '../types';

interface HistoryCardProps {
  item: ProcessedImage;
  onDownload: (item: ProcessedImage) => void;
  onDelete: (id: string) => void;
  onClick: (item: ProcessedImage) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item, onDownload, onDelete, onClick }) => {
  const date = new Date(item.timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl overflow-hidden group"
    >
      <div 
        className="aspect-[3/4] relative cursor-pointer overflow-hidden"
        onClick={() => onClick(item)}
      >
        <img 
          src={item.processedUrl} 
          alt="Processed" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gold-300">{item.style} • {item.mode}</span>
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <Calendar size={12} />
          <span>{date}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onDownload(item)}
            className="p-2 rounded-lg bg-white/5 hover:bg-gold-500/20 hover:text-gold-300 transition-colors"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
