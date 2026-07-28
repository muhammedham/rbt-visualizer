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

  // Helper to accurately describe nil leaves in standard RBT theory
  private nodeName(n: TreeNode): string {
    return n.isNil ? "a NIL leaf (which is always considered BLACK)" : `Node ${n.val}`;
  }

  // --- INSERTION LOGIC ---
  insert(val: number): Snapshot[] {
    this.snapshots = [];
    const z = new TreeNode(val);
    z.left = this.nil;
    z.right = this.nil;
    
    let y = this.nil;
    let x = this.root;

    this.takeSnapshot(`Starting the insertion process for value ${val}. In a Binary Search Tree, we always begin at the Root and traverse downwards to find the correct valid position.`);
    
    while (x !== this.nil) {
      y = x;
      const direction = z.val < x.val ? 'Left' : 'Right';
      const reason = z.val < x.val ? 'less than' : 'greater than';
      
      this.takeSnapshot(`Comparing the new value (${val}) with the current node (${x.val}). Since ${val} is ${reason} ${x.val}, we traverse down the ${direction} subtree.`, [x.id]);
      
      if (z.val < x.val) x = x.left;
      else if (z.val > x.val) x = x.right;
      else {
        this.takeSnapshot(`Node ${val} already exists in the tree. Standard Red-Black Trees do not allow duplicate values, so the insertion is aborted.`);
        return this.snapshots;
      }
    }

    z.parent = y;
    if (y === this.nil) this.root = z;
    else if (z.val < y.val) y.left = z;
    else y.right = z;

    this.takeSnapshot(`Found the correct empty position. We insert Node ${val} here. By definition, all newly inserted nodes are colored RED. This prevents us from altering the 'Black Height' (number of black nodes on a path), but it may temporarily violate the rule against consecutive RED nodes.`, [z.id]);
    this.insertFixup(z);
    return this.snapshots;
  }

  private insertFixup(z: TreeNode) {
    while (z.parent.color === 'RED') {
      
      if (z.parent === z.parent.parent.left) {
        let y = z.parent.parent.right; // Uncle
        
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are both RED. A Red-Black Tree strictly forbids a RED node from having a RED child. To resolve this conflict, we must examine the 'Uncle' node (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          // CASE 1: Uncle is RED
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Uncle is RED. Because both the Parent and the Uncle are RED, we can resolve this simply by recoloring. We push the RED color up the tree by changing the Parent and Uncle to BLACK, and the Grandparent to RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`Notice that the Grandparent (Node ${z.val}) is now RED. We must now check if this newly colored RED node is violating the rule with its own parent higher up the tree. We shift our focus to Node ${z.val}.`, [z.id]);
          }
          
        } else {
          // CASE 2 & 3: Uncle is BLACK
          if (z === z.parent.right) {
            z = z.parent;
            this.takeSnapshot(`Case 2: The Uncle is BLACK. Recoloring alone would ruin the Black Height of the tree, so we must restructure. Currently, the nodes form a 'zig-zag' shape (Node ${z.right.val} is an inner child). We perform a Left Rotation on Node ${z.val} to align them into a straight line.`, [z.id]);
            this.leftRotate(z);
            this.takeSnapshot(`Left Rotation complete. The nodes now form a straight line, which prepares us for the final fix. However, the two RED nodes are still touching.`, [z.parent.id]);
          }
          
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 3: To finalize the restructuring, we first swap the colors. The Parent (${z.parent.val}) becomes BLACK, and the Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, we perform a Right Rotation on the Grandparent (${z.parent.parent.val}). This physically lowers the RED Grandparent and raises the BLACK Parent, separating the RED nodes while perfectly maintaining the tree's structural balance.`, [z.parent.parent.id]);
          this.rightRotate(z.parent.parent);
        }
      } else {
        // Symmetric right side
        let y = z.parent.parent.left; // Uncle
        
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are both RED. A Red-Black Tree strictly forbids a RED node from having a RED child. To resolve this conflict, we must examine the 'Uncle' node (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Uncle is RED. Because both the Parent and the Uncle are RED, we can resolve this simply by recoloring. We push the RED color up the tree by changing the Parent and Uncle to BLACK, and the Grandparent to RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`Notice that the Grandparent (Node ${z.val}) is now RED. We must now check if this newly colored RED node is violating the rule with its own parent higher up the tree. We shift our focus to Node ${z.val}.`, [z.id]);
          }

        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.takeSnapshot(`Case 2: The Uncle is BLACK. Recoloring alone would ruin the Black Height of the tree, so we must restructure. Currently, the nodes form a 'zig-zag' shape (Node ${z.left.val} is an inner child). We perform a Right Rotation on Node ${z.val} to align them into a straight line.`, [z.id]);
            this.rightRotate(z);
            this.takeSnapshot(`Right Rotation complete. The nodes now form a straight line, which prepares us for the final fix. However, the two RED nodes are still touching.`, [z.parent.id]);
          }
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 3: To finalize the restructuring, we first swap the colors. The Parent (${z.parent.val}) becomes BLACK, and the Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, we perform a Left Rotation on the Grandparent (${z.parent.parent.val}). This physically lowers the RED Grandparent and raises the BLACK Parent, separating the RED nodes while perfectly maintaining the tree's structural balance.`, [z.parent.parent.id]);
          this.leftRotate(z.parent.parent);
        }
      }
    }
    
    if (this.root.color === 'RED') {
      this.root.color = 'BLACK';
      this.takeSnapshot(`Final Check: A fundamental property of Red-Black Trees is that the Root node must always remain BLACK. We recolor the Root (${this.root.val}) to BLACK. The insertion is now completely resolved.`, [this.root.id]);
    } else {
      this.takeSnapshot(`Final Check: The Root is already BLACK, and no consecutive RED nodes remain. The tree satisfies all Red-Black properties and the insertion is complete.`);
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