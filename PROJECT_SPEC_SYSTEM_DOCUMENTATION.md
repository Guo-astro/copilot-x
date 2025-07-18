# Project Specification System Documentation

## Overview

The Project Specification System is a comprehensive solution that enables AI agents (GitHub Copilot) to understand and work with project context, including requirements, design documents, and task management. This system ensures that the AI agent can execute tasks with the **correct context** by having access to the project's requirements and design documentation.

## 🎯 Why This System Exists

### Problem Statement
- AI agents often lack project context when helping with development tasks
- Without requirements and design documentation, AI assistance can be generic or miss project-specific needs
- Task execution happens in isolation without understanding the broader project goals
- No centralized way to manage project specifications and track progress

### Solution
The Project Specification System provides:
1. **Contextual AI Assistance**: Agent has access to requirements, design docs, and current task status
2. **Structured Project Management**: Centralized storage for project specifications
3. **Task-Context Mapping**: Each task is linked to specific requirements and design elements
4. **Real-time Synchronization**: UI, chat commands, and agent tools all work with the same data

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Chat UI       │  │  Webview Panel  │  │ Agent Tools  │ │
│  │ (Slash Commands)│  │ (Tabs Interface)│  │(ProjectSpec) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            ProjectSpecService (Core Logic)              │ │
│  │  - CRUD operations for specs and tasks                 │ │
│  │  - Active project management                           │ │
│  │  - Event emission for real-time updates               │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Data Storage                          │ │
│  │  - In-memory storage for active session               │ │
│  │  - Markdown export/import for persistence             │ │
│  │  - Future: File system integration                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Deep Dive

### 1. ProjectSpecService (Core Service Layer)

**Location**: `src/extension/projectSpec/common/projectSpecService.ts`

```typescript
interface IProjectSpecService {
    // Project Management
    getProjectSpecs(): Promise<ProjectSpec[]>;
    createProjectSpec(name: string, requirements?: string, design?: string): Promise<ProjectSpec>;
    getActiveProjectSpec(): Promise<ProjectSpec | undefined>;
    setActiveProjectSpec(id: string): Promise<void>;

    // Task Management
    addTask(specId: string, task: Omit<TaskItem, 'id' | 'created' | 'modified'>): Promise<TaskItem>;
    updateTask(specId: string, task: TaskItem): Promise<void>;
    deleteTask(specId: string, taskId: string): Promise<void>;
}
```

**Key Features**:
- **Centralized State Management**: Single source of truth for all project data
- **Event-Driven Updates**: Emits events when data changes for real-time UI updates
- **Active Project Context**: Maintains which project specification is currently active
- **Task-Project Linking**: Every task belongs to a specific project with requirements and design

**Implementation Details**:
```typescript
export class ProjectSpecService implements IProjectSpecService {
    private _specs = new Map<string, ProjectSpec>();
    private _activeSpecId: string | undefined;
    private readonly _onDidChangeSpecs = new Emitter<void>();

    // Active project context ensures agent always works with correct project
    async getActiveProjectSpec(): Promise<ProjectSpec | undefined> {
        if (!this._activeSpecId) return undefined;
        return this._specs.get(this._activeSpecId);
    }
}
```

### 2. ProjectSpecTool (Agent Integration)

**Location**: `src/extension/tools/node/projectSpecTool.ts`

This is the **key component** that provides agent access to project context.

```typescript
export class ProjectSpecTool implements ICopilotTool<IProjectSpecParams> {
    public static readonly toolName = ToolName.ProjectSpec;

    async invoke(options: vscode.LanguageModelToolInvocationOptions<IProjectSpecParams>) {
        const action = options.input.action || 'status';

        switch (action) {
            case 'requirements': return this.getRequirements();
            case 'design': return this.getDesign();
            case 'tasks': return this.getTasks();
            case 'status': return this.getStatus();
        }
    }
}
```

**Agent Integration Flow**:
1. **Agent Query**: When agent needs project context, it calls the ProjectSpec tool
2. **Context Retrieval**: Tool fetches active project's requirements, design, and tasks
3. **Contextualized Response**: Agent uses this information to provide targeted assistance

**Example Agent Interaction**:
```
User: "Help me implement the user authentication feature"

Agent Internal Process:
1. Calls ProjectSpecTool with action: 'requirements'
2. Receives: "Authentication must support OAuth2, SAML, and local accounts..."
3. Calls ProjectSpecTool with action: 'design'
4. Receives: "Use JWT tokens, Redis for session storage..."
5. Calls ProjectSpecTool with action: 'tasks'
6. Receives: Current task status and dependencies

Agent Response:
"Based on your project requirements for OAuth2/SAML support and the design
decision to use JWT tokens with Redis, here's how to implement..."
```

