# Workforce & Task Optimization Dashboard

A real-time, educational simulation dashboard for NGO emergency response and workforce optimization. Watch as tasks get assigned to staff members using sophisticated algorithms, priority queues, and pathfinding - all visualized in beautiful, interactive displays.

## Features

### Core Capabilities
- **Dynamic Task Management** - Create tasks with urgency levels, skill requirements, and locations
- **Staff Allocation** - Intelligent assignment based on skills, proximity, and availability
- **Real-time Simulation** - Tick-based engine with pause/resume/step controls
- **Live Visualizations** - See data structures update in real-time:
  - **Priority Queue (Min Heap)** - Binary tree visualization
  - **FIFO Queue** - Animated conveyor belt display
  - **Location Graph** - Interactive force-directed network
  - **Algorithm Trace** - Step-by-step priority scoring, staff evaluation, and Dijkstra exploration
  - **Geographic Map** - Leaflet map with staff and task markers
- **Parameter Tuning** - Adjust weights and see instant effects:
  - Urgency vs Distance weighting
  - Skill strictness
  - Max workload per staff
  - Disaster severity multiplier
- **Decision Transparency** - Inspect why tasks are prioritized, why staff are selected or rejected, and how shortest paths are reconstructed

### Technical Highlights
- ✅ **Min Heap** implementation for priority queue
- ✅ **FIFO Queue** for task intake
- ✅ **Graph** with Dijkstra's shortest path algorithm
- ✅ **HashMap** for O(1) staff/task lookups
- ✅ **WebSocket** real-time updates via Socket.IO
- ✅ **D3.js** powered data structure visualizations
- ✅ **Framer Motion** smooth animations
- ✅ **React + TypeScript** type-safe UI
- ✅ **Tailwind CSS** modern dark mode design

## Architecture

```
workforce-optimizer/
├── packages/
│   ├── shared/          # TypeScript types shared between frontend/backend
│   ├── backend/         # Node.js + Express + Socket.IO simulation engine
│   │   ├── dataStructures/  # Min Heap, Queue, Graph implementations
│   │   └── engine/          # Simulation & allocation logic
│   └── frontend/        # React + Vite + D3.js UI
│       ├── components/      # UI panels and controls
│       ├── visualizations/  # D3.js data structure viz
│       ├── store/          # Zustand state management
│       └── services/       # Socket.IO client
└── package.json         # Workspace root
```

## Installation

### Prerequisites
- **Node.js** 18+ and npm
- Modern browser (Chrome, Firefox, Edge, Safari)

### Quick Start

1. **Clone or navigate to the project**
   ```bash
   cd dslab
   ```

2. **Install all dependencies**
   ```bash
   npm install
   npm run install:all
   ```

3. **Start both backend and frontend**
   ```bash
   npm run dev
   ```

   This runs both servers concurrently:
   - **Backend**: http://localhost:3001
   - **Frontend**: http://localhost:3000

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Manual Start (Alternative)

If you prefer to run servers separately:

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

## Usage Guide

### 1. Creating Tasks

Click the **+** button in the **Tasks** panel:
- **Type**: Medical, Distribution, Survey, Rescue, Infrastructure
- **Skills**: Comma-separated (e.g., `medical, logistics`)
- **Location**: Latitude/Longitude coordinates
- **Urgency**: 1-10 scale (10 = critical)
- **Duration**: Estimated time in minutes

Tasks flow: **Pending → Queue → Priority Queue → Assigned → Completed**

### 2. Creating Staff

Click the **+** button in the **Staff** panel:
- **Name**: Staff member identifier
- **Skills**: Comma-separated skill tags
- **Location**: Current position (lat/lng)
- **Capacity**: Max concurrent tasks (1-10)

Staff status indicators:
- 🟢 **Idle** - Available for assignment
- 🔵 **Busy** - Working on tasks
- 🟡 **Rest** - On break
- ⚫ **Unavailable** - Offline

### 3. Control Panel

**Playback Controls:**
- ▶️ **Resume** - Start/continue simulation
- ⏸️ **Pause** - Freeze at current state
- ⏭️ **Step** - Advance one tick
- 🔄 **Reset** - Clear all data and restart

