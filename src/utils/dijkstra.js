// Min-heap priority queue
class MinHeap {
  constructor() { this.data = []; }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  get size() { return this.data.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i][0] >= this.data[parent][0]) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l][0] < this.data[smallest][0]) smallest = l;
      if (r < n && this.data[r][0] < this.data[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

export function dijkstra(graph, source, target) {
  if (!graph[source] || !graph[target]) return null;

  const dist = { [source]: 0 };
  const prev = {};
  const heap = new MinHeap();
  heap.push([0, source]);

  while (heap.size > 0) {
    const [d, u] = heap.pop();
    if (u === target) {
      // Reconstruct path
      const path = [];
      let node = target;
      while (node !== source) {
        const p = prev[node];
        if (!p) return null;
        path.unshift({ node, routeId: p.rid });
        node = p.from;
      }
      path.unshift({ node: source, routeId: null });
      return { path, distance: dist[target] };
    }
    if (d > (dist[u] ?? Infinity)) continue;

    const neighbors = graph[u] || [];
    for (const edge of neighbors) {
      const alt = d + edge.dist;
      if (alt < (dist[edge.to] ?? Infinity)) {
        dist[edge.to] = alt;
        prev[edge.to] = { from: u, rid: edge.rid };
        heap.push([alt, edge.to]);
      }
    }
  }
  return null; // no path found
}