### 3. ProjectSpecWebviewProvider (UI Component)

**Location**: `src/extension/projectSpec/vscode-node/projectSpecWebviewProvider.ts`

**Features**:
- **Tabbed Interface**: Requirements | Design | Task List
- **Real-time Updates**: Synchronizes with service layer via events
- **Interactive Task Management**: Create, update, delete tasks directly in UI
- **Context Switching**: Switch between different project specifications

**UI Structure**:
```html
<div class="tab-container">
    <div class="tab-header">
        <button class="tab-button active" data-tab="requirements">Requirements</button>
        <button class="tab-button" data-tab="design">Design</button>
        <button class="tab-button" data-tab="tasks">Task List</button>
    </div>

    <div class="tab-content">
        <div id="requirements-tab" class="tab-pane active">
            <!-- Requirements editing interface -->
        </div>
        <div id="design-tab" class="tab-pane">
            <!-- Design documentation interface -->
        </div>
        <div id="tasks-tab" class="tab-pane">
            <!-- Task management interface -->
        </div>
    </div>
</div>
```

### 4. ProjectSpecChatContribution (Chat Integration)

**Location**: `src/extension/projectSpec/common/projectSpecChatContribution.ts`

**Slash Commands**:
- `/spec create <name>`: Create new project specification
- `/spec list`: List all project specifications
- `/spec activate <name>`: Set active project specification
- `/add-task <title>`: Add task to active project
- `/project-status`: Show current project status

**Integration with Agent**:
```typescript
// When user creates a task via chat
this._register(vscode.commands.registerCommand('github.copilot.chat.projectSpec.addTask',
    async (title: string, stream: vscode.ChatResponseStream) => {
        const activeSpec = await this.projectSpecService.getActiveProjectSpec();
        const task = await this.projectSpecService.addTask(activeSpec.id, {
            title,
            status: 'todo',
            priority: 'medium'
        });

        // Task is now available to agent via ProjectSpecTool
        stream.markdown(`✅ Added task: ${task.title}`);
    }
));
```

## 🤖 Agent Context Flow

### How Agent Gets "Correct Context"

1. **Project Activation**: User activates a project specification
   ```bash
   /spec activate "E-commerce Platform"
   ```

2. **Context Storage**: Active project stored in service layer
   ```typescript
   await projectSpecService.setActiveProjectSpec(projectId);
   ```

3. **Agent Tool Access**: When agent needs context, it queries the tool
   ```typescript
   // Agent calls this internally
   const context = await projectSpecTool.invoke({
       input: { action: 'requirements' }
   });
   ```

4. **Contextualized Assistance**: Agent uses project-specific information
   ```
   User: "Help with payment processing"

   Agent (with context):
   - Knows this is an e-commerce platform (from project spec)
   - Sees requirements mention "PCI compliance required"
   - References design decision to "use Stripe API"
   - Checks if payment-related tasks are already defined

   Result: Targeted advice specific to the project's requirements
   ```

### Context Synchronization

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User UI   │    │  Chat Commands  │    │  Agent Tools    │
│             │    │                 │    │                 │
│ Creates     │────┤ Updates project │────┤ Reads context   │
│ task in     │    │ specification   │    │ for assistance  │
│ webview     │    │                 │    │                 │
└─────────────┘    └─────────────────┘    └─────────────────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌─────────────────┐
                    │ ProjectSpecService│
                    │ (Single Source   │
                    │  of Truth)       │
                    └─────────────────┘
```

## 📝 Data Models

### ProjectSpec Structure
```typescript
interface ProjectSpec {
    id: string;
    name: string;
    description?: string;
    requirements: string;     // ← Agent reads this for context
    design: string;          // ← Agent reads this for context
    tasks: TaskItem[];       // ← Agent reads this for progress
    created: Date;
    modified: Date;
}
```

### TaskItem Structure
```typescript
interface TaskItem {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;      // todo | in-progress | done | blocked
    priority?: TaskPriority; // low | medium | high | critical
    assignee?: string;
    created: Date;
    modified: Date;
    taskDefinition?: vscode.TaskDefinition; // VS Code task integration
}
```

## 🔗 Integration Points

### 1. VS Code Extension Registration

**Location**: `src/extension/projectSpec/node/projectSpecContribution.ts`

```typescript
export class ProjectSpecContribution extends Disposable {
    constructor(@IInstantiationService instantiationService: IInstantiationService) {
        // Register webview provider
        const provider = instantiationService.createInstance(ProjectSpecWebviewProvider);
        vscode.window.registerWebviewViewProvider('projectSpecView', provider);
    }
}
```

### 2. Tool Registration

**Location**: `src/extension/tools/node/projectSpecTool.ts`

```typescript
// Registers tool for agent access
ToolRegistry.registerTool(ProjectSpecTool);
```

**Tool Name Configuration**: `src/extension/tools/common/toolNames.ts`
```typescript
export const enum ToolName {
    ProjectSpec = 'project_spec',
    // ... other tools
}

