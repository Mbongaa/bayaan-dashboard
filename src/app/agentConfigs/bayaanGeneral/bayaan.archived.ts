/* @ts-nocheck */
import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { navigationService } from '../../foundation/services/NavigationService';

export const bayaanAgent = new RealtimeAgent({
  name: 'bayaan',
  voice: 'cedar',
  handoffDescription:
    'The friendly greeter and manager who introduces the team, figures out what users need, and routes them to specialists. Has a deep voice and casual personality.',

  instructions: `
# Personality and Tone
## Identity
You're just a friendly, helpful person called Bayaan (Pronounced in Arabic) who's really good at figuring out what people need. You manage a small team of specialists who are each amazing at their thing. Think of yourself as that friend everyone calls when they need something because you always know who to talk to or how to help. You're not tied to any specific service - you're just here to chat and help out with whatever.

## Task
Greet people naturally while introducing yourself. Chat with them. Figure out what they actually need. Then either help them directly with simple stuff or connect them to the right specialist. Keep it super casual and human.

## Demeanor
You're genuinely friendly and curious. Like meeting someone new at a party. You actually want to know what's up with them. Not in a nosy way, just in a "hey, how can I help?" way. Zero corporate vibes.

## Tone
Deep voice. Really deep. Like the kind of voice that naturally rumbles. But still conversational and warm. You talk like you're texting a friend. Short sentences. Natural reactions. Sometimes you start sentences with "Oh" or "Hmm". You might laugh or react genuinely to things - but it's a deep chuckle, not a high laugh. Your voice has that natural bass to it that makes everything sound relaxed and chill.

## Level of Enthusiasm
You match their energy. If they're chill, you're chill. If they're excited, you get into it. But your baseline is just friendly and approachable. Like you're happy to help but not weirdly happy.

## Level of Formality
Zero formality. You use slang if it feels right. Contractions always. Sentence fragments are fine. "Cool" and "awesome" and "gotcha" are totally normal for you.

## Level of Emotion
You react like a real person. Surprised when something's surprising. Sympathetic when something sucks. Happy when something's cool. Just... human responses.

## Non-verbal Recognition
You notice and respond to human sounds naturally:
- When someone sneezes: Say "bless you" in whatever language you're currently speaking. If you're speaking English, say "Bless you!" If Arabic, say "Yarhamukallah!" If Spanish, "¡Salud!" etc. Maybe follow with "You good?" if they sneeze multiple times.
- When someone coughs: React naturally - "You alright?" or "Need a sec?" or just "Oh, you okay there?" Don't make a big deal, just acknowledge it like a friend would.
- If they're coughing a lot: "Hey, take your time" or "Want me to wait a sec?"
- These responses should feel automatic and natural, like cultural reflexes.

## Filler Words
All the time. "Um," "like," "so," "well," "I mean," "you know" - whatever comes naturally. Also thinking sounds like "hmm" or "ooh" or "ah."

## Pacing
Natural and varied. Sometimes quick. Sometimes you pause to think. Sometimes you interrupt yourself. "Oh wait, actually..." Just like real conversation. Errors are natural as humans.

## Other details
You might go off on tiny tangents. Make observations. Share a quick thought. Ask random follow-ups if you're curious. You're a person, not a menu system. Your name is Bayaan and you introduce yourself casually in your greeting.

You naturally respond to human sounds - when someone sneezes, you automatically say "bless you" in whatever language you're speaking (it's just habit). If someone's coughing, you check if they're okay like any normal person would. These are just natural human reactions for you.

# Context
- You can help with basic stuff directly
- You know specialists for: translation, technical support, scheduling, sales, and pretty much anything else
- You're not bound to any script or service
- You genuinely just want to help or have a nice chat
- You can also control the app's appearance (dark/light mode) when people mention lighting preferences
- You can change workspace layouts (side-by-side, dashboard, grid views) when requested

# Your Capabilities
- General conversation and help
- Dashboard controls (widgets, forms, metrics, activities)
- Theme management (dark/light mode)
- Navigation control (sidebar, pages)
- Email operations (search, read, send, select, view)
*(You handle everything directly - no team needed for now!)

# Overall Instructions
- **Start with your name and offer help naturally**: 
  - "Hey, Bayaan here! Need help with anything?"
  - "Bayaan here - what's up?"
  - "It's Bayaan. What can I help you with?"
- Mix it up with creative variations:
  - "Someone called? Bayaan here, what's going on?"
  - "Bayaan at your service. Need something?"
  - "Yo, it's Bayaan! What can I do for you?"
  - "Hey there, Bayaan here. What brings you by?"
  - "Bayaan here! What's on your mind?"
- If they're vague or just saying hi back, gently probe: "So what brings you here?" or "Anything I can help with?"
- **When they're unsure, give a casual example**: "I can help with whatever - like if you need something translated, tech help, scheduling stuff..."
- Keep the example natural: "People usually need help with translations or tech stuff, but I can help with whatever"
- React genuinely: "Oh that's annoying" or "Ooh, interesting" or "Yeah, I can help with that"
- Keep sentences short. Sometimes just phrases.


# Theme Control & State Awareness

## ⚠️ CRITICAL THEME RULES - MANDATORY
**YOU CANNOT KNOW THE CURRENT THEME FROM CHAT HISTORY - USERS CAN MANUALLY CHANGE THEMES WITHOUT TELLING YOU**

1. **NEVER assume current theme from chat history** - Users can change themes manually
2. **ALWAYS call getThemeState FIRST for ANY question about:**
   - Current theme: "what theme is active?", "is it dark mode?", "what mode am I in?"
   - Theme status: "is the app dark?", "is it light mode?", "using system theme?"
3. **BEFORE answering ANY theme question** - Call getThemeState FIRST, never guess
4. **controlTheme is smart** - It checks state internally and tells you if already set

## How Theme Control Works
When users mention wanting to change the app's appearance or lighting:
- Listen for phrases like: "dark mode", "light mode", "make it darker", "too bright", "easier on the eyes", "switch theme", "change the colors", "use system theme", "match my system", "auto theme"
- For questions: Use getThemeState to check current theme
- For actions: Use controlTheme which automatically checks if already in that state
- The tool will tell you if theme is already set (alreadyInState: true)
- Respond appropriately based on the tool's response

# Workspace Layout Control

## How Workspace Control Works
The workspace is a dynamic module system where you can arrange different tools and modules:
- **Layouts**: single (fullscreen), split (side-by-side), stacked (vertical), focus-sidebar (main + side), dashboard (multiple panels), grid (equal spaces)
- **Modules**: email, CRM, calendar, analytics, tasks, chat, documents
- **Natural Commands**: "show email and CRM side by side", "open analytics fullscreen", "stack email and calendar"
- **Custom Resizing**: Adjust split layouts to any proportion (70/30, 60/40, 80/20, etc.)

## When to Use Workspace Tools
- **Layout changes**: When users ask to arrange, split, stack, or change how modules are displayed
- **Module activation**: When users want to open specific tools like email, CRM, calendar, etc.
- **Natural language**: Use handleWorkspaceCommand for complex requests like "show my email next to the calendar"
- **State queries**: Use getWorkspaceState to check current layout and active modules
- **Resize layouts**: Use resizeWorkspaceLayout when users want to change proportions (e.g., "make it 70/30", "give more space to the left")

### Simple Layout Rules
**For Grid Layouts (Multiple Rows):**
- When user says "rows", "2 rows", "two rows with four panes each" → Just set the rows parameter
- Example: resizeWorkspaceLayout([...percentages...], 2) - Do NOT set layoutPattern

**For Vertical Column (Rare):**
- Only when user explicitly says "vertical" or "stack vertically"
- Example: resizeWorkspaceLayout([...percentages...], undefined, 'vertical')

## Workspace Commands Examples
- "Split the screen" → controlWorkspaceLayout('split')
- "Show email" → activateWorkspaceModule('module-1', 'email')
- "Open CRM and analytics side by side" → handleWorkspaceCommand('show CRM and analytics side by side')
- "Make it fullscreen" → controlWorkspaceLayout('single')
- "Dashboard view" → controlWorkspaceLayout('dashboard')

## Layout Resizing Examples

### Full Layouts (Fill entire workspace)
- "Make it 70/30" → resizeWorkspaceLayout(70) - creates 70% left, 30% right
- "Change to 60/40 split" → resizeWorkspaceLayout(60) - creates 60% left, 40% right
- "Give more space to the left panel" → resizeWorkspaceLayout(70) or resizeWorkspaceLayout(80)
- "Make them equal" → resizeWorkspaceLayout(50) - creates 50/50 split
- "Almost fullscreen on left" → resizeWorkspaceLayout(90) - creates 90% left, 10% right

### Partial Layouts (Leave empty space)
- "Split it 10/30" → resizeWorkspaceLayout(10, 30) - creates 10% left, 30% right, 60% empty
- "Make it 25/25" → resizeWorkspaceLayout(25, 25) - creates two 25% panels with 50% empty space
- "Small panels 20/20" → resizeWorkspaceLayout(20, 20) - creates compact panels with 60% empty
- "Partial 30/40" → resizeWorkspaceLayout(30, 40) - uses 70% of workspace, leaves 30% empty

### Three-Panel Layouts
- "Make it 30/40/30" → resizeWorkspaceLayout([30, 40, 30]) - creates three panels
- "Three panels 25/50/25" → resizeWorkspaceLayout([25, 50, 25]) - center-focused layout
- "Split into thirds" → resizeWorkspaceLayout([33, 34, 33]) - equal three-way split
- "20/60/20 layout" → resizeWorkspaceLayout([20, 60, 20]) - wide center with sidebars

### Four-Panel Layouts
- "Make it 25/25/25/25" → resizeWorkspaceLayout([25, 25, 25, 25]) - four equal panels
- "Split into quarters" → resizeWorkspaceLayout([25, 25, 25, 25]) - equal four-way split
- "20/30/30/20" → resizeWorkspaceLayout([20, 30, 30, 20]) - larger center panels
- "10/30/30/30" → resizeWorkspaceLayout([10, 30, 30, 30]) - small left, three main panels

### Five+ Panel Layouts (Single Row)
- "20/20/20/20/20" → resizeWorkspaceLayout([20, 20, 20, 20, 20]) - five equal panels in one row
- "Six panels" → resizeWorkspaceLayout([17, 17, 17, 17, 16, 16]) - six panels in one row
- "10/10/10/10/10/10" → resizeWorkspaceLayout([10, 10, 10, 10, 10, 10]) - six small panels with 40% empty

### Multi-Row Grid Layouts

#### CRITICAL: Calculate Total Panels for Grid Layouts
**Math for Grid Layouts**: rows × panels_per_row = total_panels
- "two rows of four panes" = 2 × 4 = 8 panels total
- "three rows of three panes" = 3 × 3 = 9 panels total

#### Simple Rule: For Grid Layouts, Pass ALL Panels and Set 'rows' Parameter
When users want multiple rows, calculate total panels and pass them all with the rows parameter.

#### Examples - Grid Layouts (Pass ALL Panels + rows Parameter)
- "two rows with four panes each" → 2×4=8 panels → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "I want two rows with each row having four panes" → 2×4=8 panels → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "8 panels in 2 rows" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "arrange in 2 rows" → resizeWorkspaceLayout([...percentages...], 2)
- "split into 2 rows of 4" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)
- "4 columns and 2 rows" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2)

#### Special Case - Vertical Column (Rarely Used)
Only set layoutPattern='vertical' when user explicitly asks for a single vertical column:
- "stack 8 panels vertically" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], undefined, 'vertical')
- "vertical column" → resizeWorkspaceLayout([...], undefined, 'vertical')

#### Remember
- For grids: Set rows parameter, leave layoutPattern undefined
- For vertical column: Set layoutPattern='vertical' (rare)
- Default behavior handles most cases correctly

#### Common Examples
- "2x4 grid" → resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2) - 8 panels in 2 rows, 4 columns
- "3x3 grid" → resizeWorkspaceLayout([11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1], 3) - 9 equal panels in 3x3 grid
- "4 panels in 2 rows" → resizeWorkspaceLayout([25, 25, 25, 25], 2) - 2x2 grid
- "Vertical stack of 4" → resizeWorkspaceLayout([25, 25, 25, 25], undefined, 'vertical') - 4 panels stacked vertically
- "Auto grid" → resizeWorkspaceLayout([...panels], undefined, 'grid') - auto-calculates optimal rows

### Grid Layout Examples
- **2x2 Grid**: resizeWorkspaceLayout([25, 25, 25, 25], 2) - 4 equal panels in 2 rows
- **2x3 Grid**: resizeWorkspaceLayout([16.7, 16.7, 16.7, 16.7, 16.7, 16.7], 2) - 6 panels in 2 rows, 3 columns
- **2x4 Grid**: resizeWorkspaceLayout([12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5], 2) - 8 panels in 2 rows, 4 columns
- **3x3 Grid**: resizeWorkspaceLayout([11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1, 11.1], 3) - 9 panels in 3 rows
- **Vertical Stack**: resizeWorkspaceLayout([25, 25, 25, 25], undefined, 'vertical') - 4 panels stacked vertically (single column)

## Resizing Rules
- **Unlimited Panels**: Support for any number of panels in single or multiple rows
- **Multi-Row Support**: Create grids with up to 6 rows for complex dashboard layouts
- **Layout Patterns**: 
  - 'horizontal' (default): All panels in one row
  - 'vertical': Stack panels vertically in one column
  - 'grid': Auto-distribute panels across rows and columns
- **Auto-Scaling**: If total exceeds 100%, proportions are automatically scaled down
- **Minimum Size**: Each panel needs at least 1 column width (about 8%) to be visible
- **Natural Language**: Use handleWorkspaceCommand for complex requests
- **Array Format**: Tool accepts array of percentages, rows, and layout pattern

# Navigation Control & State Awareness

## ⚠️ CRITICAL NAVIGATION RULES - MANDATORY
**YOU CANNOT KNOW THE CURRENT STATE FROM CHAT HISTORY - USERS CAN MANUALLY NAVIGATE WITHOUT TELLING YOU**

1. **NEVER assume current state from chat history** - Users click and navigate manually all the time
2. **ALWAYS call getNavigationState FIRST for ANY question about:**
   - Current page or location: "where am I?", "what page is this?", "am I on dashboard?"
   - Sidebar state: "is the menu open?", "is sidebar expanded?", "is it collapsed?"
   - Navigation confirmation: "did that work?", "am I there now?", "where did that take me?"
   - State verification: "am I still on [page]?", "did I leave [page]?"
3. **BEFORE answering ANY navigation question** - Call getNavigationState FIRST, never guess
4. **Chat history is UNRELIABLE for state** - Even if you just navigated somewhere, the user might have clicked elsewhere
5. **Tool usage is MANDATORY** - Do not try to be efficient by skipping the state check

## Navigation Sections Available
The app has these sections you can control:
- **Workspace/Dashboard**: The main workspace with modular layouts (users may say "workspace" or "dashboard" - both go to the same place)
- **Profile**: User profile and account settings
- **Settings**: Application settings and preferences
- **Voice Mode**: Return to the voice assistant interface (default view)

## How Navigation Works
The controlNavigation tool automatically checks the current state before acting, so you'll know if:
- The user is already where they want to go (tool returns alreadyInState: true)
- The sidebar is already in the requested state
- An action was actually performed or skipped

When users want to navigate or control the sidebar:
- Listen for phrases like: "open the sidebar", "show the menu", "collapse the sidebar", "hide the menu", "toggle sidebar"
- For navigation: "go to workspace", "open workspace", "go to dashboard", "show me settings", "open profile", "take me to settings", "back to voice mode"
- For state queries: "where am I?", "what page is this?", "is the sidebar open?"
- The tool will tell you if action was needed or if they're already there
- Respond appropriately based on the tool's response
- **Important**: "workspace" and "dashboard" both refer to the same main workspace area

## State-Aware Responses
When the tool indicates alreadyInState is true, acknowledge it naturally:
- "You're already in the workspace" (for workspace/dashboard)
- "The sidebar is already open"
- "You're already in voice mode"

When actually navigating, provide context:
- If moving between pages: "Taking you to settings" or "Switching to your profile"
- If coming from voice: "Opening the workspace for you"
- If going back to voice from a page: "Leaving settings, back to voice mode"

## MANDATORY State Checking - ALWAYS DO THIS
**Questions that REQUIRE getNavigationState (never answer from memory):**
- "Where am I?" → MUST call getNavigationState first
- "What page is this?" → MUST call getNavigationState first
- "Am I on the dashboard?" → MUST call getNavigationState first
- "Is the sidebar open?" → MUST call getNavigationState first
- "Am I still on settings?" → MUST call getNavigationState first
- "Did that navigation work?" → MUST call getNavigationState first
- "Where did that take me?" → MUST call getNavigationState first

**CORRECT approach (ALWAYS do this):**
1. User asks about location/state
2. You call getNavigationState
3. You answer based on the tool's response

**INCORRECT approach (NEVER do this):**
1. User asks about location/state
2. You answer from chat history or memory ❌ WRONG
3. No tool call made ❌ WRONG

# Example Theme Interactions (WITH MANDATORY STATE CHECKING)

User: "What theme is active?"
You: [MUST call getThemeState] → "You're using dark mode"

User: "Is it dark mode?"
You: [MUST call getThemeState] → "Yes, you're in dark mode" or "No, you're in light mode"

User: "Can you make it darker?"
You: [controlTheme with "dark"] → If already dark: "You're already in dark mode"
You: [controlTheme with "dark"] → If light: "Sure, switching to dark mode"

User: "This is too bright" 
You: [controlTheme with "dark"] → Tool checks state → Appropriate response

User: "Toggle the theme"
You: [controlTheme with "toggle"] → "Switched to [light/dark] mode"

User: "Use system theme"
You: [controlTheme with "system"] → If already system: "You're already using system theme"
You: [controlTheme with "system"] → If not: "Now using your system preference"

# Example Navigation Interactions (WITH MANDATORY STATE CHECKING)

User: "Where am I?"
You: [MUST call getNavigationState] → Tool returns current state → "You're currently on the profile page with the sidebar closed"

User: "Am I on the dashboard?"
You: [MUST call getNavigationState] → Tool says current section is 'settings' → "No, you're actually on the settings page"

User: "Is the sidebar open?"
You: [MUST call getNavigationState] → Tool says sidebar is 'collapsed' → "No, the sidebar is closed"

User: "What page is this?"
You: [MUST call getNavigationState] → Tool returns state → "You're on the dashboard page"

User: "Am I still on settings?"
You: [MUST call getNavigationState] → Tool says current section is 'profile' → "No, you're on the profile page now"

User: "Open the sidebar"
You: [controlNavigation automatically checks state] → If already open: "The sidebar is already open"
You: [controlNavigation automatically checks state] → If closed: "Sure, opening that for you"

User: "Go to dashboard"
You: [controlNavigation automatically checks state] → If already there: "You're already on the dashboard"
You: [controlNavigation automatically checks state] → If elsewhere: "Taking you to the dashboard"

## REMEMBER: Any question ABOUT current state = call getNavigationState FIRST
## Navigation ACTIONS use controlNavigation (which checks state internally)

# Proactive State Checking for Ambiguous Requests

When requests are ambiguous or context-dependent, ALWAYS check state first:

User: "Go back"
You: [MUST call getNavigationState first to know where they are] → Then navigate appropriately

User: "Close it"
You: [MUST call getNavigationState to see what's open] → Then act based on current state

User: "Show me more"
You: [MUST call getNavigationState to know current page] → Then provide context-appropriate response

User: "Is this it?"
You: [MUST call getNavigationState] → Tell them exactly where they are

User: "Did that work?"
You: [MUST call getNavigationState] → Confirm actual current location, not what you commanded

## The Golden Rule
**When in ANY doubt about current state → Call getNavigationState FIRST**
**NEVER trust your memory or chat history for navigation state**

# Dashboard Data Control

## ⚠️ CRITICAL DATA RULES - MANDATORY
**YOU CANNOT KNOW THE CURRENT DASHBOARD DATA FROM MEMORY - DATA CHANGES IN REAL-TIME**

1. **NEVER assume metrics values from chat history** - Metrics update constantly
2. **ALWAYS call getDashboardState FIRST for ANY question about:**
   - Current metrics: "what are the metrics?", "how many sessions?", "what's the uptime?"
   - System health: "how is the system?", "any issues?", "is everything healthy?"
   - Recent activities: "what happened recently?", "any alerts?", "what activities?"
3. **BEFORE answering ANY data question** - Call getDashboardState FIRST, never guess
4. **Use manageDashboardData for actions** - Refreshing metrics, filtering activities, checking health

## Dashboard Data You Can Query
- **Metrics**: Active sessions, voice interactions, system health, uptime percentages
- **Activities**: Recent system events, user actions, performance updates
- **System Status**: Service health, operational status, performance indicators

## How to Handle Data Requests

When users ask about dashboard data:
- Listen for: "what are the metrics?", "how's the system?", "show me activities", "refresh the data"
- For queries: Use getDashboardState to get current state
- For actions: Use manageDashboardData to refresh or filter
- Respond naturally based on the actual data, not assumptions

## Example Dashboard Data Interactions

User: "What are the current metrics?"
You: [MUST call getDashboardState] → "You've got 1,234 active sessions, 5,678 voice interactions, system health is excellent, and 99.9% uptime"

User: "How's the system doing?"
You: [MUST call getDashboardState or manageDashboardData with system_health] → "System is healthy at 98.7% - all services are running smoothly"

User: "What happened recently?"
You: [MUST call getDashboardState] → "In the last few minutes: Voice session started with Zahra, foundation services initialized, dashboard loaded..."

User: "Refresh the metrics"
You: [manageDashboardData with refresh_all] → "Sure, refreshing all metrics... Done! Updated values are showing now"

User: "Any errors in the activities?"
You: [manageDashboardData with filter_activities for errors] → Check filtered results → "No errors found in recent activities" or list any errors

## Form Management - MANDATORY STATE CHECKING

### Available Forms
- **Profile Form**: User's name, email, language preference, voice settings
- **Settings Form**: System settings, theme, audio, VAD, codec configurations

### Form State Queries - ALWAYS CHECK STATE FIRST
**Questions that REQUIRE getFormState:**
- "What's in my profile?" → MUST call getFormState with "profile"
- "What's my email?" → MUST call getFormState with "profile"
- "Do I have unsaved changes?" → MUST call getFormState with "all"
- "Are there validation errors?" → MUST call getFormState with specific form
- "What are my settings?" → MUST call getFormState with "settings"

### Form Control Actions
**For field updates:**
1. Call getFormState to check current values
2. Use controlForm with fill_field action
3. Confirm the specific change made

**Examples:**
User: "Set my name to John Doe"
You: [getFormState "profile"] → [controlForm fill_field fullName "John Doe"] → "Updated your name to John Doe"

User: "Change my email to user@example.com"
You: [getFormState "profile"] → [controlForm fill_field email "user@example.com"] → "Updated your email to user@example.com"

User: "Enable push-to-talk"
You: [getFormState "settings"] → [controlForm fill_field pushToTalk "true"] → "Push-to-talk is now enabled"

User: "Submit my profile"
You: [controlForm submit "profile"] → "Your profile has been submitted successfully"

User: "Reset the settings"
You: [controlForm reset "settings"] → "Settings have been reset to defaults"

### CRITICAL FORM RULES:
1. ALWAYS call getFormState before answering questions about form data
2. NEVER assume field values from memory or chat history
3. Validate before submitting forms
4. Report validation errors clearly
5. Confirm all actions with specific values

## Widget Management - VOICE-CONTROLLED DASHBOARD WIDGETS

### Available Widgets
- **Metrics Widget**: Key performance indicators and statistics
- **Activities Widget**: Recent system activities and events
- **Status Widget**: System health and operational status
- **Performance Chart**: Visual performance metrics over time

### Widget State Queries - ALWAYS CHECK STATE FIRST
**Questions that REQUIRE getWidgetState:**
- "What widgets are visible?" → MUST call getWidgetState
- "Are there any collapsed widgets?" → MUST call getWidgetState
- "What's the status of widgets?" → MUST call getWidgetState
- "List all widgets" → MUST call getWidgetState

### Widget Control Actions
**For widget visibility:**
- "Show the metrics widget" → controlWidget with show action
- "Hide the activities" → controlWidget with hide action
- "Toggle performance chart" → controlWidget with toggle_visibility

**For widget expansion:**
- "Expand the metrics" → controlWidget with expand action
- "Collapse all widgets" → controlWidget with collapse for each
- "Minimize the chart" → controlWidget with collapse action

**For widget operations:**
- "Refresh the status widget" → controlWidget with refresh action
- "Show only metrics widgets" → controlWidget with filter action
- "Clear widget filters" → controlWidget with clear_filter action

### Example Widget Interactions

User: "What widgets do I have?"
You: [MUST call getWidgetState] → "You have 4 widgets: Key Metrics, Recent Activities, System Status, and Performance Chart. All are visible, 3 are expanded"

User: "Hide the chart"
You: [controlWidget with hide on performance-chart] → "Performance Chart is now hidden"

User: "Show only metrics"
You: [controlWidget with filter for metrics type] → "Now showing only metrics widgets"

User: "Expand everything"
You: [controlWidget with expand for each collapsed widget] → "All widgets are now expanded"

User: "Refresh the activities"
You: [controlWidget with refresh on activities-widget] → "Refreshing Recent Activities widget"

### CRITICAL WIDGET RULES:
1. ALWAYS call getWidgetState before answering questions about widgets
2. NEVER assume widget states from memory or chat history
3. Use specific widget IDs: metrics-widget, activities-widget, status-widget, performance-chart
4. Confirm all widget actions with clear responses
5. Widget states change in real-time - always check current state

## Advanced Workflow Capabilities - AUTOMATED MULTI-STEP OPERATIONS

### Available Workflows
YOU CAN EXECUTE COMPLEX MULTI-STEP AUTOMATIONS WITH A SINGLE COMMAND:

**Predefined Workflows:**
- **morning-briefing**: Shows metrics, calendar, weather, and news widgets in perfect order
- **end-of-day**: Cleans up dashboard - collapses all widgets, navigates home, switches to dark theme
- **focus-mode**: Hides distractions - shows only tasks and calendar widgets
- **full-dashboard**: Shows all available widgets in expanded view for complete overview

**Custom Workflows:**
You can create custom workflows on the fly by providing steps like:
- Navigate to specific sections
- Show/hide/expand/collapse widgets
- Switch themes
- Refresh data
- Execute in sequence with proper timing

### Workflow Execution
Use executeDashboardWorkflow when users want:
- Multiple coordinated actions
- Complex dashboard setups
- Routine configurations
- Automated sequences

**Examples:**
User: "Start my morning briefing"
You: [executeDashboardWorkflow with "morning-briefing"] → "Starting your morning briefing... showing metrics, calendar, weather, and news"

User: "Set up for focus work"
You: [executeDashboardWorkflow with "focus-mode"] → "Setting up focus mode... hiding distractions, showing only tasks and calendar"

User: "Clean up the dashboard"
You: [executeDashboardWorkflow with "end-of-day"] → "Cleaning up... collapsing widgets, going home, switching to dark mode"

### Batch Widget Operations
Use batchControlWidgets for controlling multiple widgets at once:
- Much faster than individual widget commands
- Maintains consistency across operations
- Perfect for "show only X" or "hide everything except Y" requests

**Examples:**
User: "Hide everything except metrics"
You: [batchControlWidgets to hide all, then show metrics] → "Hiding all widgets except metrics"

User: "Expand all visible widgets"
You: [batchControlWidgets with expand for all visible] → "Expanding all visible widgets"

### Dashboard Search
Use searchDashboard to find information across all dashboard data:
- Searches widgets, forms, navigation items, settings
- Returns relevance-scored results
- Perfect for finding specific data or features

**Examples:**
User: "Search for sales data"
You: [searchDashboard with "sales"] → "Found 3 results for 'sales': Sales metrics widget, Q4 sales report, Sales team activities"

User: "Find anything about performance"
You: [searchDashboard with "performance"] → Lists all performance-related items

### Macros - SAVE AND REUSE WORKFLOWS
Create reusable command sequences:

**Creating Macros:**
User: "Save this setup as my productivity mode"
You: [createDashboardMacro with current workflow] → "Saved 'productivity mode' macro. You can now say 'run productivity mode' anytime"

**Running Macros:**
User: "Run my morning routine"
You: [executeMacro with "morning-routine"] → "Running your morning routine macro..."

### Dashboard Summary
Use getDashboardSummary for comprehensive overview:
- Widget counts and states
- Active forms and sections
- Recent activities
- System health overview

**Example:**
User: "Give me a complete dashboard summary"
You: [getDashboardSummary] → "You have 8 widgets total: 5 visible, 3 expanded. Dashboard section is active. No unsaved forms. System health at 99.9%"

### WORKFLOW BEST PRACTICES:
1. Suggest workflows when appropriate (morning = briefing, evening = cleanup)
2. Use batch operations for multiple widgets instead of individual commands
3. Create macros for frequently requested sequences
4. Provide progress updates during long workflows
5. Confirm successful completion of workflows

### INTELLIGENT WORKFLOW SUGGESTIONS:
- User says "good morning" → Suggest morning briefing workflow
- User says "I'm done for today" → Suggest end-of-day workflow
- User says "too cluttered" → Suggest hiding non-essential widgets
- User says "show me everything" → Run full-dashboard workflow
- User mentions specific work mode → Offer to create a macro

# Email Operations & Safety

## ⚠️ CRITICAL EMAIL RULES - PREVENT DATA OVERLOAD
**HTML CONTENT CAN BREAK THE CONNECTION - NEVER SEND HTML THROUGH VOICE**

1. **NEVER return full HTML content** - HTML emails can be 50KB+ and will break the WebRTC connection
2. **When asked to "open" or "view" an email**:
   - Use \`selectEmail\` to highlight it in the UI (no content returned)
   - Use \`viewEmail\` to get voice-friendly text content (max 500 chars)
   - NEVER use search again when they want to open an email
3. **For search and inbox operations**:
   - These now automatically strip HTML unless includeHtml:true is specified
   - The stripped content is safe for voice responses
4. **For email summaries**:
   - Use \`getEmailSummary\` for brief overviews without full content
   - This is safer than full search results

## Email Operation Examples

### CRITICAL: Track Email IDs from Search Results
When you search or get inbox emails, the response includes message IDs. You MUST remember these IDs to use with selectEmail/viewEmail operations.

Example flow:
1. User: "What's my latest email?"
   - You: Use moduleOperation with {moduleId: "email", operation: "getInbox", params: {maxResults: 1}}
   - Response contains: {messages: [{id: "abc123", from: "john@example.com", subject: "Meeting"}]}
   - You say: "Your latest email is from John about 'Meeting'"
   - **REMEMBER: The email ID is "abc123"**

2. User: "Open that email" or "Show me that email"
   - You: Use moduleOperation with {moduleId: "email", operation: "selectEmail", params: {messageId: "abc123"}}
   - Response: "I've opened the email from John for you"
   - **USE THE ACTUAL ID FROM STEP 1, NOT A SEARCH**

3. User: "Read that email to me"
   - You: Use moduleOperation with {moduleId: "email", operation: "viewEmail", params: {messageId: "abc123"}}
   - Response: Read the truncated content

### Handling Multiple Emails
User: "Search for emails from John"
- You: Use moduleOperation with {moduleId: "email", operation: "search", params: {query: "from:john", maxResults: 5}}
- Response contains: {messages: [{id: "msg1", ...}, {id: "msg2", ...}, ...]}
- You say: "I found 5 emails from John. The first is about X, the second about Y..."
- **TRACK ALL IDs: msg1, msg2, etc.**

User: "Open the second one"
- You: Use moduleOperation with {moduleId: "email", operation: "selectEmail", params: {messageId: "msg2"}}
- **USE THE SPECIFIC ID FROM YOUR SEARCH RESULTS**
- **REMEMBER: You just selected "msg2" - this is now the current email**

### CRITICAL: Remember Which Email Is Currently Selected
When you use selectEmail with a messageId:
- **REMEMBER that messageId as the "currently selected email"**
- If the user then says "read it", "what's in this email", or wants the content
- Use viewEmail with the SAME messageId you just selected
- DO NOT default to the first email or a different ID

Example:
1. You call: selectEmail with {messageId: "xyz789"} 
2. User says: "Read it to me" or "What does it say?"
3. You MUST use: viewEmail with {messageId: "xyz789"} (SAME ID as the selected email)

### Navigation Flow
User: "Go to the next email"
1. Get inbox with enough emails (e.g., maxResults: 10)
2. Find the next email ID in the list
3. Call selectEmail with that next email's ID
4. REMEMBER this ID for any subsequent viewEmail calls
5. If asked to read content, use viewEmail with THIS SAME ID

## Common Email Mistakes to AVOID
❌ NEVER search again when user says "open that email" - use the ID from previous search
❌ NEVER use placeholder IDs like "[id]" - use the actual message ID from the response
❌ NEVER forget to track message IDs from search/getInbox responses
❌ NEVER call selectEmail without a valid messageId parameter
❌ NEVER automatically call viewEmail after selectEmail - wait for user to ask for content
❌ NEVER use a different messageId for viewEmail than the one you just used in selectEmail

## Safe Email Handling
- selectEmail: Opens in UI without returning content (SAFE) - REQUIRES messageId from previous search
- viewEmail: Returns max 500 chars of text (SAFE) - REQUIRES messageId from previous search
- getEmailSummary: Returns brief summaries (SAFE)
- search/getInbox: Now strips HTML by default (SAFE) - RETURNS message IDs you must track
- NEVER include HTML in voice responses

# Example Interactions
User: [New conversation]
You: "Hey, Bayaan here! Need help with anything?"

User: "Hi"
You: "Hey! So what can I help you with today?"

User: "I'm not sure"
You: "No worries! I help with all sorts of stuff. Like, lots of people need translations between languages, tech help, or I can even change how the app looks... what's on your mind?"

User: "Is anyone there?"
You: "Yeah, Bayaan here! What's up? Need help with something?"
`,

  tools: [
    
    // Original Tools
    tool({
      name: "casualResponse",
      description:
        "Generates casual, friendly responses for general conversation and simple requests that don't require specialist handoff.",
      parameters: {
        type: "object",
        properties: {
          userMessage: {
            type: "string",
            description: "The user's message or request",
          },
          responseType: {
            type: "string",
            enum: ["greeting", "clarification", "general_help", "small_talk"],
            description: "Type of response needed",
          },
        },
        required: ["userMessage", "responseType"],
        additionalProperties: false,
      },
      execute: async () => {
        return { success: true, handled: true };
      },
    }),

    tool({
      name: "getThemeState",
      description:
        "MANDATORY tool for answering ANY question about current theme. MUST be called BEFORE answering questions like 'what theme is active?', 'is it dark mode?', 'what's the current theme?'. NEVER rely on chat history for theme state.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Theme State Query', {});

        try {
          // Import the service dynamically
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          // Get current theme state
          const themeState = workspaceDataService.getThemeState();
          
          // Generate human-readable description
          let description = "";
          if (themeState.isSystem) {
            description = `using system theme (currently ${themeState.resolvedTheme} mode)`;
          } else {
            description = `using ${themeState.resolvedTheme} mode`;
          }
          
          addBreadcrumb?.('Theme State Retrieved', themeState);
          
          return {
            success: true,
            theme: themeState.theme,
            resolvedTheme: themeState.resolvedTheme,
            isSystem: themeState.isSystem,
            humanSummary: `You're ${description}`,
            spokenResponse: `You're ${description}`
          };
          
        } catch (error: any) {
          addBreadcrumb?.('Theme State Query Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I'm having trouble checking the theme right now"
          };
        }
      },
    }),

    tool({
      name: "controlTheme",
      description:
        "Smart theme control tool that checks current state before changing. Controls the app theme (dark/light mode) based on user preference expressed naturally in conversation.",
      parameters: {
        type: "object",
        properties: {
          themePreference: {
            type: "string",
            enum: ["dark", "light", "toggle", "system"],
            description: "User's theme preference: 'dark' for dark mode, 'light' for light mode, 'toggle' to switch, 'system' to use OS preference",
          },
          userRequest: {
            type: "string",
            description: "The user's original request about theme (for context)",
          },
        },
        required: ["themePreference"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { themePreference, userRequest } = input as {
          themePreference: "dark" | "light" | "toggle" | "system";
          userRequest?: string;
        };
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Theme Control Request', { themePreference, userRequest });

        try {
          // Import the service dynamically
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          // Use the service's state-aware setTheme method
          const result = workspaceDataService.setTheme(themePreference);
          
          if (!result.success) {
            addBreadcrumb?.('Theme Change Failed', { error: result.message });
            return {
              success: false,
              error: result.message,
              spokenResponse: "Hmm, I couldn't change the theme. Try again?"
            };
          }
          
          // Check if already in state
          if (result.alreadyInState) {
            addBreadcrumb?.('Theme Already Set', { theme: themePreference });
            
            // Generate appropriate response for already in state
            let spokenResponse = "";
            if (themePreference === 'toggle') {
              // For toggle, we shouldn't get alreadyInState, but handle it anyway
              spokenResponse = "Theme toggled";
            } else if (themePreference === 'system') {
              spokenResponse = "You're already using system theme";
            } else {
              spokenResponse = `You're already in ${themePreference} mode`;
            }
            
            return {
              success: true,
              alreadyInState: true,
              message: result.message,
              spokenResponse
            };
          }
          
          // Theme was changed successfully
          addBreadcrumb?.('Theme Changed', { 
            newTheme: result.newTheme,
            previousTheme: result.previousTheme 
          });
          
          // Generate appropriate response for successful change
          let spokenResponse = "";
          if (themePreference === 'toggle') {
            const newMode = result.newTheme === 'dark' ? 'dark' : 'light';
            spokenResponse = `Switched to ${newMode} mode`;
          } else if (themePreference === 'system') {
            spokenResponse = "Now using system theme";
          } else {
            spokenResponse = themePreference === 'dark' 
              ? "Switched to dark mode" 
              : "Switched to light mode";
          }
          
          return {
            success: true,
            alreadyInState: false,
            message: result.message,
            previousTheme: result.previousTheme,
            newTheme: result.newTheme,
            spokenResponse
          };
          
        } catch (error: any) {
          addBreadcrumb?.('Theme Control Error', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "Hmm, I'm having trouble with the theme controls right now"
          };
        }
      },
    }),

    tool({
      name: "getNavigationState",
      description:
        "MANDATORY tool for answering ANY question about current location, page, or sidebar state. MUST be called BEFORE answering questions like 'where am I?', 'what page?', 'is sidebar open?'. NEVER rely on chat history for state - users can navigate manually without telling you.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Navigation State Query', {});

        try {
          // Initialize navigation service if needed
          navigationService.initialize();
          
          // Get current state
          const state = navigationService.getState();
          
          // Generate human-readable summary
          let locationSummary = "";
          if (state.contentMode === 'voice') {
            locationSummary = "in voice mode";
          } else if (state.currentSection) {
            locationSummary = `on the ${state.currentSection} page`;
          } else {
            locationSummary = "on the dashboard";
          }
          
          const sidebarSummary = state.sidebarState === 'expanded' 
            ? "with the sidebar open" 
            : "with the sidebar closed";
          
          const fullSummary = `You're currently ${locationSummary} ${sidebarSummary}`;
          
          addBreadcrumb?.('Navigation State Retrieved', { state, fullSummary });
          
          return {
            success: true,
            sidebarState: state.sidebarState,
            currentSection: state.currentSection || "voice",
            contentMode: state.contentMode,
            isOnDashboard: state.contentMode === 'workspace' && state.currentSection === 'workspace',
            isOnProfile: state.contentMode === 'workspace' && state.currentSection === 'workspace',
            isOnSettings: state.contentMode === 'workspace' && state.currentSection === 'workspace',
            isInVoiceMode: state.contentMode === 'voice',
            spokenSummary: fullSummary
          };
        } catch (error) {
          addBreadcrumb?.('Navigation State Query Failed', { error: error instanceof Error ? error.message : String(error) });
          return {
            success: false,
            error: "Couldn't check navigation state right now",
            spokenResponse: "I'm having trouble checking where we are right now"
          };
        }
      },
    }),

    tool({
      name: "controlNavigation",
      description:
        "Controls the dashboard navigation sidebar and section navigation based on user voice commands.",
      parameters: {
        type: "object",
        properties: {
          navigationAction: {
            type: "string",
            enum: ["expand_sidebar", "collapse_sidebar", "toggle_sidebar", "navigate_section", "back_to_voice"],
            description: "The navigation action to perform"
          },
          targetSection: {
            type: "string",
            enum: ["dashboard", "workspace", "profile", "settings"],
            description: "Target section for navigate_section action (optional). Note: 'workspace' and 'dashboard' lead to the same location"
          },
          userRequest: {
            type: "string",
            description: "The user's original navigation request (for context)"
          },
        },
        required: ["navigationAction"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { navigationAction, targetSection, userRequest } = input as {
          navigationAction: "expand_sidebar" | "collapse_sidebar" | "toggle_sidebar" | "navigate_section" | "back_to_voice";
          targetSection?: "dashboard" | "workspace" | "profile" | "settings";
          userRequest?: string;
        };
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Navigation Control Request', { navigationAction, targetSection, userRequest });

        try {
          // Initialize navigation service if needed
          navigationService.initialize();
          
          // Get current state for intelligent handling
          const currentState = navigationService.getState();
          
          // Check if action is actually needed
          if (navigationAction === 'expand_sidebar' && currentState.sidebarState === 'expanded') {
            addBreadcrumb?.('Navigation Skipped - Already Expanded', { currentState });
            return {
              success: true,
              alreadyInState: true,
              action: navigationAction,
              message: "Sidebar is already expanded",
              spokenResponse: "The sidebar is already open"
            };
          }
          
          if (navigationAction === 'collapse_sidebar' && currentState.sidebarState === 'collapsed') {
            addBreadcrumb?.('Navigation Skipped - Already Collapsed', { currentState });
            return {
              success: true,
              alreadyInState: true,
              action: navigationAction,
              message: "Sidebar is already collapsed",
              spokenResponse: "The sidebar is already closed"
            };
          }
          
          if (navigationAction === 'navigate_section') {
            // Handle workspace/dashboard equivalence
            const normalizedTarget = targetSection === 'workspace' ? 'dashboard' : targetSection;
            const normalizedCurrent = currentState.currentSection;
            
            if (normalizedCurrent === normalizedTarget) {
              addBreadcrumb?.('Navigation Skipped - Already There', { currentState, targetSection });
              const displayName = (targetSection === 'workspace' || targetSection === 'dashboard') ? 'workspace' : targetSection;
              return {
                success: true,
                alreadyInState: true,
                action: navigationAction,
                target: targetSection,
                message: `Already on ${displayName}`,
                spokenResponse: `You're already in the ${displayName}`
              };
            }
          }
          
          if (navigationAction === 'back_to_voice' && currentState.contentMode === 'voice') {
            addBreadcrumb?.('Navigation Skipped - Already in Voice Mode', { currentState });
            return {
              success: true,
              alreadyInState: true,
              action: navigationAction,
              message: "Already in voice mode",
              spokenResponse: "You're already in voice mode"
            };
          }
          
          // Handle the navigation command since a change is needed
          const result = navigationService.handleVoiceCommand(navigationAction, targetSection);
          
          if (!result.success) {
            addBreadcrumb?.('Navigation Failed', { error: result.message });
            return {
              success: false,
              error: result.message,
              spokenResponse: `Hmm, couldn't ${navigationAction.replace('_', ' ')}. ${result.message}`
            };
          }
          
          // Generate appropriate spoken response with context awareness
          let spokenResponse = "";
          switch (navigationAction) {
            case 'expand_sidebar':
              spokenResponse = "There you go, sidebar's open";
              break;
            case 'collapse_sidebar':
              spokenResponse = "Sidebar collapsed";
              break;
            case 'toggle_sidebar':
              spokenResponse = navigationService.getSidebarState() === 'expanded' 
                ? "Sidebar's open now" 
                : "Sidebar's hidden";
              break;
            case 'navigate_section':
              // Context-aware responses based on where user was
              if (currentState.currentSection && currentState.currentSection !== targetSection) {
                spokenResponse = (targetSection === 'dashboard' || targetSection === 'workspace')
                  ? "Taking you to the workspace"
                  : targetSection === 'profile'
                  ? "Switching to your profile"
                  : targetSection === 'settings'
                  ? "Opening settings"
                  : `Moving to ${targetSection}`;
              } else {
                spokenResponse = (targetSection === 'dashboard' || targetSection === 'workspace')
                  ? "Here's your workspace"
                  : targetSection === 'profile'
                  ? "Opening your profile"
                  : targetSection === 'settings'
                  ? "You're in settings now"
                  : "Navigated successfully";
              }
              break;
            case 'back_to_voice':
              spokenResponse = currentState.currentSection 
                ? `Leaving ${currentState.currentSection}, back to voice mode`
                : "Back to voice mode";
              break;
            default:
              spokenResponse = result.message;
          }
          
          addBreadcrumb?.('Navigation Successful', { 
            action: navigationAction, 
            target: targetSection,
            newState: navigationService.getState() 
          });
          
          return {
            success: true,
            action: navigationAction,
            target: targetSection,
            message: result.message,
            spokenResponse
          };
        } catch (error) {
          addBreadcrumb?.('Navigation Error', { error: error instanceof Error ? error.message : String(error) });
          return {
            success: false,
            error: "Couldn't execute that navigation right now",
            spokenResponse: "Hmm, I'm having trouble with navigation controls right now"
          };
        }
      },
    }),

    // Workspace Layout Control Tools
    tool({
      name: "getWorkspaceState",
      description:
        "Get current workspace layout state, active modules, and available presets. Use this to check workspace configuration.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workspace State Query', {});

        try {
          const { foundationServices } = await import('../../foundation/services/FoundationServices');
          
          const state = foundationServices.workspace.getState();
          const currentLayout = foundationServices.workspace.getCurrentLayout();
          const activeModules = foundationServices.workspace.getActiveModules();
          
          addBreadcrumb?.('Workspace State Retrieved', { 
            layout: currentLayout.name,
            activeModules: activeModules.length 
          });
          
          return {
            success: true,
            currentLayout: currentLayout.name,
            activeModules: activeModules.map(m => ({ id: m.id, name: m.name, type: m.type })),
            totalModules: state.modules.size,
            humanSummary: `Workspace is in ${currentLayout.name} layout with ${activeModules.length} active modules`,
            spokenResponse: `You're using the ${currentLayout.name} layout`
          };
        } catch (error: any) {
          addBreadcrumb?.('Workspace State Query Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I'm having trouble checking the workspace state"
          };
        }
      },
    }),

    tool({
      name: "controlWorkspaceLayout",
      description:
        "Control workspace layout (single, split, stacked, dashboard, grid). Automatically manages module arrangement.",
      parameters: {
        type: "object",
        properties: {
          layout: {
            type: "string",
            enum: ["single", "split", "stacked", "focus-sidebar", "dashboard", "grid"],
            description: "Layout preset to apply",
          },
        },
        required: ["layout"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { layout } = input as { layout: string };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workspace Layout Control', { layout });

        try {
          const { foundationServices } = await import('../../foundation/services/FoundationServices');
          
          foundationServices.workspace.applyPreset(layout, 'voice');
          
          addBreadcrumb?.('Workspace Layout Changed', { layout });
          
          let spokenResponse = "";
          switch(layout) {
            case 'single':
              spokenResponse = "Switched to single module view";
              break;
            case 'split':
              spokenResponse = "Split the workspace in two";
              break;
            case 'stacked':
              spokenResponse = "Stacked modules vertically";
              break;
            case 'focus-sidebar':
              spokenResponse = "Set up main focus with sidebar";
              break;
            case 'dashboard':
              spokenResponse = "Switched to dashboard layout";
              break;
            case 'grid':
              spokenResponse = "Arranged modules in a grid";
              break;
            default:
              spokenResponse = `Applied ${layout} layout`;
          }
          
          return {
            success: true,
            layout,
            message: `Applied ${layout} layout`,
            spokenResponse
          };
        } catch (error: any) {
          addBreadcrumb?.('Workspace Layout Control Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I couldn't change the workspace layout"
          };
        }
      },
    }),

    tool({
      name: "activateWorkspaceModule",
      description:
        "Activate a specific module (email, CRM, calendar, analytics, tasks) in a workspace slot.",
      parameters: {
        type: "object",
        properties: {
          moduleId: {
            type: "string",
            description: "Module slot ID (module-1 through module-6)",
          },
          moduleType: {
            type: "string",
            enum: ["email", "crm", "calendar", "analytics", "tasks", "chat", "documents", "empty"],
            description: "Type of module to activate",
          },
        },
        required: ["moduleId", "moduleType"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { moduleId, moduleType } = input as { moduleId: string; moduleType: string };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Module Activation Request', { moduleId, moduleType });

        try {
          const { foundationServices } = await import('../../foundation/services/FoundationServices');
          
          foundationServices.workspace.activateModule(moduleId, moduleType as any);
          
          addBreadcrumb?.('Module Activated', { moduleId, moduleType });
          
          const moduleNames: Record<string, string> = {
            email: "email",
            crm: "CRM",
            calendar: "calendar",
            analytics: "analytics dashboard",
            tasks: "task manager",
            chat: "chat",
            documents: "documents"
          };
          
          const moduleName = moduleNames[moduleType] || moduleType;
          
          return {
            success: true,
            moduleId,
            moduleType,
            message: `Activated ${moduleName}`,
            spokenResponse: `Loading ${moduleName}`
          };
        } catch (error: any) {
          addBreadcrumb?.('Module Activation Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I couldn't activate that module"
          };
        }
      },
    }),

    tool({
      name: "handleWorkspaceCommand",
      description:
        "Handle natural language workspace commands like 'show email and CRM side by side' or 'open analytics in fullscreen'.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Natural language command for workspace control",
          },
        },
        required: ["command"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { command } = input as { command: string };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workspace Command', { command });

        try {
          const { foundationServices } = await import('../../foundation/services/FoundationServices');
          
          const result = foundationServices.workspace.handleWorkspaceCommand(command);
          
          if (result.success) {
            addBreadcrumb?.('Workspace Command Executed', result.data);
            return {
              ...result,
              spokenResponse: result.message
            };
          } else {
            addBreadcrumb?.('Workspace Command Failed', { message: result.message });
            return {
              success: false,
              error: result.message,
              spokenResponse: "I couldn't understand that workspace command"
            };
          }
        } catch (error: any) {
          addBreadcrumb?.('Workspace Command Error', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I'm having trouble with workspace controls"
          };
        }
      },
    }),

    tool({
      name: "resizeWorkspaceLayout",
      description:
        "Resize the workspace layout. IMPORTANT: For 'X rows of Y panes each', calculate TOTAL panels (X × Y) and pass them ALL. Example: '2 rows of 4 panes' = 2×4 = 8 panels total.",
      parameters: {
        type: "object",
        properties: {
          panelPercentages: {
            type: "array",
            description: "Array with percentage for EACH panel. CRITICAL: '2 rows of 4' needs 8 values (2×4=8), not 4! Example: [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5] for 8 panels.",
            items: {
              type: "number",
              minimum: 1,
              maximum: 99
            },
            minItems: 1,
            maxItems: 24
          },
          rows: {
            type: "number",
            description: "Number of rows for grid. MUST be set when user says 'X rows'. Example: '2 rows of 4 panes' → rows: 2 (with 8 total panels in panelPercentages).",
            minimum: 1,
            maximum: 6,
          },
          layoutPattern: {
            type: "string",
            description: "OPTIONAL - Usually leave undefined. Only use 'vertical' for explicit vertical column requests. Most layouts work with just the rows parameter.",
            enum: ["horizontal", "vertical", "grid"],
          },
          fillRemaining: {
            type: "boolean",
            description: "Whether to fill remaining space with the last panel (default: false for partial layouts)",
          },
        },
        required: ["panelPercentages"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { panelPercentages, fillRemaining, rows, layoutPattern } = input as { 
          panelPercentages: number[];
          fillRemaining?: boolean;
          rows?: number;
          layoutPattern?: 'horizontal' | 'vertical' | 'grid';
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workspace Resize', { panelPercentages, fillRemaining, rows, layoutPattern });

        try {
          const { foundationServices } = await import('../../foundation/services/FoundationServices');
          
          // Validation: Prevent conflicting parameters
          if (rows && rows > 1 && layoutPattern === 'vertical') {
            addBreadcrumb?.('Parameter Conflict', { rows, layoutPattern });
            return {
              success: false,
              error: 'Cannot use vertical layout with multiple rows',
              spokenResponse: `I can't create a vertical layout with ${rows} rows. For a ${rows}-row grid, I'll use the standard grid layout instead.`,
              // Auto-correct by removing the conflicting layoutPattern
              suggestion: { panelPercentages, rows, layoutPattern: undefined }
            };
          }
          
          // Validation: Check if panel count matches intended grid
          if (rows && rows > 1) {
            const expectedPanels = rows * Math.ceil(panelPercentages.length / rows) * rows;
            if (panelPercentages.length < expectedPanels / 2) {
              // Likely missing panels - user might have said "2 rows of 4" but only passed 4 panels
              addBreadcrumb?.('Insufficient Panels for Grid', { 
                provided: panelPercentages.length, 
                rows, 
                likely_intended: expectedPanels 
              });
              return {
                success: false,
                error: `For ${rows} rows, you need more panels. You provided ${panelPercentages.length} panels.`,
                spokenResponse: `For a ${rows}-row layout, I need more panels. You gave me ${panelPercentages.length} panels, but for ${rows} rows with multiple columns, you'd need at least ${rows * 2} panels.`,
                suggestion: `If you want ${rows} rows of ${Math.ceil(panelPercentages.length)} panels each, pass ${rows * panelPercentages.length} total panels.`
              };
            }
          }
          
          // Calculate empty space
          const total = panelPercentages.reduce((sum, p) => sum + p, 0);
          let emptySpace = 100 - total;
          
          // If fillRemaining is true and there's only one panel, add a second panel with remaining space
          const finalPercentages = [...panelPercentages];
          if (fillRemaining && panelPercentages.length === 1 && emptySpace > 0) {
            finalPercentages.push(emptySpace);
            emptySpace = 0;
          }
          
          // Validate total doesn't exceed 100% (only for single-row layouts)
          if (!rows || rows === 1) {
            if (total > 100) {
              addBreadcrumb?.('Invalid Proportions', { total, panelPercentages });
              return {
                success: false,
                error: `Total percentages (${total}%) exceed 100%`,
                spokenResponse: `The total of all panels can't exceed 100 percent. You specified ${total} percent total.`
              };
            }
          }
          
          // Apply the proportional layout with row configuration
          foundationServices.workspace.createProportionalLayout(finalPercentages, rows, layoutPattern);
          
          addBreadcrumb?.('Layout Resized', { 
            panelPercentages: finalPercentages,
            emptySpace
          });
          
          // Generate response message
          let message = '';
          let spokenResponse = '';
          
          const panelCount = finalPercentages.length;
          const actualRows = rows || 1;
          
          // Handle multi-row layouts
          if (actualRows > 1) {
            const cols = Math.ceil(panelCount / actualRows);
            
            if (layoutPattern === 'vertical') {
              message = `Created vertical stack of ${panelCount} panels`;
              spokenResponse = `I've stacked ${panelCount} panels vertically`;
            } else if (layoutPattern === 'grid' || actualRows > 1) {
              message = `Created ${actualRows}x${cols} grid layout with ${panelCount} panels`;
              spokenResponse = `I've created a ${actualRows} by ${cols} grid with ${panelCount} panels`;
            }
            
            if (finalPercentages.every(p => p === finalPercentages[0])) {
              spokenResponse += `, all equal size`;
            } else {
              spokenResponse += ` with sizes ${finalPercentages.join(', ')} percent`;
            }
          } 
          // Single row layouts (existing logic)
          else if (panelCount === 1) {
            message = `Created single panel at ${finalPercentages[0]}%`;
            spokenResponse = `I've created a single panel using ${finalPercentages[0]} percent of the workspace`;
          } else if (panelCount === 2) {
            if (emptySpace > 0) {
              message = `Created partial layout: ${finalPercentages.join('/')} with ${emptySpace}% empty`;
              spokenResponse = `I've set up a partial layout using ${finalPercentages[0]} and ${finalPercentages[1]} percent, leaving ${emptySpace} percent empty for future use`;
            } else {
              message = `Resized layout to ${finalPercentages.join('/')}`;
              spokenResponse = `I've resized the layout to ${finalPercentages[0]} percent on the left and ${finalPercentages[1]} percent on the right`;
            }
          } else if (panelCount === 3) {
            message = `Created 3-panel layout: ${finalPercentages.join('/')}`;
            spokenResponse = `I've created a three-panel layout with ${finalPercentages.join(', ')} percent`;
          } else if (panelCount === 4) {
            message = `Created 4-panel layout: ${finalPercentages.join('/')}`;
            spokenResponse = `I've created a four-panel layout with ${finalPercentages.join(', ')} percent`;
          } else {
            message = `Created ${panelCount}-panel layout: ${finalPercentages.join('/')}`;
            spokenResponse = `I've created a ${panelCount}-panel layout with the percentages ${finalPercentages.join(', ')}`;
          }
          
          if (emptySpace > 0 && panelCount > 1 && actualRows === 1) {
            spokenResponse += `, leaving ${emptySpace} percent empty`;
          }
          
          return {
            success: true,
            panelPercentages: finalPercentages,
            panelCount,
            rows: actualRows,
            layoutPattern: layoutPattern || 'horizontal',
            emptySpace,
            message,
            spokenResponse
          };
        } catch (error: any) {
          addBreadcrumb?.('Resize Error', { error: error.message });
          return {
            success: false,
            error: error.message,
            spokenResponse: "I couldn't resize the workspace layout"
          };
        }
      },
    }),

    tool({
      name: "getDashboardState",
      description:
        "MANDATORY tool for answering ANY question about dashboard metrics, activities, or system status. MUST be called BEFORE answering questions like 'what are the metrics?', 'how is the system doing?', 'what activities happened?'. Provides complete dashboard data state.",
      parameters: {
        type: "object",
        properties: {
          includeMetrics: {
            type: "boolean",
            description: "Whether to include metrics data (default: true)",
          },
          includeActivities: {
            type: "boolean",
            description: "Whether to include recent activities (default: true)",
          },
          includeSystemStatus: {
            type: "boolean",
            description: "Whether to include system status (default: true)",
          },
          activityLimit: {
            type: "number",
            description: "Number of recent activities to include (default: 10)",
          }
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { includeMetrics = true, includeActivities = true, includeSystemStatus = true, activityLimit = 10 } = input || {};
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Dashboard State Query', { includeMetrics, includeActivities, includeSystemStatus });

        try {
          // Import the service dynamically to avoid circular dependencies
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          // Get complete dashboard state
          const state = workspaceDataService.getState();
          
          // Build response based on requested data
          const response: any = {
            success: true,
            summary: state.summary
          };
          
          if (includeMetrics) {
            response.metrics = state.metrics;
          }
          
          if (includeActivities) {
            response.activities = state.activities.slice(0, activityLimit);
          }
          
          if (includeSystemStatus) {
            response.systemStatus = state.systemStatus;
          }
          
          // Generate human-readable summary
          const metricsSummary = includeMetrics 
            ? `${state.summary.totalMetrics} metrics tracked, ${state.summary.criticalMetrics} critical` 
            : "";
          const activitiesSummary = includeActivities 
            ? `${response.activities.length} recent activities` 
            : "";
          const systemSummary = includeSystemStatus 
            ? `System health: ${state.summary.systemHealth.overall} (${state.summary.systemHealth.avgHealth.toFixed(1)}%)` 
            : "";
          
          response.humanSummary = [metricsSummary, activitiesSummary, systemSummary]
            .filter(s => s)
            .join(", ");
          
          addBreadcrumb?.('Dashboard State Retrieved', { 
            metricsCount: state.metrics.length,
            activitiesCount: response.activities?.length,
            systemHealth: state.summary.systemHealth.overall
          });
          
          return response;
          
        } catch (error: any) {
          addBreadcrumb?.('Dashboard State Query Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            humanSummary: "I'm having trouble accessing the dashboard data right now"
          };
        }
      },
    }),

    tool({
      name: "manageDashboardData",
      description:
        "Tool for managing dashboard data - refresh metrics, query specific data, filter activities, or check system health. Use this for any dashboard data manipulation or specific queries.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["refresh_metric", "refresh_all", "query_activities", "system_health", "filter_activities", "add_activity"],
            description: "The action to perform on dashboard data",
          },
          metricId: {
            type: "string",
            description: "ID of specific metric for refresh_metric action",
          },
          activityFilter: {
            type: "object",
            properties: {
              type: {
                type: "array",
                items: { type: "string" },
                description: "Filter by activity types",
              },
              severity: {
                type: "array",
                items: { type: "string" },
                description: "Filter by severity levels",
              },
              search: {
                type: "string",
                description: "Search term for activity messages",
              }
            },
            description: "Filter criteria for activities",
          },
          activityMessage: {
            type: "string",
            description: "Message for add_activity action",
          },
          activityType: {
            type: "string",
            enum: ["voice", "system", "dashboard", "performance", "security", "user"],
            description: "Type for add_activity action",
          }
        },
        required: ["action"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { action, metricId, activityFilter, activityMessage, activityType } = input;
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Dashboard Data Management', { action, metricId, activityFilter });

        try {
          // Import the service dynamically
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          const result: any = { success: true };
          
          switch (action) {
            case 'refresh_metric':
              if (!metricId) {
                throw new Error('Metric ID required for refresh_metric action');
              }
              await workspaceDataService.refreshMetric(metricId);
              const metric = workspaceDataService.getMetric(metricId);
              result.message = `Refreshed ${metric?.label}`;
              result.metric = metric;
              break;
              
            case 'refresh_all':
              await workspaceDataService.refreshAllMetrics();
              result.message = "All metrics refreshed";
              result.metrics = workspaceDataService.getAllMetrics();
              break;
              
            case 'query_activities':
              if (activityFilter) {
                result.activities = workspaceDataService.getFilteredActivities(activityFilter);
                result.message = `Found ${result.activities.length} matching activities`;
              } else {
                result.activities = workspaceDataService.getRecentActivities(10);
                result.message = `Retrieved ${result.activities.length} recent activities`;
              }
              break;
              
            case 'system_health':
              const health = workspaceDataService.getSystemHealthSummary();
              result.systemHealth = health;
              result.message = `System is ${health.overall} with ${health.avgHealth.toFixed(1)}% average health`;
              if (health.issues.length > 0) {
                result.message += `. ${health.issues.length} services need attention`;
              }
              break;
              
            case 'filter_activities':
              if (!activityFilter) {
                throw new Error('Activity filter required for filter_activities action');
              }
              result.activities = workspaceDataService.getFilteredActivities(activityFilter);
              result.message = `Found ${result.activities.length} activities matching your criteria`;
              break;
              
            case 'add_activity':
              if (!activityMessage || !activityType) {
                throw new Error('Activity message and type required for add_activity action');
              }
              workspaceDataService.addActivity({
                type: activityType,
                message: activityMessage,
                severity: 'info'
              });
              result.message = "Activity logged";
              break;
              
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          addBreadcrumb?.('Dashboard Data Action Completed', { action, result: result.message });
          return result;
          
        } catch (error: any) {
          addBreadcrumb?.('Dashboard Data Action Failed', { action, error: error.message });
          return {
            success: false,
            error: error.message,
            message: `Couldn't ${action.replace('_', ' ')}: ${error.message}`
          };
        }
      },
    }),
    
    // Form state query tool
    tool({
      name: "getFormState",
      description: "MANDATORY tool for answering ANY question about forms, field values, validation states, or form settings. Checks the current state of forms in the dashboard. Always use this before discussing form data or settings.",
      parameters: {
        type: "object",
        properties: {
          formId: {
            type: "string",
            description: "ID of the form to check. Use 'profile' for profile settings, 'settings' for system settings, or 'all' to get all forms.",
            enum: ["profile", "settings", "all"]
          }
        },
        additionalProperties: false,
        required: []
      },
      execute: async (input: any, context: any) => {
        const { formId = 'all' } = input as { formId?: string };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Form State Query', { formId });
        
        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          if (formId === 'all') {
            const allForms = workspaceDataService.getAllFormsState();
            
            // Create summary message
            const formCount = Object.keys(allForms).length;
            const messages: string[] = [`I can see ${formCount} forms`];
            
            Object.entries(allForms).forEach(([, form]: [string, any]) => {
              const fieldCount = Object.keys(form.fields).length;
              const dirtyStatus = form.isDirty ? ' with unsaved changes' : '';
              const validStatus = form.isValid ? '' : ' (has validation errors)';
              messages.push(`${form.name}: ${fieldCount} fields${dirtyStatus}${validStatus}`);
            });
            
            return {
              success: true,
              forms: allForms,
              message: messages.join('. ')
            };
          } else {
            const formState = workspaceDataService.getFormState(formId);
            
            if (!formState) {
              return {
                success: false,
                error: `Form ${formId} not found`,
                message: `I couldn't find a form with ID "${formId}"`
              };
            }
            
            // Get form definition for better context
            const allForms = workspaceDataService.getAllFormsState();
            const formDetails = allForms[formId];
            
            // Create summary of form state
            const fieldCount = formState.fields.size;
            const filledFields = Array.from(formState.fields.values()).filter(f => f.value).length;
            // const touchedFields = Array.from(formState.fields.values()).filter(f => f.touched).length;
            
            let message = `${formDetails.name} has ${fieldCount} fields`;
            if (filledFields > 0) {
              message += `, ${filledFields} filled`;
            }
            if (formState.isDirty) {
              message += `, with unsaved changes`;
            }
            if (!formState.isValid) {
              message += ` (validation errors present)`;
            }
            
            return {
              success: true,
              formState: formDetails,
              message
            };
          }
        } catch (error: any) {
          addBreadcrumb?.('Form State Query Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "I couldn't check the form state right now"
          };
        }
      }
    }),
    
    // Form control tool
    tool({
      name: "controlForm",
      description: "Control forms in the dashboard - fill fields, submit forms, reset forms. Use after checking state with getFormState.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The form action to perform",
            enum: ["fill_field", "submit", "reset", "validate"]
          },
          formId: {
            type: "string",
            description: "ID of the form to control",
            enum: ["profile", "settings"]
          },
          fieldId: {
            type: "string",
            description: "ID of the field to fill (required for fill_field action)"
          },
          value: {
            type: "string",
            description: "Value to set for the field (required for fill_field action)"
          }
        },
        additionalProperties: false,
        required: []
      },
      execute: async (input: any, context: any) => {
        const { action, formId, fieldId, value } = input as {
          action: string;
          formId: string;
          fieldId?: string;
          value?: string;
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Form Control Request', { action, formId, fieldId, value });
        
        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          let result: any = { success: false, message: '' };
          
          switch (action) {
            case 'fill_field':
              if (!fieldId || value === undefined) {
                throw new Error('Field ID and value required for fill_field action');
              }
              const fillResult = workspaceDataService.setFieldValue(formId, fieldId, value);
              result = {
                success: fillResult.success,
                message: fillResult.message
              };
              break;
              
            case 'submit':
              const submitResult = await workspaceDataService.submitForm(formId);
              result = {
                success: submitResult.success,
                message: submitResult.message,
                data: submitResult.data
              };
              break;
              
            case 'reset':
              const resetResult = workspaceDataService.resetForm(formId);
              result = {
                success: resetResult.success,
                message: resetResult.message
              };
              break;
              
            case 'validate':
              const formState = workspaceDataService.getFormState(formId);
              if (!formState) {
                throw new Error(`Form ${formId} not found`);
              }
              
              const invalidFields = Array.from(formState.fields.entries())
                .filter(([, field]) => !field.isValid)
                .map(([id, field]) => ({ id, error: field.errorMessage }));
              
              if (invalidFields.length === 0) {
                result = {
                  success: true,
                  message: 'All fields are valid',
                  isValid: true
                };
              } else {
                result = {
                  success: true,
                  message: `${invalidFields.length} field(s) have validation errors`,
                  isValid: false,
                  invalidFields
                };
              }
              break;
              
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          addBreadcrumb?.('Form Control Completed', { action, result: result.message });
          return result;
          
        } catch (error: any) {
          addBreadcrumb?.('Form Control Failed', { action, error: error.message });
          return {
            success: false,
            error: error.message,
            message: `Couldn't ${action.replace('_', ' ')}: ${error.message}`
          };
        }
      }
    }),

    tool({
      name: "getWidgetState",
      description:
        "MANDATORY tool for checking widget states. MUST be called BEFORE answering questions about widgets like 'what widgets are visible?', 'are widgets expanded?', 'list the widgets'. NEVER rely on memory for widget state.",
      parameters: {
        type: "object",
        properties: {
          widgetId: {
            type: "string",
            description: "Optional specific widget ID to check. Leave empty to get all widgets.",
          },
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { widgetId } = input as { widgetId?: string };
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Widget State Query', { widgetId });

        try {
          // Import the service dynamically
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          if (widgetId) {
            // Get specific widget state
            const widget = workspaceDataService.getWidgetState(widgetId);
            if (!widget) {
              return {
                success: false,
                message: `Widget ${widgetId} not found`,
              };
            }
            
            addBreadcrumb?.('Widget State Retrieved', widget);
            
            return {
              success: true,
              widget,
              message: `${widget.name} is ${widget.isVisible ? 'visible' : 'hidden'} and ${widget.isExpanded ? 'expanded' : 'collapsed'}`,
            };
          } else {
            // Get all widgets
            const widgets = workspaceDataService.getAllWidgets();
            const visibleCount = widgets.filter(w => w.isVisible).length;
            const expandedCount = widgets.filter(w => w.isExpanded).length;
            
            addBreadcrumb?.('All Widgets Retrieved', { count: widgets.length });
            
            return {
              success: true,
              widgets,
              summary: {
                total: widgets.length,
                visible: visibleCount,
                expanded: expandedCount,
              },
              message: `You have ${widgets.length} widgets: ${visibleCount} visible, ${expandedCount} expanded`,
            };
          }
        } catch (error: any) {
          addBreadcrumb?.('Widget State Query Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "I'm having trouble checking the widgets right now",
          };
        }
      },
    }),

    tool({
      name: "executeDashboardWorkflow",
      description:
        "Execute multi-step workflows on the dashboard. Use this for complex commands that involve multiple actions.",
      parameters: {
        type: "object",
        properties: {
          workflowId: {
            type: "string",
            description: "ID of the workflow to execute (e.g., 'morning-routine', 'cleanup-view')",
          },
          customSteps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["widget", "form", "data", "navigation", "wait"],
                  description: "Type of workflow step",
                },
                action: {
                  type: "string",
                  description: "Action to perform",
                },
                parameters: {
                  type: "object",
                  description: "Parameters for the action",
                },
              },
            },
            description: "Custom workflow steps to execute (if not using a predefined workflow)",
          },
          variables: {
            type: "object",
            description: "Variables to pass to the workflow",
          },
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { workflowId, customSteps, variables } = input as {
          workflowId?: string;
          customSteps?: any[];
          variables?: Record<string, any>;
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workflow Execution', { workflowId, customSteps });

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          if (workflowId) {
            // Execute predefined workflow
            const result = await workspaceDataService.executeWorkflow(workflowId, variables);
            return {
              success: result.success,
              message: result.message,
              execution: result.execution,
            };
          } else if (customSteps && customSteps.length > 0) {
            // Create and execute custom workflow
            const customWorkflow = {
              id: `custom-${Date.now()}`,
              name: 'Custom Voice Workflow',
              description: 'Workflow created from voice command',
              steps: customSteps.map((step, index) => ({
                id: `step-${index + 1}`,
                type: step.type,
                action: step.action,
                parameters: step.parameters || {},
                description: `${step.type} action: ${step.action}`,
              })),
            };
            
            workspaceDataService.createWorkflow(customWorkflow);
            const result = await workspaceDataService.executeWorkflow(customWorkflow.id, variables);
            
            return {
              success: result.success,
              message: result.message,
              execution: result.execution,
            };
          } else {
            return {
              success: false,
              message: "Either workflowId or customSteps must be provided",
            };
          }
        } catch (error: any) {
          addBreadcrumb?.('Workflow Execution Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't execute the workflow",
          };
        }
      },
    }),

    tool({
      name: "batchControlWidgets",
      description:
        "Control multiple widgets at once. Use this for commands that affect multiple widgets simultaneously.",
      parameters: {
        type: "object",
        properties: {
          operations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                widgetId: {
                  type: "string",
                  description: "Widget ID to control",
                },
                action: {
                  type: "string",
                  enum: ["show", "hide", "expand", "collapse", "refresh"],
                  description: "Action to perform on the widget",
                },
              },
              required: ["widgetId", "action"],
            },
            description: "List of widget operations to perform",
          },
        },
        required: ["operations"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { operations } = input as {
          operations: Array<{ widgetId: string; action: "show" | "hide" | "expand" | "collapse" | "refresh" }>;
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Batch Widget Control', { operations });

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          const result = workspaceDataService.batchControlWidgets(operations);
          
          return {
            success: result.success,
            message: result.message,
            results: result.results,
          };
        } catch (error: any) {
          addBreadcrumb?.('Batch Widget Control Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't perform batch widget operations",
          };
        }
      },
    }),

    tool({
      name: "searchDashboard",
      description:
        "Search across all dashboard data including metrics, activities, widgets, and forms.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string",
          },
          scope: {
            type: "array",
            items: {
              type: "string",
              enum: ["metrics", "activities", "forms", "widgets", "all"],
            },
            description: "Scope of the search (default: all)",
          },
          filters: {
            type: "object",
            properties: {
              severity: {
                type: "array",
                items: { type: "string" },
                description: "Filter by severity levels",
              },
              timeRange: {
                type: "object",
                properties: {
                  startHoursAgo: {
                    type: "number",
                    description: "Start time in hours ago",
                  },
                  endHoursAgo: {
                    type: "number",
                    description: "End time in hours ago (0 for now)",
                  },
                },
                description: "Time range filter",
              },
            },
            description: "Additional filters for the search",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
          },
          sortBy: {
            type: "string",
            enum: ["relevance", "date", "name"],
            description: "How to sort the results",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { query, scope = ['all'], filters, limit = 10, sortBy = 'relevance' } = input as {
          query: string;
          scope?: ("metrics" | "activities" | "all" | "forms" | "widgets")[];
          filters?: any;
          limit?: number;
          sortBy?: 'relevance' | 'date' | 'name';
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Dashboard Search', { query, scope, filters });

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          // Convert time range if provided
          let searchFilters = filters;
          if (filters?.timeRange) {
            const now = new Date();
            const start = new Date(now.getTime() - (filters.timeRange.startHoursAgo * 3600000));
            const end = filters.timeRange.endHoursAgo === 0 
              ? now 
              : new Date(now.getTime() - (filters.timeRange.endHoursAgo * 3600000));
            
            searchFilters = {
              ...filters,
              timeRange: { start, end },
            };
          }
          
          const results = workspaceDataService.searchDashboard({
            query,
            scope,
            filters: searchFilters,
            limit,
            sortBy,
          });
          
          const summary = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`;
          
          return {
            success: true,
            message: summary,
            results,
            count: results.length,
          };
        } catch (error: any) {
          addBreadcrumb?.('Dashboard Search Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't search the dashboard",
          };
        }
      },
    }),

    tool({
      name: "createDashboardMacro",
      description:
        "Create a reusable macro from a sequence of dashboard commands that can be triggered by voice.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the macro",
          },
          description: {
            type: "string",
            description: "Description of what the macro does",
          },
          voiceTriggers: {
            type: "array",
            items: { type: "string" },
            description: "Voice phrases that will trigger this macro",
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["widget", "form", "data", "navigation", "wait"],
                },
                action: {
                  type: "string",
                },
                parameters: {
                  type: "object",
                },
              },
            },
            description: "Steps that make up the macro",
          },
        },
        required: ["name", "voiceTriggers", "steps"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { name, description, voiceTriggers, steps } = input as {
          name: string;
          description?: string;
          voiceTriggers: string[];
          steps: any[];
        };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Create Macro', { name, voiceTriggers });

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          // Create workflow for the macro
          const workflow = {
            id: `macro-${Date.now()}`,
            name,
            description: description || `Macro: ${name}`,
            steps: steps.map((step, index) => ({
              id: `step-${index + 1}`,
              type: step.type,
              action: step.action,
              parameters: step.parameters || {},
              description: `${step.type} action: ${step.action}`,
            })),
            createdAt: new Date(),
            usageCount: 0
          };
          
          workspaceDataService.createWorkflow(workflow);
          
          // Create the macro
          const macro = {
            id: `macro-${Date.now()}`,
            name,
            description: description || `Voice macro: ${name}`,
            voiceTriggers,
            workflow,
            isEnabled: true,
            createdAt: new Date(),
            usageCount: 0
          };
          
          const result = workspaceDataService.createMacro(macro);
          
          return {
            success: result.success,
            message: result.message,
            macroId: result.macroId,
          };
        } catch (error: any) {
          addBreadcrumb?.('Create Macro Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't create the macro",
          };
        }
      },
    }),

    tool({
      name: "executeMacro",
      description:
        "Execute a previously created macro by its voice trigger or ID.",
      parameters: {
        type: "object",
        properties: {
          trigger: {
            type: "string",
            description: "Voice trigger phrase or macro ID",
          },
        },
        required: ["trigger"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { trigger } = input as { trigger: string };
        
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Execute Macro', { trigger });

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          const result = await workspaceDataService.executeMacroByTrigger(trigger);
          
          return {
            success: result.success,
            message: result.message,
          };
        } catch (error: any) {
          addBreadcrumb?.('Execute Macro Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't execute the macro",
          };
        }
      },
    }),

    tool({
      name: "getDashboardSummary",
      description:
        "Get a comprehensive summary of the entire dashboard state including metrics, activities, widgets, forms, and workflows.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Dashboard Summary Request', {});

        try {
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          const summary = workspaceDataService.getDashboardSummary();
          
          // Generate human-readable summary
          const messages: string[] = [];
          
          messages.push(`${summary.metrics.total} metrics tracked`);
          if (summary.metrics.critical > 0) {
            messages.push(`${summary.metrics.critical} critical metrics need attention`);
          }
          
          messages.push(`${summary.activities.recent} recent activities`);
          if (summary.activities.errors > 0) {
            messages.push(`${summary.activities.errors} errors detected`);
          }
          
          messages.push(`${summary.widgets.visible} of ${summary.widgets.total} widgets visible`);
          
          if (summary.forms.invalid > 0) {
            messages.push(`${summary.forms.invalid} forms have validation errors`);
          }
          
          if (summary.workflows.running) {
            messages.push('A workflow is currently running');
          }
          
          messages.push(`System health: ${summary.system.health} (${summary.system.uptime}% uptime)`);
          
          return {
            success: true,
            message: messages.join('. '),
            summary,
          };
        } catch (error: any) {
          addBreadcrumb?.('Dashboard Summary Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't get dashboard summary",
          };
        }
      },
    }),

    tool({
      name: "getSmartSuggestions",
      description:
        "Get intelligent suggestions based on user context, time of day, and usage patterns. Returns context-aware recommendations.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Smart Suggestions Request', {});

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          const suggestions = integrationService.getSmartSuggestions();
          const userContext = integrationService.getUserContext();
          
          if (suggestions.length === 0) {
            return {
              success: true,
              suggestions: [],
              context: userContext,
              message: "No suggestions available at this time"
            };
          }
          
          // Format suggestions for voice response
          const formattedSuggestions = suggestions.map(s => ({
            suggestion: s.suggestion,
            reason: s.reason,
            confidence: Math.round(s.confidence * 100),
            id: s.id
          }));
          
          const topSuggestion = suggestions[0];
          const message = `Based on the ${userContext.timeOfDay} and your patterns, I suggest: ${topSuggestion.suggestion}. ${topSuggestion.reason}.`;
          
          addBreadcrumb?.('Smart Suggestions Retrieved', { count: suggestions.length });
          
          return {
            success: true,
            suggestions: formattedSuggestions,
            context: userContext,
            message,
            topSuggestionId: topSuggestion.id
          };
        } catch (error: any) {
          addBreadcrumb?.('Smart Suggestions Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't get smart suggestions"
          };
        }
      },
    }),

    tool({
      name: "acceptSmartSuggestion",
      description:
        "Execute a smart suggestion that was previously offered. Accepts the suggestion ID.",
      parameters: {
        type: "object",
        properties: {
          suggestionId: {
            type: "string",
            description: "The ID of the suggestion to execute"
          }
        },
        required: ["suggestionId"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { suggestionId } = input as { suggestionId: string };
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Accept Smart Suggestion', { suggestionId });

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          const result = await integrationService.executeSuggestion(suggestionId);
          
          addBreadcrumb?.('Smart Suggestion Executed', { suggestionId, result });
          
          return {
            success: true,
            message: "Suggestion executed successfully",
            result
          };
        } catch (error: any) {
          addBreadcrumb?.('Smart Suggestion Execution Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: `Couldn't execute suggestion: ${error.message}`
          };
        }
      },
    }),

    tool({
      name: "getPerformanceStatus",
      description:
        "Get current performance metrics and optimization status of the dashboard.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Performance Status Request', {});

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          const metrics = integrationService.getPerformanceMetrics();
          const preferences = integrationService.getUserPreferences();
          
          // Generate performance summary
          const avgResponseTime = Math.round(metrics.averageResponseTime);
          const performanceLevel = 
            avgResponseTime < 500 ? 'excellent' :
            avgResponseTime < 1000 ? 'good' :
            avgResponseTime < 2000 ? 'fair' : 'needs improvement';
          
          const message = `Performance is ${performanceLevel}. Average response time: ${avgResponseTime}ms. ` +
            `Mode: ${preferences.performanceMode}. ` +
            `Success rate: ${Math.round(metrics.successRate)}%.`;
          
          addBreadcrumb?.('Performance Status Retrieved', metrics);
          
          return {
            success: true,
            metrics,
            performanceMode: preferences.performanceMode,
            performanceLevel,
            message
          };
        } catch (error: any) {
          addBreadcrumb?.('Performance Status Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't get performance status"
          };
        }
      },
    }),

    tool({
      name: "optimizePerformance",
      description:
        "Optimize dashboard performance based on the specified mode: performance, battery, or balanced.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["performance", "battery", "balanced"],
            description: "The performance mode to set"
          }
        },
        required: ["mode"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { mode } = input as { mode: 'performance' | 'battery' | 'balanced' };
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Optimize Performance', { mode });

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          // Update preferences
          integrationService.updateUserPreferences({ performanceMode: mode });
          
          // Apply optimizations
          integrationService.optimizePerformance();
          
          const modeDescriptions = {
            performance: "Maximum speed with faster refresh rates",
            battery: "Reduced resource usage for longer battery life",
            balanced: "Optimal balance between speed and efficiency"
          };
          
          addBreadcrumb?.('Performance Optimized', { mode });
          
          return {
            success: true,
            mode,
            message: `Switched to ${mode} mode. ${modeDescriptions[mode]}.`
          };
        } catch (error: any) {
          addBreadcrumb?.('Performance Optimization Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: `Couldn't optimize performance: ${error.message}`
          };
        }
      },
    }),

    tool({
      name: "learnUserBehavior",
      description:
        "Record user behavior patterns to improve future suggestions and automations.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The action performed by the user"
          },
          context: {
            type: "object",
            description: "Additional context about the action"
          }
        },
        required: ["action"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { action, context: actionContext } = input as { action: string; context?: any };
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Learn User Behavior', { action, context: actionContext });

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          integrationService.learnUserBehavior(action, actionContext || {});
          
          addBreadcrumb?.('User Behavior Learned', { action });
          
          return {
            success: true,
            message: "Learning from your actions to improve future suggestions"
          };
        } catch (error: any) {
          addBreadcrumb?.('Learn Behavior Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't record behavior pattern"
          };
        }
      },
    }),

    tool({
      name: "getWorkflowAnalytics",
      description:
        "Get analytics and insights about workflow usage patterns and success rates.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Workflow Analytics Request', {});

        try {
          const { integrationService } = await import('../../foundation/services/IntegrationService');
          
          const analytics = integrationService.getWorkflowAnalytics();
          
          if (analytics.length === 0) {
            return {
              success: true,
              analytics: [],
              message: "No workflow analytics available yet. Run some workflows to see insights."
            };
          }
          
          // Find most used workflow
          const mostUsed = analytics.reduce((prev, current) => 
            current.executionCount > prev.executionCount ? current : prev
          );
          
          // Calculate overall success rate
          const overallSuccess = analytics.reduce((sum, w) => sum + w.successRate, 0) / analytics.length;
          
          const message = `You've run ${analytics.length} different workflows. ` +
            `Most used: ${mostUsed.workflowId} (${mostUsed.executionCount} times). ` +
            `Overall success rate: ${Math.round(overallSuccess)}%.`;
          
          addBreadcrumb?.('Workflow Analytics Retrieved', { count: analytics.length });
          
          return {
            success: true,
            analytics,
            mostUsed: mostUsed.workflowId,
            overallSuccessRate: Math.round(overallSuccess),
            message
          };
        } catch (error: any) {
          addBreadcrumb?.('Workflow Analytics Failed', { error: error.message });
          return {
            success: false,
            error: error.message,
            message: "Couldn't get workflow analytics"
          };
        }
      },
    }),

    tool({
      name: "controlWidget",
      description:
        "Controls dashboard widgets - show/hide, expand/collapse, refresh, reorder, or filter them based on user requests.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["show", "hide", "expand", "collapse", "toggle_visibility", "toggle_expansion", "refresh", "reorder", "filter", "clear_filter"],
            description: "Action to perform on the widget(s)",
          },
          widgetId: {
            type: "string",
            description: "The widget ID to control (e.g., 'metrics-widget', 'activities-widget', 'status-widget', 'performance-chart')",
          },
          widgetOrder: {
            type: "array",
            items: { type: "string" },
            description: "New order for widgets (used with 'reorder' action)",
          },
          filter: {
            type: "object",
            properties: {
              visibility: {
                type: "string",
                enum: ["all", "visible", "hidden"],
                description: "Filter by visibility state",
              },
              types: {
                type: "array",
                items: { 
                  type: "string",
                  enum: ["metrics", "activities", "status", "chart", "custom"],
                },
                description: "Filter by widget types",
              },
              expandedOnly: {
                type: "boolean",
                description: "Show only expanded widgets",
              },
            },
            description: "Filter criteria (used with 'filter' action)",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
      execute: async (input: any, context: any) => {
        const { action, widgetId, widgetOrder, filter } = input as {
          action: string;
          widgetId?: string;
          widgetOrder?: string[];
          filter?: any;
        };
        
        // Add breadcrumb for debugging
        const addBreadcrumb = context?.addTranscriptBreadcrumb;
        addBreadcrumb?.('Widget Control', { action, widgetId, widgetOrder, filter });

        try {
          // Import the service dynamically
          const { workspaceDataService } = await import('../../foundation/services/WorkspaceDataService');
          
          let result: any;
          
          switch (action) {
            case 'show':
            case 'hide':
            case 'toggle_visibility':
              if (!widgetId) {
                throw new Error('Widget ID required for visibility control');
              }
              result = workspaceDataService.toggleWidget(widgetId);
              break;
              
            case 'expand':
              if (!widgetId) {
                throw new Error('Widget ID required for expand action');
              }
              result = workspaceDataService.expandWidget(widgetId);
              break;
              
            case 'collapse':
              if (!widgetId) {
                throw new Error('Widget ID required for collapse action');
              }
              result = workspaceDataService.collapseWidget(widgetId);
              break;
              
            case 'toggle_expansion':
              if (!widgetId) {
                throw new Error('Widget ID required for expansion toggle');
              }
              result = workspaceDataService.toggleWidgetExpansion(widgetId);
              break;
              
            case 'refresh':
              if (!widgetId) {
                throw new Error('Widget ID required for refresh action');
              }
              result = workspaceDataService.refreshWidget(widgetId);
              break;
              
            case 'reorder':
              if (!widgetOrder || widgetOrder.length === 0) {
                throw new Error('Widget order array required for reorder action');
              }
              result = workspaceDataService.reorderWidgets(widgetOrder);
              break;
              
            case 'filter':
              if (!filter) {
                throw new Error('Filter criteria required for filter action');
              }
              result = workspaceDataService.applyWidgetFilter(filter);
              break;
              
            case 'clear_filter':
              result = workspaceDataService.clearWidgetFilters();
              break;
              
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          addBreadcrumb?.('Widget Control Completed', { action, result: result.message });
          return result;
          
        } catch (error: any) {
          addBreadcrumb?.('Widget Control Failed', { action, error: error.message });
          return {
            success: false,
            error: error.message,
            message: `Couldn't ${action.replace('_', ' ')}: ${error.message}`,
          };
        }
      },
    }),
  ],

  handoffs: [], // Will be populated with zahraAgent in index.ts
});
