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
    clone.id = node.id;
    clone.color = node.color;
    clone.parent = parentClone;
    clone.left = this.cloneTree(node.left, clone, newNil);
    clone.right = this.cloneTree(node.right, clone, newNil);
    return clone;
  }

  // Helper to make the text read better when a node might be empty
  private nodeName(n: TreeNode): string {
    return n.isNil ? "an Empty/NIL node (which counts as BLACK)" : `node ${n.val}`;
  }

  // --- INSERTION LOGIC ---
  insert(val: number): Snapshot[] {
    this.snapshots = [];
    const z = new TreeNode(val);
    z.left = this.nil;
    z.right = this.nil;
    
    let y = this.nil;
    let x = this.root;

    this.takeSnapshot(`Starting to insert node ${val}. We always start at the top (the Root) to find the correct spot.`);
    
    while (x !== this.nil) {
      y = x;
      const direction = z.val < x.val ? 'left' : 'right';
      const reason = z.val < x.val ? 'smaller' : 'larger';
      
      this.takeSnapshot(`Comparing ${val} with node ${x.val}. Because ${val} is ${reason}, we move down to the ${direction}.`, [x.id]);
      
      if (z.val < x.val) x = x.left;
      else if (z.val > x.val) x = x.right;
      else {
        this.takeSnapshot(`Node ${val} already exists in the tree! Red-Black trees usually don't allow duplicates, so we are stopping here.`);
        return this.snapshots;
      }
    }

    z.parent = y;
    if (y === this.nil) this.root = z;
    else if (z.val < y.val) y.left = z;
    else y.right = z;

    this.takeSnapshot(`Found an empty spot! Inserted node ${val}. Rule: All brand new nodes always start colored RED.`, [z.id]);
    this.insertFixup(z);
    return this.snapshots;
  }

  private insertFixup(z: TreeNode) {
    while (z.parent.color === 'RED') {
      // We have a violation: A RED node cannot have a RED parent.
      
      if (z.parent === z.parent.parent.left) {
        let y = z.parent.parent.right; // Uncle
        
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are BOTH RED. To figure out how to fix this, we look at the Uncle (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          // CASE 1: Uncle is RED -> We only need to recolor.
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Because the Uncle is RED, we can fix the violation just by repainting: Parent and Uncle become BLACK, and Grandparent becomes RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`But wait! Now the Grandparent (node ${z.val}) is RED, and its parent might also be RED. We have to check the rules again higher up the tree.`, [z.id]);
          }
          
        } else {
          // CASE 2 & 3: Uncle is BLACK -> We must rotate.
          if (z === z.parent.right) {
            z = z.parent;
            this.takeSnapshot(`Because the Uncle is BLACK, repainting isn't enough. Node ${z.right.val} forms a "zig-zag" shape (inner child). We must do a Left Rotation on node ${z.val} to straighten them into a line.`, [z.id]);
            this.leftRotate(z);
            this.takeSnapshot(`Left Rotation complete. They are now in a straight line, but we still have two RED nodes touching.`, [z.parent.id]);
          }
          
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`To fix the straight line, we repaint: Parent (${z.parent.val}) becomes BLACK, Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, we perform a Right Rotation on the Grandparent (${z.parent.parent.val}) to balance the weight of the tree.`, [z.parent.parent.id]);
          this.rightRotate(z.parent.parent);
        }
      } else {
        // Symmetric right side (exact same logic, opposite directions)
        let y = z.parent.parent.left; // Uncle
        
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are BOTH RED. To figure out how to fix this, we look at the Uncle (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Because the Uncle is RED, we can fix the violation just by repainting: Parent and Uncle become BLACK, and Grandparent becomes RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`But wait! Now the Grandparent (node ${z.val}) is RED, and its parent might also be RED. We have to check the rules again higher up the tree.`, [z.id]);
          }

        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.takeSnapshot(`Because the Uncle is BLACK, repainting isn't enough. Node ${z.left.val} forms a "zig-zag" shape (inner child). We must do a Right Rotation on node ${z.val} to straighten them into a line.`, [z.id]);
            this.rightRotate(z);
            this.takeSnapshot(`Right Rotation complete. They are now in a straight line, but we still have two RED nodes touching.`, [z.parent.id]);
          }
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`To fix the straight line, we repaint: Parent (${z.parent.val}) becomes BLACK, Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, we perform a Left Rotation on the Grandparent (${z.parent.parent.val}) to balance the weight of the tree.`, [z.parent.parent.id]);
          this.leftRotate(z.parent.parent);
        }
      }
    }
    
    if (this.root.color === 'RED') {
      this.root.color = 'BLACK';
      this.takeSnapshot(`Final Rule Check: The Root node must ALWAYS be BLACK. We repaint the root node (${this.root.val}) to BLACK. The tree is now balanced!`, [this.root.id]);
    } else {
      this.takeSnapshot(`Final Rule Check: The Root is already BLACK, and no RED nodes are touching. The tree is completely balanced!`);
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
}