**Parameters** (live tuning):
- **Urgency Weight** (0-1) - How much urgency affects priority
- **Distance Weight** (0-1) - Impact of travel distance
- **Skill Strictness** (0-1) - Required skill match (1 = all skills must match)
- **Max Workload** (1-10) - Tasks per staff member
- **Disaster Severity** (0.5-3x) - Global priority multiplier

### 4. Data Structure Inspector

Toggle between views to see how algorithms work:

- **Heap Tab**: Binary tree showing priority queue structure
  - Top node = highest computed priority task
  - The displayed priority score is converted to a negative heap key so the min heap extracts urgent work first
  - Purple = root node
  - Numbers = computed priority scores

- **Queue Tab**: FIFO conveyor belt
  - Left = out (to priority queue)
  - Right = in (new tasks)
  - Animated transitions

- **Graph Tab**: Interactive force-directed network
  - Green = bases
  - Blue = staff
  - Red = task sites
  - Amber = latest reconstructed shortest path
  - Drag nodes to rearrange

- **Algorithm Tab**: Educational decision trace
  - Priority formula factors for queued tasks
  - Candidate staff scores and rejection reasons
  - Skill match, distance score, combined score
  - Dijkstra steps: current node, neighbor updates, frontier, visited nodes, and final path
  - Expanded modal with step playback and a larger readable trace

- **Raw Data Tab**: JSON view of all structures

### 5. Map View

Geographic visualization showing:
- **Markers**: Color-coded locations
- **Solid gray lines**: Graph connections available to the pathfinding algorithm
- **Solid amber line**: Latest shortest route reconstructed by Dijkstra's algorithm
- **Animated violet dashed line**: Edge currently being explored in the selected Dijkstra step
- **Dotted purple lines**: Current staff-to-task assignments
- **Algorithm node states**: Violet = current node, green = visited, blue = frontier, amber = distance updated

Click markers for details. Map auto-fits to show all locations. When the Algorithm tab or expanded analysis modal changes the selected Dijkstra step, the map updates in sync so the textual reasoning and geographic exploration can be studied together.

### 6. Metrics Panel

Real-time KPIs:
- ✅ Tasks Completed
- 📈 Tasks Assigned
- ⏳ Tasks Pending
- 👥 Staff Utilization %
- ⏱️ Average Response Time

## How the Allocation Engine Works

### Priority Calculation
```typescript
priority = (urgency / 10) × urgencyWeight × timeFactor × unmetNeed × disasterSeverity
heapKey = -priority
```

**Factors:**
- **urgency**: User-defined 1-10 scale
- **timeFactor**: Increases as deadline approaches (1.0 → 2.0)
- **unmetNeed**: Grows linearly with wait time (1.0 → 2.0 over 24hrs)
- **heapKey**: The negative priority score used internally so the min heap extracts the highest computed priority first

### Staff Matching Algorithm

For each high-priority task:
1. Filter available staff (under capacity, idle)
2. Calculate **skill match** score (0-1)
3. Reject if below skill strictness threshold
4. Find **shortest path** using Dijkstra's algorithm and record each exploration step
5. Compute combined score:
   ```
   score = (skillMatch × 100) + (distanceScore × 100)
   where distanceScore = 1 / (1 + distance × distanceWeight)
   ```
6. Assign to best-scoring staff

The Algorithm tab shows each evaluated candidate, the rejection reason when a candidate fails, the priority queue state, and the Dijkstra frontier/visited sets that led to the final route.

## Customization

### Add New Task Types

Edit [`packages/shared/src/types.ts`](packages/shared/src/types.ts):
```typescript
export type TaskType = 'Survey' | 'Distribution' | 'Medical' | 'YourNewType';
```

### Modify Priority Formula

