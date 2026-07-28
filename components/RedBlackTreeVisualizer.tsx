'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { RedBlackTree, Snapshot, TreeNode } from '../lib/rbt';
import TreeCanvas from './TreeCanvas';

// --- Live invariant checks (read-only, purely for the sidebar tracker) ---
function isRedRedFree(node: TreeNode): boolean {
  if (node.isNil) return true;
  if (node.color === 'RED') {
    if (!node.left.isNil && node.left.color === 'RED') return false;
    if (!node.right.isNil && node.right.color === 'RED') return false;
  }
  return isRedRedFree(node.left) && isRedRedFree(node.right);
}

// Returns the black-height, or -1 if the two subtrees disagree (a mid-fixup state)
function blackHeight(node: TreeNode): number {
  if (node.isNil) return 1;
  const l = blackHeight(node.left);
  const r = blackHeight(node.right);
  if (l === -1 || r === -1 || l !== r) return -1;
  return l + (node.color === 'BLACK' ? 1 : 0);
}

export default function RedBlackTreeVisualizer() {
  const [engine] = useState(() => new RedBlackTree());
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<string[]>(['Tree initialized. Ready for operations.']);

  const currentSnapshot = snapshots[step];
  const tree = currentSnapshot?.tree;

  const rootIsBlack = !tree || tree.isNil || tree.color === 'BLACK';
  const redRedFree = tree ? isRedRedFree(tree) : true;
  const bh = tree ? blackHeight(tree) : 1;
  const heightBalanced = bh !== -1;
  const progressPct = snapshots.length > 1 ? (step / (snapshots.length - 1)) * 100 : 0;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying && step < snapshots.length - 1) {
      timer = setTimeout(() => setStep(s => s + 1), 2000);
    } else if (step === snapshots.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step, snapshots.length]);

  const handleOperation = (e: React.MouseEvent, type: 'insert' | 'delete') => {
    e.preventDefault();
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    const ops = type === 'insert' ? engine.insert(val) : engine.delete(val);

    if (ops.length > 0) {
      setSnapshots(ops);
      setStep(0);
      setHistory(prev => [...prev, `${type === 'insert' ? 'Inserted' : 'Deleted'} Node ${val}`]);
      setIsPlaying(true);
    }
    setInputValue('');
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div
        className="flex h-screen bg-[#2C2C34] text-[#D8D8F6]"
        style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
      >
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#B18FCF] uppercase">Red-Black Tree</p>
              <h1 className="text-xl font-bold text-[#D8D8F6]">Interactive Visualizer</h1>
            </div>
            {snapshots.length > 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-[#978897]">
                  Step <span className="text-[#D8D8F6] font-semibold">{step + 1}</span> of {snapshots.length}
                </p>
                <div className="mt-1.5 w-40 h-1.5 rounded-full bg-[#494850] overflow-hidden">
                  <div
                    className="h-full bg-[#B18FCF] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden border border-[#494850] bg-[#232329] shadow-2xl">
            {currentSnapshot ? (
              <TreeCanvas tree={currentSnapshot.tree} activeNodeIds={currentSnapshot.activeNodeIds} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-[#978897] text-sm">Insert a value below to build the tree.</p>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="mt-6 p-4 rounded-2xl border border-[#494850] bg-[#33333b] flex justify-between items-center shadow-lg">
            <div className="flex space-x-3">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Node value"
                className="bg-[#2C2C34] border border-[#494850] text-[#D8D8F6] placeholder-[#978897] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#B18FCF] focus:border-transparent w-36"
                style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
              />
              <button
                type="button"
                onClick={(e) => handleOperation(e, 'insert')}
                className="flex items-center space-x-2 bg-[#B18FCF] hover:bg-[#c3a6dc] text-[#2C2C34] px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Insert</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleOperation(e, 'delete')}
                className="flex items-center space-x-2 bg-transparent hover:bg-[#494850] border border-[#978897] text-[#D8D8F6] px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>

            <div className="flex space-x-2 items-center">
              <button onClick={() => setStep(0)} disabled={step === 0 || snapshots.length === 0} className="p-2 hover:bg-[#494850] text-[#D8D8F6] rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={snapshots.length === 0 || step === snapshots.length - 1}
                className="p-3 bg-[#494850] hover:bg-[#5a5964] rounded-full text-[#B18FCF] disabled:opacity-30 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={() => setStep(s => Math.min(s + 1, snapshots.length - 1))} disabled={step === snapshots.length - 1 || snapshots.length === 0} className="p-2 hover:bg-[#494850] text-[#D8D8F6] rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={() => setStep(snapshots.length - 1)} disabled={step === snapshots.length - 1 || snapshots.length === 0} className="p-2 hover:bg-[#494850] text-[#D8D8F6] rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                <FastForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Educational Sidebar */}
        <div className="w-[420px] border-l border-[#494850] bg-[#26262c] p-6 flex flex-col shadow-2xl">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#978897] mb-2">Algorithm Step</h2>
          <div className="p-4 bg-[#33333b] border border-[#494850] rounded-xl min-h-[140px] flex items-start">
            <p className="text-[#D8D8F6] font-medium leading-relaxed">
              {currentSnapshot?.message || 'Insert or delete a node to begin the algorithm execution.'}
            </p>
          </div>

          {/* Signature element: live invariant tracker */}
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#978897] mt-8 mb-3">Invariant Tracker</h2>
          <div className="rounded-xl border border-[#494850] bg-[#33333b] divide-y divide-[#494850]">
            <InvariantRow label="Root is black" ok={rootIsBlack} />
            <InvariantRow label="No red-red conflicts" ok={redRedFree} />
            <InvariantRow
              label="Black height balanced"
              ok={heightBalanced}
              detail={heightBalanced ? `= ${bh}` : undefined}
            />
          </div>

          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#978897] mt-8 mb-4">Execution History</h2>
          <div className="flex-1 overflow-auto pr-2">
            <ul className="space-y-3">
              {history.map((log, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm" style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.includes('Deleted') ? 'bg-[#978897]' : 'bg-[#B18FCF]'}`}></span>
                  <span className="text-[#D8D8F6]/90">{log}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function InvariantRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[#D8D8F6]/90">{label}</span>
      <span className={`flex items-center space-x-1.5 text-xs font-semibold ${ok ? 'text-[#B18FCF]' : 'text-[#978897]'}`}>
        {detail && <span>{detail}</span>}
        {ok ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
      </span>
    </div>
  );
}
