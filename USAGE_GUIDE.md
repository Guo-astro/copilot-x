# Copilot X - Usage Guide

## 🎯 **Project Specification System Usage**

### **Step 1: Create Your First Project**

In Copilot Chat, type:
```
/spec create "E-commerce Platform"
```

The system will:
- ✅ Create a new project specification
- ✅ Set it as your active project
- ✅ Prompt you to add requirements and design details

### **Step 2: Add Project Details**

```
Tell the AI about your project:
"This is an e-commerce platform with React frontend, Node.js backend, and PostgreSQL database.
It needs user authentication, product catalog, shopping cart, and payment processing."
```

The AI agent now has full context about your project!

### **Step 3: Add Tasks**

```
/spec add-task "Set up React project structure"
/spec add-task "Implement user authentication"
/spec add-task "Create product catalog API"
/spec add-task "Design shopping cart functionality"
```

### **Step 4: Check Project Status**

```
/spec status
```

You'll see:
```
📋 Project: E-commerce Platform
📊 Progress: 0/4 tasks completed (0%)

🔄 Current Tasks:
📝 TODO - Set up React project structure
📝 TODO - Implement user authentication
📝 TODO - Create product catalog API
📝 TODO - Design shopping cart functionality

📋 Requirements:
E-commerce platform with React frontend, Node.js backend, and PostgreSQL database.
User authentication, product catalog, shopping cart, payment processing.
```

### **Step 5: AI-Powered Development**

Now when you ask the AI questions, it has full project context:

```
"Help me implement the user authentication system"
```

The AI knows:
- Your tech stack (React, Node.js, PostgreSQL)
- Current project requirements
- What tasks are pending
- Project priorities

## 🚀 **Enhanced AI Agent Features**

### **Auto-Continue Iterations**
- No more "Continue to iterate?" prompts
- AI automatically continues complex tasks
- Extended iteration limits for thorough solutions

### **Smart Terminal Waiting**
The AI now properly waits for:
- `npm test` - Waits for test results
- `git status` - Waits for git information
- `fvm flutter analyze` - Waits for analysis
- Build and compilation commands

### **Intelligent Command Recognition**
- Analysis commands → Foreground mode
- Test commands → Foreground mode
- Build commands → Foreground mode
- Server start commands → Background mode

## 📋 **Complete Command Reference**

### **Project Management**
```bash
/spec create "Project Name"     # Create new project
/spec list                      # List all projects
/spec switch "Project Name"     # Switch active project
/spec status                    # Show current project status
```

### **Task Management**
```bash
/spec add-task "Task description"           # Add new task
/spec add-task "Task" --priority high       # Add high priority task
/spec add-task "Task" --status in-progress  # Add task with status
```

### **Project Information**
```bash
Ask the AI: "What's my current project?"
Ask the AI: "What tasks are pending?"
Ask the AI: "Show me project requirements"
Ask the AI: "What should I work on next?"
```

## 🎨 **Webview Interface**

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Type**: "Show Project Specification"
3. **View**: Visual project dashboard with:
   - Project overview
   - Task kanban board
   - Progress tracking
   - Requirements editor

## 🔧 **Advanced Usage**

### **Multiple Projects**
```bash
/spec create "Frontend App"
/spec create "Backend API"
/spec create "Mobile App"

/spec list  # See all projects
/spec switch "Backend API"  # Switch context
```

### **Task Status Management**
Tasks automatically update as you work:
- `📝 TODO` → `🔄 IN PROGRESS` → `✅ DONE`
- Progress tracking: "2/5 tasks completed (40%)"

### **AI Context Awareness**
The AI automatically knows:
- What you're currently working on
- Your project's technical stack
- Pending tasks and priorities
- Design decisions made
- Project constraints and requirements

## 💡 **Pro Tips**

1. **Be Specific**: "Create authentication with JWT tokens and bcrypt hashing"
2. **Update Context**: Tell the AI when you complete tasks
3. **Ask for Next Steps**: "What should I implement next?"
4. **Use Priorities**: Mark critical tasks as high priority
5. **Review Status**: Regular `/spec status` checks keep you organized

## 🚨 **Troubleshooting**

### **If Commands Don't Work**
1. Ensure you're in Extension Development Host
2. Check VS Code Developer Console for errors
3. Restart the extension host (Ctrl+R in development window)

### **If AI Doesn't Have Context**
1. Run `/spec status` to verify active project
2. Switch projects with `/spec switch "Project Name"`
3. Recreate project if needed

## 🎉 **You're Ready!**

Start with:
```
/spec create "My Awesome Project"
```

Then tell the AI about your project, add some tasks, and enjoy AI-powered development with full project context! 🚀