Edit [`packages/backend/src/engine/AllocationEngine.ts:15`](packages/backend/src/engine/AllocationEngine.ts#L15):
```typescript
static calculatePriority(task: Task, config: SimulationConfig, currentTime: number): number {
  // Your custom formula here
}
```

### Change Map Tiles

Edit [`packages/frontend/src/components/MapView.tsx:73`](packages/frontend/src/components/MapView.tsx#L73):
```tsx
<TileLayer url="https://{s}.tile.YOUR_PROVIDER.com/{z}/{x}/{y}.png" />
```

### Adjust Simulation Speed

Update tick interval in real-time via Control Panel, or set default in:
[`packages/backend/src/engine/SimulationEngine.ts:26`](packages/backend/src/engine/SimulationEngine.ts#L26)

## Tech Stack

### Backend
- **Node.js** + **Express** - HTTP server
- **Socket.IO** - WebSocket real-time communication
- **TypeScript** - Type safety
- **Custom Data Structures**:
  - Min Heap (priority queue)
  - FIFO Queue
  - Graph (adjacency list + Dijkstra)

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Zustand** - State management
- **Socket.IO Client** - Real-time sync
- **D3.js** - Data visualizations
- **React-Leaflet** - Map component
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Development

### Project Structure

```
packages/
├── shared/              # Shared TypeScript types
│   └── src/types.ts     # Core interfaces
│
├── backend/
│   ├── src/
│   │   ├── dataStructures/
│   │   │   ├── MinHeap.ts      # Priority queue implementation
│   │   │   ├── Queue.ts        # FIFO queue
│   │   │   └── Graph.ts        # Graph + Dijkstra
│   │   ├── engine/
│   │   │   ├── AllocationEngine.ts   # Matching logic
│   │   │   └── SimulationEngine.ts   # Tick loop
│   │   └── index.ts    # Express + Socket.IO server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── ControlPanel.tsx
    │   │   ├── TaskPanel.tsx
    │   │   ├── StaffPanel.tsx
    │   │   ├── MapView.tsx
    │   │   ├── MetricsPanel.tsx
    │   │   ├── DataStructureInspector.tsx
    │   │   └── visualizations/
    │   │       ├── HeapVisualization.tsx
    │   │       ├── QueueVisualization.tsx
    │   │       └── GraphVisualization.tsx
    │   ├── store/
    │   │   └── useSimulationStore.ts
    │   ├── services/
    │   │   └── socket.ts
    │   ├── hooks/
    │   │   └── useSocket.ts
    │   └── App.tsx
    └── package.json
```

### Build for Production

```bash
# Build all packages
npm run build

# Start production backend
cd packages/backend
npm start
```

Frontend build outputs to `packages/frontend/dist` - serve with any static host.

## Educational Use Cases

Perfect for teaching:
- **Data Structures**: Heap, Queue, Graph in action
- **Algorithms**: Dijkstra, priority queues, greedy allocation
- **System Design**: Event-driven architecture, real-time systems
- **Operations Research**: Resource allocation, optimization
- **Emergency Management**: Disaster response workflows

## Future Enhancements

Possible additions:
- 📸 **Scenario Presets** - Pre-loaded earthquake/flood/warzone scenarios
- 🤖 **AI Mode** - ML-based allocation vs manual
- 🎥 **Export Timeline** - GIF/video replay
- 👥 **Multi-user Mode** - Collaborative planning
- 📊 **Analytics Dashboard** - Historical performance metrics
- 🔄 **Time Travel** - Scrub through simulation history
- 🌐 **WebAssembly** - Performance optimization for large-scale sims
- 🐍 **Python Optimizer** - Advanced optimization microservice

## Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process or change port in packages/backend/src/index.ts
```

### Frontend won't connect
- Ensure backend is running first
- Check browser console for WebSocket errors
- Verify CORS settings if deploying remotely

### Map tiles not loading
- Check internet connection
- Try alternative tile provider
- Check browser console for network errors

### Visualizations not updating
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check Socket.IO connection status in header
- Inspect Network tab for WebSocket connection

## License

MIT License - Free for educational and commercial use

## Credits

Built with ❤️ as an educational tool for learning data structures, algorithms, and real-time systems.

**Technologies**: React, D3.js, Node.js, Socket.IO, TypeScript, Tailwind, Leaflet

---

**Happy Optimizing!** 🚀