export const enum ContributedToolName {
    ProjectSpec = 'copilot_projectSpec',
    // ... other tools
}
```

### 3. Service Registration

The service must be registered in the VS Code dependency injection system:

```typescript
// In main extension contribution
registerSingleton(IProjectSpecService, ProjectSpecService, InstantiationType.Delayed);
```

## 🚀 MCP (Model Context Protocol) Integration

### Current State: No Separate MCP Tool

The current implementation **does not create a separate MCP tool**. Instead, it integrates directly with VS Code's built-in language model tool system:

```typescript
export class ProjectSpecTool implements ICopilotTool<IProjectSpecParams>
```

This means:
- ✅ Works with GitHub Copilot's existing tool calling system
- ✅ Integrated with VS Code's language model framework
- ✅ No additional MCP server setup required
- ✅ Uses VS Code's proposed `LanguageModelTool` API

### If MCP Integration is Needed

If you want to create an MCP server for external language models:

```typescript
// Hypothetical MCP server integration
export class ProjectSpecMCPServer {
    async handleToolCall(name: string, arguments: any) {
        if (name === 'project_spec') {
            const tool = new ProjectSpecTool(projectSpecService);
            return await tool.invoke({ input: arguments });
        }
    }
}
```

But this is **not currently implemented** because the VS Code integration provides everything needed.

## 🔄 Event Flow Example

### Complete Task Creation and Agent Access Flow

1. **User Creates Task**:
   ```typescript
   // Via chat command
   /add-task "Implement user login API"
   ```

2. **Service Updates**:
   ```typescript
   const task = await projectSpecService.addTask(activeSpecId, {
       title: "Implement user login API",
       status: 'todo',
       priority: 'high'
   });
   ```

3. **UI Updates** (via events):
   ```typescript
   // Webview automatically refreshes task list
   this._onDidChangeSpecs.fire();
   ```

4. **Agent Access**:
   ```typescript
   // When user asks for help
   User: "How should I implement the login API?"

   // Agent internally calls:
   const projectContext = await projectSpecTool.invoke({
       input: { action: 'status' }
   });

   // Agent now knows:
   // - Current project: "E-commerce Platform"
   // - Requirements: "OAuth2 support required"
   // - Design: "JWT tokens with Redis sessions"
   // - Active task: "Implement user login API" (high priority)
   ```

5. **Contextualized Response**:
   ```
   Agent: "For your e-commerce platform's login API, based on your requirements
   for OAuth2 support and design decision to use JWT with Redis, here's the
   implementation approach..."
   ```

## 🎯 Benefits of This Architecture

### 1. **Context-Aware AI Assistance**
- Agent always has access to current project requirements
- Responses are tailored to specific project needs
- Design decisions are respected in suggestions

### 2. **Unified Data Management**
- Single source of truth for project specifications
- Real-time synchronization across UI, chat, and agent
- Consistent data model across all interfaces

### 3. **Extensible Design**
- Easy to add new tool actions for agent access
- Modular components can be enhanced independently
- Clean separation between UI, service, and agent layers

### 4. **Developer Experience**
- Intuitive tabbed interface for project management
- Natural language chat commands for quick actions
- Seamless integration with existing VS Code workflows

## 🚀 Future Enhancements

### Potential Extensions

1. **File System Persistence**:
   ```typescript
   // Save specs to workspace files
   await fs.writeFile('.vscode/project-spec.json', JSON.stringify(spec));
   ```

2. **Git Integration**:
   ```typescript
   // Link tasks to Git branches/commits
   task.gitBranch = 'feature/user-authentication';
   ```

3. **Team Collaboration**:
   ```typescript
   // Sync specs across team members
   await syncService.shareProjectSpec(spec);
   ```

4. **Advanced Agent Actions**:
   ```typescript
   // Agent can create/modify tasks
   interface IProjectSpecParams {
       action: 'list' | 'status' | 'requirements' | 'design' | 'tasks' | 'create-task' | 'update-task';
   }
   ```

This documentation provides a comprehensive understanding of how the Project Specification System works, ensures agent context accuracy, and maintains clean architecture separation while providing powerful integration capabilities.
