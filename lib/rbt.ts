export type Snapshot = {
  tree: TreeNode;
  message: string;
  activeNodeIds: number[];
};

export class TreeNode {
  id: number;
  val: number;
  color: 'RED' | 'BLACK';
  left: TreeNode;
  right: TreeNode;
  parent: TreeNode;
  isNil: boolean;

  constructor(val: number, isNil = false) {
    this.id = Math.floor(Math.random() * 10000000);
    this.val = val;
    this.color = isNil ? 'BLACK' : 'RED';
    this.isNil = isNil;
    this.left = this as any;
    this.right = this as any;
    this.parent = this as any;
  }
}

export class RedBlackTree {
  nil: TreeNode;
  root: TreeNode;
  snapshots: Snapshot[] = [];

  constructor() {
    this.nil = new TreeNode(0, true);
    this.nil.left = this.nil;
    this.nil.right = this.nil;
    this.nil.parent = this.nil;
    this.root = this.nil;
  }

  takeSnapshot(msg: string, activeIds: number[] = []) {
    const newNil = new TreeNode(0, true);
    const clonedRoot = this.cloneTree(this.root, newNil, newNil);
    this.snapshots.push({ tree: clonedRoot, message: msg, activeNodeIds: activeIds });
  }

  private cloneTree(node: TreeNode, parentClone: TreeNode, newNil: TreeNode): TreeNode {
    if (node.isNil) return newNil;
    const clone = new TreeNode(node.val);
    clone.id = node.id; // Retain ID for Framer Motion tracking
    clone.color = node.color;
    clone.parent = parentClone;
    clone.left = this.cloneTree(node.left, clone, newNil);
    clone.right = this.cloneTree(node.right, clone, newNil);
    return clone;
  }

  // --- INSERTION LOGIC ---
  insert(val: number): Snapshot[] {
    this.snapshots = [];
    const z = new TreeNode(val);
    z.left = this.nil;
    z.right = this.nil;
    
    let y = this.nil;
    let x = this.root;

    this.takeSnapshot(`Preparing to insert ${val}`);
    while (x !== this.nil) {
      y = x;
      this.takeSnapshot(`Comparing ${val} with ${x.val}`, [x.id]);
      if (z.val < x.val) x = x.left;
      else if (z.val > x.val) x = x.right;
      else {
        this.takeSnapshot(`Value ${val} already exists. Aborting.`);
        return this.snapshots;
      }
    }

    z.parent = y;
    if (y === this.nil) this.root = z;
    else if (z.val < y.val) y.left = z;
    else y.right = z;

    this.takeSnapshot(`Inserted ${val} as RED`, [z.id]);
    this.insertFixup(z);
    return this.snapshots;
  }

  private insertFixup(z: TreeNode) {
    while (z.parent.color === 'RED') {
      if (z.parent === z.parent.parent.left) {
        let y = z.parent.parent.right; // Uncle
        if (y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Uncle (${y.val}) is RED. Recolored parent, uncle, and grandparent.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this.leftRotate(z);
            this.takeSnapshot(`Node is inner child. Left Rotate on ${z.val}.`, [z.id]);
          }
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Recolored parent and grandparent. Preparing Right Rotate on ${z.parent.parent.val}.`, [z.parent.id, z.parent.parent.id]);
          this.rightRotate(z.parent.parent);
          this.takeSnapshot(`Right Rotate complete.`, [z.parent.id]);
        }
      } else {
        // Symmetric right side
        let y = z.parent.parent.left;
        if (y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Uncle (${y.val}) is RED. Recolored parent, uncle, and grandparent.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rightRotate(z);
            this.takeSnapshot(`Node is inner child. Right Rotate on ${z.val}.`, [z.id]);
          }
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Recolored parent and grandparent. Preparing Left Rotate on ${z.parent.parent.val}.`, [z.parent.id, z.parent.parent.id]);
          this.leftRotate(z.parent.parent);
          this.takeSnapshot(`Left Rotate complete.`, [z.parent.id]);
        }
      }
    }
    if (this.root.color === 'RED') {
      this.root.color = 'BLACK';
      this.takeSnapshot(`Root must be BLACK. Recolored root.`, [this.root.id]);
    }
  }

  // --- ROTATIONS ---
  private leftRotate(x: TreeNode) {
    let y = x.right;
    x.right = y.left;
    if (y.left !== this.nil) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent === this.nil) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  private rightRotate(x: TreeNode) {
    let y = x.left;
    x.left = y.right;
    if (y.right !== this.nil) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent === this.nil) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }
  
  // Note: Full CLRS delete logic follows a similar pattern using `transplant` and `deleteFixup`.
  // Added standard insert logic here to keep the sandbox focused.
}