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

  private nodeName(n: TreeNode): string {
    return n.isNil ? "a NIL leaf (which is always considered BLACK)" : `Node ${n.val}`;
  }

  private minimum(node: TreeNode): TreeNode {
    while (node.left !== this.nil) {
      node = node.left;
    }
    return node;
  }

  // --- INSERTION LOGIC ---
  // (Your existing insert and insertFixup code remains exactly the same here)
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

    this.takeSnapshot(`Found the correct empty position. We insert Node ${val} here. By definition, all newly inserted nodes are colored RED. This prevents us from altering the 'Black Height', but it may temporarily violate the rule against consecutive RED nodes.`, [z.id]);
    this.insertFixup(z);
    return this.snapshots;
  }

  private insertFixup(z: TreeNode) {
    while (z.parent.color === 'RED') {
      if (z.parent === z.parent.parent.left) {
        let y = z.parent.parent.right;
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are both RED. To resolve this conflict, we must examine the 'Uncle' node (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);
        if (y.color === 'RED') {
          z.parent.color = 'BLACK'; y.color = 'BLACK'; z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Uncle is RED. We push the RED color up the tree by changing the Parent and Uncle to BLACK, and the Grandparent to RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          if (z.color === 'RED' && z.parent.color === 'RED') this.takeSnapshot(`Notice that the Grandparent (Node ${z.val}) is now RED. We shift our focus to Node ${z.val} to ensure it doesn't violate rules with its own parent.`, [z.id]);
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this.takeSnapshot(`Case 2: The Uncle is BLACK. The nodes form a 'zig-zag' shape. We perform a Left Rotation on Node ${z.val} to align them into a straight line.`, [z.id]);
            this.leftRotate(z);
            this.takeSnapshot(`Left Rotation complete. The nodes now form a straight line.`, [z.parent.id]);
          }
          z.parent.color = 'BLACK'; z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 3: To finalize the restructuring, we swap colors. The Parent (${z.parent.val}) becomes BLACK, and the Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          this.takeSnapshot(`Finally, we perform a Right Rotation on the Grandparent (${z.parent.parent.val}) to separate the RED nodes while maintaining structural balance.`, [z.parent.parent.id]);
          this.rightRotate(z.parent.parent);
        }
      } else {
        let y = z.parent.parent.left;
        this.takeSnapshot(`Rule Violation! Node ${z.val} and its Parent (${z.parent.val}) are both RED. To resolve this conflict, we must examine the 'Uncle' node (${this.nodeName(y)}).`, [z.id, z.parent.id, y.id]);
        if (y.color === 'RED') {
          z.parent.color = 'BLACK'; y.color = 'BLACK'; z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Uncle is RED. We push the RED color up the tree by changing the Parent and Uncle to BLACK, and the Grandparent to RED.`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          if (z.color === 'RED' && z.parent.color === 'RED') this.takeSnapshot(`Notice that the Grandparent (Node ${z.val}) is now RED. We shift our focus to Node ${z.val} to ensure it doesn't violate rules with its own parent.`, [z.id]);
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.takeSnapshot(`Case 2: The Uncle is BLACK. The nodes form a 'zig-zag' shape. We perform a Right Rotation on Node ${z.val} to align them into a straight line.`, [z.id]);
            this.rightRotate(z);
            this.takeSnapshot(`Right Rotation complete. The nodes now form a straight line.`, [z.parent.id]);
          }
          z.parent.color = 'BLACK'; z.parent.parent.color = 'RED';
          this.takeSnapshot(`Case 3: To finalize the restructuring, we swap colors. The Parent (${z.parent.val}) becomes BLACK, and the Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          this.takeSnapshot(`Finally, we perform a Left Rotation on the Grandparent (${z.parent.parent.val}) to separate the RED nodes while maintaining structural balance.`, [z.parent.parent.id]);
          this.leftRotate(z.parent.parent);
        }
      }
    }
    if (this.root.color === 'RED') {
      this.root.color = 'BLACK';
      this.takeSnapshot(`Final Check: The Root node must always remain BLACK. We recolor the Root (${this.root.val}) to BLACK.`, [this.root.id]);
    } else {
      this.takeSnapshot(`Final Check: The Root is already BLACK, and no consecutive RED nodes remain. The tree satisfies all Red-Black properties.`);
    }
  }

  // --- DELETION LOGIC ---
  private transplant(u: TreeNode, v: TreeNode) {
    if (u.parent === this.nil) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    v.parent = u.parent;
  }

  delete(val: number): Snapshot[] {
    this.snapshots = [];
    
    // 1. Find the node
    let z = this.root;
    this.takeSnapshot(`Starting deletion process. We must first search the tree to locate Node ${val}.`);
    while (z !== this.nil && z.val !== val) {
      this.takeSnapshot(`Searching for ${val}. Current node is ${z.val}. Traversing ${val < z.val ? 'Left' : 'Right'}.`, [z.id]);
      z = val < z.val ? z.left : z.right;
    }

    if (z === this.nil) {
      this.takeSnapshot(`Value ${val} was not found in the tree. Aborting deletion.`);
      return this.snapshots;
    }

    this.takeSnapshot(`Located Node ${val}. We now determine how to extract it from the Binary Search Tree while preserving the structure.`, [z.id]);

    let y = z;
    let yOriginalColor = y.color;
    let x: TreeNode;

    // 2. Standard BST Deletion
    if (z.left === this.nil) {
      x = z.right;
      this.takeSnapshot(`Node ${z.val} has no left child. We can simply replace it with its right child (${this.nodeName(x)}).`, [z.id]);
      this.transplant(z, z.right);
    } else if (z.right === this.nil) {
      x = z.left;
      this.takeSnapshot(`Node ${z.val} has no right child. We can simply replace it with its left child (${this.nodeName(x)}).`, [z.id]);
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      this.takeSnapshot(`Node ${z.val} has two children. To maintain BST ordering, we must find its Successor (the smallest node in its right subtree), which is Node ${y.val}. We will replace ${z.val} with ${y.val}.`, [z.id, y.id]);
      
      if (y.parent === z) {
        x.parent = y;
      } else {
        this.transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }

    // 3. Fixup if necessary
    if (yOriginalColor === 'BLACK') {
      this.takeSnapshot(`The node we physically removed/moved was BLACK. This means all paths passing through this location just lost one BLACK node, violating the 'Black Height' invariant. To fix this, we conceptually assign an 'extra black' weight to the replacement node (${this.nodeName(x)}) and begin the fixup process.`, [x.id]);
      this.deleteFixup(x);
    } else {
      this.takeSnapshot(`The node we physically removed/moved was RED. Removing a RED node does not affect the Black Height invariant, nor can it create consecutive RED nodes. No restructuring is necessary.`);
    }

    return this.snapshots;
  }

  private deleteFixup(x: TreeNode) {
    while (x !== this.root && x.color === 'BLACK') {
      if (x === x.parent.left) {
        let w = x.parent.right; // Sibling
        
        this.takeSnapshot(`Node ${x.isNil ? '(NIL)' : x.val} currently holds the 'extra black' weight. We examine its Sibling (${w.val}) to determine how to distribute this weight.`, [x.id, w.id]);

        if (w.color === 'RED') {
          // Case 1
          w.color = 'BLACK';
          x.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Sibling is RED. We recolor the Sibling to BLACK and the Parent to RED, then perform a Left Rotation on the Parent. This converts the situation into one of the other cases (where the Sibling is BLACK) without altering the Black Height.`, [w.id, x.parent.id]);
          this.leftRotate(x.parent);
          w = x.parent.right;
        }

        if (w.left.color === 'BLACK' && w.right.color === 'BLACK') {
          // Case 2
          w.color = 'RED';
          x = x.parent;
          this.takeSnapshot(`Case 2: The Sibling is BLACK, and both of its children are BLACK. We can resolve this locally by removing one black weight from both the Sibling (making it RED) and Node ${x.isNil ? '(NIL)' : x.val}. This shifts the 'extra black' weight up to their Parent. We now repeat the process on the Parent.`, [w.id, x.id]);
        } else {
          if (w.right.color === 'BLACK') {
            // Case 3
            w.left.color = 'BLACK';
            w.color = 'RED';
            this.takeSnapshot(`Case 3: The Sibling is BLACK, its right child is BLACK, but its left (inner) child is RED. We swap the colors of the Sibling and its left child, then perform a Right Rotation on the Sibling. This transforms the tree into Case 4.`, [w.id, w.left.id]);
            this.rightRotate(w);
            w = x.parent.right;
          }
          
          // Case 4
          w.color = x.parent.color;
          x.parent.color = 'BLACK';
          w.right.color = 'BLACK';
          this.takeSnapshot(`Case 4: The Sibling is BLACK, and its right (outer) child is RED. We perform a terminal fix: We recolor the Sibling to the Parent's color, color the Parent BLACK, color the Sibling's right child BLACK, and perform a Left Rotation on the Parent. This perfectly redistributes the 'extra black' weight across the branches.`, [w.id, x.parent.id, w.right.id]);
          this.leftRotate(x.parent);
          x = this.root; // Terminate loop
        }
      } else {
        // Symmetric right side
        let w = x.parent.left;
        this.takeSnapshot(`Node ${x.isNil ? '(NIL)' : x.val} currently holds the 'extra black' weight. We examine its Sibling (${w.val}) to determine how to distribute this weight.`, [x.id, w.id]);

        if (w.color === 'RED') {
          w.color = 'BLACK';
          x.parent.color = 'RED';
          this.takeSnapshot(`Case 1: The Sibling is RED. We recolor the Sibling to BLACK and the Parent to RED, then perform a Right Rotation on the Parent. This converts the situation into one of the other cases.`, [w.id, x.parent.id]);
          this.rightRotate(x.parent);
          w = x.parent.left;
        }

        if (w.right.color === 'BLACK' && w.left.color === 'BLACK') {
          w.color = 'RED';
          x = x.parent;
          this.takeSnapshot(`Case 2: The Sibling is BLACK, and both of its children are BLACK. We remove one black weight from both the Sibling (making it RED) and Node ${x.isNil ? '(NIL)' : x.val}, shifting the 'extra black' weight up to their Parent.`, [w.id, x.id]);
        } else {
          if (w.left.color === 'BLACK') {
            w.right.color = 'BLACK';
            w.color = 'RED';
            this.takeSnapshot(`Case 3: The Sibling is BLACK, its left child is BLACK, but its right (inner) child is RED. We swap colors and perform a Left Rotation on the Sibling to transform into Case 4.`, [w.id, w.right.id]);
            this.leftRotate(w);
            w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = 'BLACK';
          w.left.color = 'BLACK';
          this.takeSnapshot(`Case 4: The Sibling is BLACK, and its left (outer) child is RED. We recolor and perform a Right Rotation on the Parent. This perfectly redistributes the 'extra black' weight across the branches.`, [w.id, x.parent.id, w.left.id]);
          this.rightRotate(x.parent);
          x = this.root;
        }
      }
    }
    if (x.color === 'RED') {
      this.takeSnapshot(`The node absorbing the 'extra black' weight was RED. We simply recolor it to BLACK, safely absorbing the weight and restoring the Black Height invariant everywhere.`);
    }
    x.color = 'BLACK';
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