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

  // Helper to make the empty nodes sound less scary
  private nodeName(n: TreeNode): string {
    return n.isNil ? "an Empty space (which always acts like BLACK paint)" : `node ${n.val}`;
  }

  // --- INSERTION LOGIC ---
  insert(val: number): Snapshot[] {
    this.snapshots = [];
    const z = new TreeNode(val);
    z.left = this.nil;
    z.right = this.nil;
    
    let y = this.nil;
    let x = this.root;

    this.takeSnapshot(`Starting to add node ${val}. We start at the very top of our toy (the Root) to see where it fits.`);
    
    while (x !== this.nil) {
      y = x;
      const direction = z.val < x.val ? 'left' : 'right';
      const reason = z.val < x.val ? 'smaller' : 'bigger';
      
      this.takeSnapshot(`We compare ${val} with node ${x.val}. Because ${val} is ${reason}, we move down the ${direction} branch.`, [x.id]);
      
      if (z.val < x.val) x = x.left;
      else if (z.val > x.val) x = x.right;
      else {
        this.takeSnapshot(`Node ${val} is already on the toy! We don't allow double numbers, so we stop here.`);
        return this.snapshots;
      }
    }

    z.parent = y;
    if (y === this.nil) this.root = z;
    else if (z.val < y.val) y.left = z;
    else y.right = z;

    this.takeSnapshot(`We found an empty spot! We hang node ${val} here. Magic Rule: Every new node always starts with RED paint.`, [z.id]);
    this.insertFixup(z);
    return this.snapshots;
  }

  private insertFixup(z: TreeNode) {
    while (z.parent.color === 'RED') {
      
      if (z.parent === z.parent.parent.left) {
        let y = z.parent.parent.right; // Uncle
        
        this.takeSnapshot(`🚨 ALARM! Node ${z.val} is RED, and the node holding it (its Parent, ${z.parent.val}) is ALSO RED. Two RED nodes cannot touch! We look at the Uncle (${this.nodeName(y)}) to see how to fix this.`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          // CASE 1: Uncle is RED
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`The Uncle is RED! Easy fix: we just use our magic paint. We paint the Parent and Uncle BLACK, and the Grandparent RED. The alarm stops here!`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`But wait... we just painted the Grandparent (node ${z.val}) RED. We have to check if it's accidentally touching another RED node higher up!`, [z.id]);
          }
          
        } else {
          // CASE 2 & 3: Uncle is BLACK
          if (z === z.parent.right) {
            z = z.parent;
            this.takeSnapshot(`The Uncle is BLACK! Paint isn't enough. Node ${z.right.val} makes a crooked 'zig-zag' shape. We must Rotate (twist the branch) on node ${z.val} to straighten it.`, [z.id]);
            this.leftRotate(z);
            this.takeSnapshot(`Rotation finished. They are in a straight line now, but the two RED nodes are still touching!`, [z.parent.id]);
          }
          
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`To fix this, we use our paint: Parent (${z.parent.val}) becomes BLACK, Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, one side of the toy is too heavy! We Rotate (spin the branch) on the Grandparent (${z.parent.parent.val}) to balance the weight. The RED nodes are separated!`, [z.parent.parent.id]);
          this.rightRotate(z.parent.parent);
        }
      } else {
        // Symmetric right side
        let y = z.parent.parent.left; // Uncle
        
        this.takeSnapshot(`🚨 ALARM! Node ${z.val} is RED, and the node holding it (its Parent, ${z.parent.val}) is ALSO RED. Two RED nodes cannot touch! We look at the Uncle (${this.nodeName(y)}) to see how to fix this.`, [z.id, z.parent.id, y.id]);

        if (y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`The Uncle is RED! Easy fix: we just use our magic paint. We paint the Parent and Uncle BLACK, and the Grandparent RED. The alarm stops here!`, [z.parent.id, y.id, z.parent.parent.id]);
          z = z.parent.parent;
          
          if (z.color === 'RED' && z.parent.color === 'RED') {
             this.takeSnapshot(`But wait... we just painted the Grandparent (node ${z.val}) RED. We have to check if it's accidentally touching another RED node higher up!`, [z.id]);
          }

        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.takeSnapshot(`The Uncle is BLACK! Paint isn't enough. Node ${z.left.val} makes a crooked 'zig-zag' shape. We must Rotate (twist the branch) on node ${z.val} to straighten it.`, [z.id]);
            this.rightRotate(z);
            this.takeSnapshot(`Rotation finished. They are in a straight line now, but the two RED nodes are still touching!`, [z.parent.id]);
          }
          z.parent.color = 'BLACK';
          z.parent.parent.color = 'RED';
          this.takeSnapshot(`To fix this, we use our paint: Parent (${z.parent.val}) becomes BLACK, Grandparent (${z.parent.parent.val}) becomes RED.`, [z.parent.id, z.parent.parent.id]);
          
          this.takeSnapshot(`Finally, one side of the toy is too heavy! We Rotate (spin the branch) on the Grandparent (${z.parent.parent.val}) to balance the weight. The RED nodes are separated!`, [z.parent.parent.id]);
          this.leftRotate(z.parent.parent);
        }
      }
    }
    
    if (this.root.color === 'RED') {
      this.root.color = 'BLACK';
      this.takeSnapshot(`Final Toy Rule: The very top node (the Root) must ALWAYS be BLACK. We paint the root node (${this.root.val}) BLACK. The toy is perfectly balanced!`, [this.root.id]);
    } else {
      this.takeSnapshot(`Final Toy Rule: The Root is already BLACK, and no RED nodes are touching. The toy is perfectly balanced!`);
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