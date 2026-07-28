'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { RedBlackTree, Snapshot } from '../lib/rbt';
import TreeCanvas from './TreeCanvas';

export default function RedBlackTreeVisualizer() {
  const [engine] = useState(() => new RedBlackTree());
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<string[]>(['Tree initialized.']);

  const currentSnapshot = snapshots[step];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && step < snapshots.length - 1) {
      timer = setTimeout(() => setStep(s => s + 1), 1200);
    } else if (step === snapshots.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step, snapshots.length]);

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    
    const ops = engine.insert(val);
    setSnapshots(ops);
    setStep(0);
    setHistory(prev => [...prev, `Inserted ${val}`]);
    setInputValue('');
    setIsPlaying(true);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans">
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50 shadow-2xl">
          {currentSnapshot && (
            <TreeCanvas tree={currentSnapshot.tree} activeNodeIds={currentSnapshot.activeNodeIds} />
          )}
        </div>

        {/* Control Panel */}
        <div className="mt-6 p-4 rounded-xl border border-gray-800 bg-gray-900 flex justify-between items-center shadow-lg">
          <form onSubmit={handleInsert} className="flex space-x-3">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Node Value..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">
              Insert
            </button>
          </form>

          <div className="flex space-x-4 items-center">
            <button onClick={() => setStep(0)} disabled={step === 0} className="p-2 hover:bg-gray-800 rounded-full disabled:opacity-50">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-blue-400">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button onClick={() => setStep(s => Math.min(s + 1, snapshots.length - 1))} disabled={step === snapshots.length - 1} className="p-2 hover:bg-gray-800 rounded-full disabled:opacity-50">
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={() => setStep(snapshots.length - 1)} disabled={step === snapshots.length - 1} className="p-2 hover:bg-gray-800 rounded-full disabled:opacity-50">
              <FastForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Educational Sidebar */}
      <div className="w-[400px] border-l border-gray-800 bg-gray-900 p-6 flex flex-col shadow-2xl">
        <h2 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-2">Live Explanation</h2>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-xl min-h-[100px] flex items-center">
          <p className="text-gray-100 font-medium leading-relaxed">
            {currentSnapshot?.message || "Awaiting operation..."}
          </p>
        </div>

        <h2 className="text-sm uppercase tracking-wider font-bold text-gray-500 mt-8 mb-4">Session Log</h2>
        <div className="flex-1 overflow-auto pr-2">
          <ul className="space-y-3">
            {history.map((log, i) => (
              <li key={i} className="flex items-center space-x-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">{log}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}