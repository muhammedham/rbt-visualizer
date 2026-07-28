import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { TreeNode } from '../lib/rbt';

type LayoutNode = {
  id: number;
  val: number;
  color: 'RED' | 'BLACK';
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
};

export default function TreeCanvas({ tree, activeNodeIds }: { tree: TreeNode, activeNodeIds: number[] }) {

  const layout = useMemo(() => {
    const flattenLayout = (node: TreeNode, x: number, y: number, dx: number, dy: number, pX?: number, pY?: number): LayoutNode[] => {
      if (!node || node.isNil) return [];
      const current = { id: node.id, val: node.val, color: node.color, x, y, parentX: pX, parentY: pY };
      return [
        current,
        ...flattenLayout(node.left, x - dx, y + dy, dx / 2, dy, x, y),
        ...flattenLayout(node.right, x + dx, y + dy, dx / 2, dy, x, y),
      ];
    };
    return flattenLayout(tree, 500, 50, 220, 80);
  }, [tree]);

  return (
    <div className="w-full h-full relative overflow-auto bg-[#232329] flex justify-center">
      <svg width="1000" height="600" className="min-w-max">
        {/* Edges */}
        {layout.map(node => node.parentX && (
          <motion.line
            key={`edge-${node.id}`}
            x1={node.parentX} y1={node.parentY}
            animate={{ x1: node.parentX, y1: node.parentY, x2: node.x, y2: node.y }}
            stroke="#494850" strokeWidth="2"
            transition={{ duration: 0.5 }}
          />
        ))}

        {/* Nodes */}
        <AnimatePresence>
          {layout.map(node => {
            const isActive = activeNodeIds.includes(node.id);
            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x: node.x, y: node.y }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.15 }}
              >
                <motion.circle
                  r="22"
                  animate={{
                    fill: node.color === 'RED' ? '#B23A5C' : '#2C2C34',
                    stroke: isActive ? '#D8D8F6' : node.color === 'RED' ? '#D1608A' : '#494850',
                    strokeWidth: isActive ? 4 : 2,
                  }}
                  className="shadow-xl"
                />
                <text
                  y="5" textAnchor="middle"
                  className="text-sm font-bold pointer-events-none fill-[#D8D8F6] font-mono"
                >
                  {node.val}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
