export class ApprovalQueue<T extends { id: string }> {
  private readonly queue: T[] = [];

  enqueue(item: T): void {
    this.queue.push(item);
  }

  peek(): T | undefined {
    return this.queue[0];
  }

  dequeue(): T | undefined {
    return this.queue.shift();
  }

  removeById(id: string): T | undefined {
    const i = this.queue.findIndex((x) => x.id === id);
    if (i === -1) return undefined;
    return this.queue.splice(i, 1)[0];
  }

  count(): number {
    return this.queue.length;
  }

  listIds(): string[] {
    return this.queue.map((x) => x.id);
  }
}
