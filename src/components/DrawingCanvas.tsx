import React, { useRef, useState, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { Pen, Highlighter, Eraser, Trash2 } from 'lucide-react';

// Format SVG path
function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

type Point = [number, number, number];

export interface LineData {
  points: Point[];
  tool: 'pen' | 'highlighter';
}

export interface DrawingCanvasProps {
  initialData?: string; // JSON string
  onChange?: (data: string) => void;
  readOnly?: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialData, onChange, readOnly }) => {
  const [lines, setLines] = useState<LineData[]>(() => {
    if (initialData) {
      try { 
        const parsed = JSON.parse(initialData); 
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])) {
            return parsed.map(points => ({ points, tool: 'pen' }));
          }
          return parsed;
        }
      } catch (e) { return []; }
    }
    return [];
  });
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const svg = svgRef.current;
    if (!svg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = svg.getBoundingClientRect();
    
    if (currentTool === 'eraser') {
       return;
    }
    
    setCurrentLine([[e.clientX - rect.left, e.clientY - rect.top, e.pressure]]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || e.buttons !== 1) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'eraser') {
      setLines(prev => {
        const next = prev.filter(line => {
          return !line.points.some(p => Math.hypot(p[0] - x, p[1] - y) < 20);
        });
        if (next.length !== prev.length) {
            onChange?.(JSON.stringify(next));
        }
        return next;
      });
      return;
    }

    setCurrentLine(prev => [...prev, [x, y, e.pressure]]);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (currentLine.length > 0 && currentTool !== 'eraser') {
      const newLine: LineData = { points: currentLine, tool: currentTool as 'pen' | 'highlighter' };
      const newLines = [...lines, newLine];
      setLines(newLines);
      setCurrentLine([]);
      onChange?.(JSON.stringify(newLines));
    }
  };

  const getStrokeOptions = (tool: 'pen' | 'highlighter') => {
    if (tool === 'highlighter') {
      return { size: 24, thinning: 0.1, smoothing: 0.8, streamline: 0.8 };
    }
    return { size: 6, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
  };

  const getFillStyle = (tool: 'pen' | 'highlighter') => {
    if (tool === 'highlighter') return "rgba(255, 255, 0, 0.3)";
    return "#cc0000"; // ntg-red
  };

  const getCursorStyle = () => {
    if (readOnly) return undefined;
    const encodeSvg = (svgStr: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    
    if (currentTool === 'pen') {
      return `${encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cc0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`)} 0 24, crosshair`;
    }
    if (currentTool === 'highlighter') {
      return `${encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l20 20"/><path d="M14 6l4 4"/><path d="M20 10l-4-4-5 5 4 4z"/><path d="M11 11L6 6M5 19h4"/></svg>`)} 0 24, crosshair`;
    }
    if (currentTool === 'eraser') {
      return `${encodeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l7 7-8 8-7-7 8-8z"/><path d="M8 11l-5 5v3h3l5-5"/><path d="M22 22H6l-4-4"/></svg>`)} 0 24, crosshair`;
    }
    return 'crosshair';
  };

  return (
    <>
      {!readOnly && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ntg-dark/90 backdrop-blur-md border border-ntg-gray/30 rounded-full p-2 flex gap-2 z-50 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]" style={{ pointerEvents: 'auto' }}>
          <button onClick={() => setCurrentTool('pen')} title="Pen" className={`p-3 rounded-full transition-colors ${currentTool === 'pen' ? 'bg-ntg-white text-ntg-black' : 'text-ntg-white hover:bg-ntg-gray/30'}`}><Pen size={20}/></button>
          <button onClick={() => setCurrentTool('highlighter')} title="Highlighter" className={`p-3 rounded-full transition-colors ${currentTool === 'highlighter' ? 'bg-ntg-white text-ntg-black' : 'text-ntg-white hover:bg-ntg-gray/30'}`}><Highlighter size={20}/></button>
          <button onClick={() => setCurrentTool('eraser')} title="Eraser" className={`p-3 rounded-full transition-colors ${currentTool === 'eraser' ? 'bg-ntg-white text-ntg-black' : 'text-ntg-white hover:bg-ntg-gray/30'}`}><Eraser size={20}/></button>
          <div className="w-[1px] bg-ntg-gray/30 mx-1 my-2" />
          <button onClick={() => { setLines([]); onChange?.('[]'); }} title="Clear All" className="p-3 text-ntg-red hover:bg-ntg-gray/30 rounded-full transition-colors"><Trash2 size={20}/></button>
        </div>
      )}
      <svg
        ref={svgRef}
        style={{ touchAction: 'none', cursor: getCursorStyle() }}
        className={`absolute inset-0 w-full h-full z-20 ${readOnly ? 'pointer-events-none' : 'pointer-events-auto touch-none'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <rect width="100%" height="100%" fill="transparent" />
        {lines.map((line, i) => {
          const strokeData = getStroke(line.points, getStrokeOptions(line.tool));
          return <path key={i} d={getSvgPathFromStroke(strokeData)} fill={getFillStyle(line.tool)} />;
        })}
        {currentLine.length > 0 && currentTool !== 'eraser' && (
          <path
            d={getSvgPathFromStroke(getStroke(currentLine, getStrokeOptions(currentTool as 'pen' | 'highlighter')))}
            fill={getFillStyle(currentTool as 'pen' | 'highlighter')}
          />
        )}
      </svg>
    </>
  );
};
