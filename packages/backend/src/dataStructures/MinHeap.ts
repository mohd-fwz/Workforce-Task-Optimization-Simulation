/**
 * Min Heap implementation for Priority Queue
 * Used to maintain tasks sorted by priority (highest priority = lowest value)
 */

export interface HeapNode<T> {
  priority: number;
  data: T;
}

export class MinHeap<T> {
  private heap: HeapNode<T>[] = [];

  constructor() {}

  /**
   * Get the parent index
   */
  private parent(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  /**
   * Get the left child index
   */
  private leftChild(index: number): number {
    return 2 * index + 1;
  }

  /**
   * Get the right child index
   */
  private rightChild(index: number): number {
    return 2 * index + 2;
  }

  /**
   * Swap two nodes
   */
  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  /**
   * Bubble up a node to maintain heap property
   */
  private bubbleUp(index: number): void {
    while (index > 0 && this.heap[index].priority < this.heap[this.parent(index)].priority) {
      this.swap(index, this.parent(index));
      index = this.parent(index);
    }
  }

  /**
   * Bubble down a node to maintain heap property
   */
  private bubbleDown(index: number): void {
    let minIndex = index;
    const left = this.leftChild(index);
    const right = this.rightChild(index);

    if (left < this.heap.length && this.heap[left].priority < this.heap[minIndex].priority) {
      minIndex = left;
    }

    if (right < this.heap.length && this.heap[right].priority < this.heap[minIndex].priority) {
      minIndex = right;
    }

    if (index !== minIndex) {
      this.swap(index, minIndex);
      this.bubbleDown(minIndex);
    }
  }

  /**
   * Insert a new element
   */
  insert(priority: number, data: T): void {
    this.heap.push({ priority, data });
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Extract the minimum element (highest priority)
   */
  extractMin(): HeapNode<T> | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  /**
   * Peek at the minimum element without removing it
   */
  peek(): HeapNode<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Get heap size
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Check if heap is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Get all elements (for visualization)
   */
  toArray(): HeapNode<T>[] {
    return [...this.heap];
  }

  /**
   * Update priority of an element and reheapify
   */
  updatePriority(predicate: (data: T) => boolean, newPriority: number): boolean {
    const index = this.heap.findIndex(node => predicate(node.data));
    if (index === -1) return false;

    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;

    if (newPriority < oldPriority) {
      this.bubbleUp(index);
    } else {
      this.bubbleDown(index);
    }

    return true;
  }

  /**
   * Remove a specific element
   */
  remove(predicate: (data: T) => boolean): boolean {
    const index = this.heap.findIndex(node => predicate(node.data));
    if (index === -1) return false;

    // Replace with last element
    if (index === this.heap.length - 1) {
      this.heap.pop();
      return true;
    }

    this.heap[index] = this.heap.pop()!;

    // Reheapify
    const parentIdx = this.parent(index);
    if (index > 0 && this.heap[index].priority < this.heap[parentIdx].priority) {
      this.bubbleUp(index);
    } else {
      this.bubbleDown(index);
    }

    return true;
  }

  /**
   * Clear the heap
   */
  clear(): void {
    this.heap = [];
  }
}
