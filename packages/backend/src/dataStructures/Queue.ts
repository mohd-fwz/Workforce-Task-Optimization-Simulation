/**
 * FIFO Queue implementation for task queueing
 */

export class Queue<T> {
  private items: T[] = [];

  constructor() {}

  /**
   * Add element to the end of queue
   */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Remove and return element from front of queue
   */
  dequeue(): T | null {
    return this.items.shift() || null;
  }

  /**
   * Peek at front element without removing
   */
  peek(): T | null {
    return this.items[0] || null;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Get all elements (for visualization)
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Remove specific element
   */
  remove(predicate: (item: T) => boolean): boolean {
    const index = this.items.findIndex(predicate);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.items = [];
  }
}
