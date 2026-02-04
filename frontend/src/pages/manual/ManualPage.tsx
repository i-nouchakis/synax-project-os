import { useState } from 'react';
import {
  Book,
  LayoutDashboard,
  FolderKanban,
  Layers,
  Box,
  ClipboardCheck,
  AlertTriangle,
  Package,
  FileText,
  Settings,
  Users,
  Shield,
  HelpCircle,
  ChevronRight,
  Search,
  MapPin,
  Bell,
  Palette,
  Key,
  QrCode,
  Clock,
  Tags,
  PenTool,
  Smartphone,
  Wifi,
  WifiOff,
  Camera,
  Download,
  KeyRound,
  Building2,
  ListFilter,
  FileCheck,
  Move,
  MousePointer,
  Square,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';

type ManualSection =
  | 'overview'
  | 'dashboard'
  | 'projects'
  | 'buildings'
  | 'floors'
  | 'rooms'
  | 'assets'
  | 'checklists'
  | 'checklist-templates'
  | 'issues'
  | 'inventory'
  | 'time-tracking'
  | 'qr-scanner'
  | 'labels'
  | 'signatures'
  | 'reports'
  | 'lookups'
  | 'pwa-offline'
  | 'settings'
  | 'users'
  | 'roles'
  | 'faq';

interface Section {
  id: ManualSection;
  label: string;
  icon: React.ReactNode;
  category: string;
}

const sections: Section[] = [
  { id: 'overview', label: 'Overview', icon: <Book size={18} />, category: 'Getting Started' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, category: 'Getting Started' },
  { id: 'pwa-offline', label: 'PWA & Offline', icon: <Smartphone size={18} />, category: 'Getting Started' },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} />, category: 'Project Management' },
  { id: 'buildings', label: 'Buildings', icon: <Building2 size={18} />, category: 'Project Management' },
  { id: 'floors', label: 'Floors', icon: <Layers size={18} />, category: 'Project Management' },
  { id: 'rooms', label: 'Rooms & Floor Plans', icon: <MapPin size={18} />, category: 'Project Management' },
  { id: 'assets', label: 'Assets', icon: <Box size={18} />, category: 'Asset Management' },
  { id: 'qr-scanner', label: 'QR Scanner', icon: <QrCode size={18} />, category: 'Asset Management' },
  { id: 'checklists', label: 'Checklists', icon: <ClipboardCheck size={18} />, category: 'Field Work' },
  { id: 'checklist-templates', label: 'Checklist Templates', icon: <FileCheck size={18} />, category: 'Field Work' },
  { id: 'issues', label: 'Issues', icon: <AlertTriangle size={18} />, category: 'Field Work' },
  { id: 'inventory', label: 'Inventory', icon: <Package size={18} />, category: 'Field Work' },
  { id: 'time-tracking', label: 'Time Tracking', icon: <Clock size={18} />, category: 'Field Work' },
  { id: 'signatures', label: 'Digital Signatures', icon: <PenTool size={18} />, category: 'Field Work' },
  { id: 'reports', label: 'Reports & PDF', icon: <FileText size={18} />, category: 'Reporting' },
  { id: 'labels', label: 'Label Generation', icon: <Tags size={18} />, category: 'Reporting' },
  { id: 'lookups', label: 'Lookup Tables', icon: <ListFilter size={18} />, category: 'Administration' },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} />, category: 'Administration' },
  { id: 'users', label: 'User Management', icon: <Users size={18} />, category: 'Administration' },
  { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={18} />, category: 'Administration' },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={18} />, category: 'Help' },
];

export function ManualPage() {
  const [activeSection, setActiveSection] = useState<ManualSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Group sections by category
  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, Section[]>);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sections.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1">Manual</h1>
        <p className="text-body text-text-secondary">
          Complete user guide for the Synax application
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="lg:w-72 flex-shrink-0 lg:h-full overflow-y-auto">
          <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col">
              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={16} className="text-text-tertiary" />}
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-4 flex-1 overflow-y-auto">
                {filteredSections ? (
                  // Show filtered results
                  <div className="space-y-1">
                    {filteredSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                      >
                        {section.icon}
                        <span className="text-body">{section.label}</span>
                      </button>
                    ))}
                    {filteredSections.length === 0 && (
                      <p className="text-body-sm text-text-tertiary text-center py-4">
                        No results found
                      </p>
                    )}
                  </div>
                ) : (
                  // Show grouped navigation
                  Object.entries(groupedSections).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-caption text-text-tertiary uppercase tracking-wider mb-2 px-3">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {items.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                              activeSection === section.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                            }`}
                          >
                            {section.icon}
                            <span className="text-body">{section.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'dashboard' && <DashboardSection />}
          {activeSection === 'pwa-offline' && <PWAOfflineSection />}
          {activeSection === 'projects' && <ProjectsSection />}
          {activeSection === 'buildings' && <BuildingsSection />}
          {activeSection === 'floors' && <FloorsSection />}
          {activeSection === 'rooms' && <RoomsSection />}
          {activeSection === 'assets' && <AssetsSection />}
          {activeSection === 'qr-scanner' && <QRScannerSection />}
          {activeSection === 'checklists' && <ChecklistsSection />}
          {activeSection === 'checklist-templates' && <ChecklistTemplatesSection />}
          {activeSection === 'issues' && <IssuesSection />}
          {activeSection === 'inventory' && <InventorySection />}
          {activeSection === 'time-tracking' && <TimeTrackingSection />}
          {activeSection === 'signatures' && <SignaturesSection />}
          {activeSection === 'reports' && <ReportsSection />}
          {activeSection === 'labels' && <LabelsSection />}
          {activeSection === 'lookups' && <LookupsSection />}
          {activeSection === 'settings' && <SettingsSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'roles' && <RolesSection />}
          {activeSection === 'faq' && <FAQSection />}
        </div>
      </div>

      {/* Credits Footer */}
      <div className="mt-6 pt-4 border-t border-surface-border text-center">
        <p className="text-caption text-text-tertiary">
          Designed & Developed by{' '}
          <a
            href="https://elecnet.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Ioannis Nouchakis
          </a>
        </p>
        <p className="text-tiny text-text-tertiary mt-1">
          © 2026 Synax. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// Helper component for consistent section layout
function ManualSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</span>
          <div>
            <h2 className="text-h2">{title}</h2>
            <p className="text-body text-text-secondary font-normal mt-1">{description}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-invert max-w-none">{children}</CardContent>
    </Card>
  );
}

// Helper for step-by-step instructions
function Steps({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <div className="space-y-4 my-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-body font-bold">
            {index + 1}
          </div>
          <div>
            <h4 className="text-body font-semibold text-text-primary">{step.title}</h4>
            <p className="text-body-sm text-text-secondary">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper for feature list
function FeatureList({ features }: { features: { icon: React.ReactNode; title: string; description: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {features.map((feature, index) => (
        <div key={index} className="p-4 bg-surface-secondary rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-primary">{feature.icon}</span>
            <h4 className="text-body font-semibold text-text-primary">{feature.title}</h4>
          </div>
          <p className="text-body-sm text-text-secondary">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}

// Helper for keyboard shortcuts or tips
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg my-4">
      <p className="text-body-sm text-text-secondary flex items-start gap-2">
        <span className="text-primary mt-0.5">💡</span>
        {children}
      </p>
    </div>
  );
}

// Section Components
function OverviewSection() {
  return (
    <ManualSection
      icon={<Book size={24} />}
      title="Welcome to Synax"
      description="Complete field management system for technical installations"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Synax is a comprehensive field management application designed for managing technical
          installations, tracking assets, and coordinating field work. This manual will guide you
          through all the features and functionalities of the application.
        </p>

        <h3 className="text-h3 text-text-primary">Key Features</h3>
        <FeatureList
          features={[
            {
              icon: <FolderKanban size={20} />,
              title: 'Project Management',
              description: 'Create and manage projects with floors, rooms, and team members.',
            },
            {
              icon: <Box size={20} />,
              title: 'Asset Tracking',
              description: 'Track all assets with serial numbers, MAC addresses, and status.',
            },
            {
              icon: <ClipboardCheck size={20} />,
              title: 'Checklists',
              description: 'Complete installation checklists with photo documentation.',
            },
            {
              icon: <AlertTriangle size={20} />,
              title: 'Issue Management',
              description: 'Track and resolve issues with priority levels and comments.',
            },
            {
              icon: <Package size={20} />,
              title: 'Inventory Control',
              description: 'Manage stock levels and track material movements.',
            },
            {
              icon: <FileText size={20} />,
              title: 'Reports & PDF Export',
              description: 'Generate comprehensive reports and export to PDF.',
            },
            {
              icon: <Clock size={20} />,
              title: 'Time Tracking',
              description: 'Track work hours with timer or manual entry.',
            },
            {
              icon: <QrCode size={20} />,
              title: 'QR Scanner',
              description: 'Scan QR codes to quickly find assets.',
            },
            {
              icon: <Tags size={20} />,
              title: 'Label Generation',
              description: 'Create printable labels for cables, racks, and assets.',
            },
            {
              icon: <PenTool size={20} />,
              title: 'Digital Signatures',
              description: 'Capture signatures for handovers and approvals.',
            },
            {
              icon: <Smartphone size={20} />,
              title: 'PWA & Offline',
              description: 'Install as app and work offline with automatic sync.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Quick Start</h3>
        <Steps
          steps={[
            { title: 'Login', description: 'Use your credentials to access the application.' },
            { title: 'Navigate', description: 'Use the sidebar to access different sections.' },
            { title: 'Select a Project', description: 'Choose a project to start working on.' },
            { title: 'Explore', description: 'Browse floors, rooms, assets, and checklists.' },
          ]}
        />

        <Tip>
          Use the Dashboard for a quick overview of all your projects and pending tasks.
        </Tip>
      </div>
    </ManualSection>
  );
}

function DashboardSection() {
  return (
    <ManualSection
      icon={<LayoutDashboard size={24} />}
      title="Dashboard"
      description="Overview of your projects and key metrics"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Dashboard provides a comprehensive overview of your work, including project statistics,
          recent activity, and key performance indicators.
        </p>

        <h3 className="text-h3 text-text-primary">Statistics Cards</h3>
        <p className="text-body text-text-secondary">
          At the top of the Dashboard, you'll find summary cards showing:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Total Projects</strong> - Number of active projects</li>
          <li><strong>Total Floors</strong> - All floors across projects</li>
          <li><strong>Total Rooms</strong> - All rooms in the system</li>
          <li><strong>Total Assets</strong> - Tracked equipment and devices</li>
          <li><strong>Open Issues</strong> - Issues requiring attention</li>
          <li><strong>Checklist Completion</strong> - Overall progress percentage</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Recent Activity</h3>
        <p className="text-body text-text-secondary">
          The activity feed shows the latest actions in the system, including new issues,
          completed checklists, and asset updates.
        </p>

        <Tip>
          The Dashboard updates automatically. Check it regularly to stay informed about project progress.
        </Tip>
      </div>
    </ManualSection>
  );
}

function ProjectsSection() {
  return (
    <ManualSection
      icon={<FolderKanban size={24} />}
      title="Projects"
      description="Create and manage installation projects"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Projects are the top-level organizational unit in Synax. Each project represents
          a complete installation site (e.g., a hotel, office building, or data center).
        </p>

        <h3 className="text-h3 text-text-primary">Creating a Project</h3>
        <Steps
          steps={[
            { title: 'Click "New Project"', description: 'From the Projects page, click the button in the top right.' },
            { title: 'Enter Details', description: 'Fill in the project name, description, client name, and address.' },
            { title: 'Set Dates', description: 'Define the start and expected end dates.' },
            { title: 'Save', description: 'Click "Create Project" to save.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Project Card</h3>
        <p className="text-body text-text-secondary">
          Each project card displays:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Project name and status badge</li>
          <li>Client name</li>
          <li>Number of floors and rooms</li>
          <li>Creation date and timeline</li>
          <li>Progress indicator</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Team Members</h3>
        <p className="text-body text-text-secondary">
          In the project detail page, you can manage team members:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Add team members from the user list</li>
          <li>Assign roles (PM, Technician, etc.)</li>
          <li>Remove members when needed</li>
        </ul>

        <Tip>
          Only team members assigned to a project can view and modify its data.
        </Tip>
      </div>
    </ManualSection>
  );
}

function BuildingsSection() {
  return (
    <ManualSection
      icon={<Building2 size={24} />}
      title="Buildings"
      description="Organize large projects with multiple buildings"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Buildings are an organizational layer between Projects and Floors. For large projects
          (like hotels or campus sites), you can create multiple buildings, each with its own floors.
        </p>

        <h3 className="text-h3 text-text-primary">Project Hierarchy</h3>
        <div className="p-4 bg-surface-secondary rounded-lg my-4">
          <p className="text-body text-text-primary font-mono text-center">
            Project → Building → Floor → Room → Asset
          </p>
        </div>

        <h3 className="text-h3 text-text-primary">Creating a Building</h3>
        <Steps
          steps={[
            { title: 'Open Project', description: 'Navigate to the project detail page.' },
            { title: 'Click "Add Building"', description: 'Use the button in the Buildings section.' },
            { title: 'Enter Details', description: 'Provide building name and optional description.' },
            { title: 'Save', description: 'Click "Create" to save the building.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Buildings Page</h3>
        <p className="text-body text-text-secondary">
          The Buildings page shows all buildings across all projects:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Buildings grouped by project (accordion view)</li>
          <li>Search to filter buildings by name or project</li>
          <li>Click a building to see its floors</li>
          <li>Quick stats showing floor and room counts</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Building Detail Page</h3>
        <p className="text-body text-text-secondary">
          From the building detail page you can:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>View and manage floors within the building</li>
          <li>See total room and asset counts</li>
          <li>Navigate to individual floors</li>
        </ul>

        <Tip>
          For simple projects with just one building, you can still use the hierarchy.
          The building layer helps organize larger, multi-structure projects.
        </Tip>
      </div>
    </ManualSection>
  );
}

function FloorsSection() {
  return (
    <ManualSection
      icon={<Layers size={24} />}
      title="Floors"
      description="Manage building floors and floor plans"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Floors represent the physical levels within a building. Each floor can have its own
          floor plan and contains multiple rooms. Floors belong to a Building within a Project.
        </p>

        <h3 className="text-h3 text-text-primary">Adding a Floor</h3>
        <Steps
          steps={[
            { title: 'Open Building', description: 'Navigate to the building detail page.' },
            { title: 'Click "Add Floor"', description: 'Use the button in the Floors section.' },
            { title: 'Enter Details', description: 'Provide floor name and level number (e.g., -1, 0, 1, 2).' },
            { title: 'Save', description: 'Click "Create" to save the floor.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Floor Plan Upload</h3>
        <p className="text-body text-text-secondary">
          After creating a floor, upload a floor plan image:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Supported formats: JPG, PNG, PDF, DWG</li>
          <li>Click "Upload Floor Plan" button</li>
          <li>The floor plan becomes an interactive canvas</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Edit Mode - Placing Items</h3>
        <p className="text-body text-text-secondary">
          In Edit mode, click anywhere on the floor plan to open a popup:
        </p>
        <FeatureList
          features={[
            {
              icon: <MapPin size={20} />,
              title: 'Add Room',
              description: 'Place a room pin. Choose "Place Existing" (room without coordinates) or "Create New".',
            },
            {
              icon: <Square size={20} />,
              title: 'Add Asset',
              description: 'Place a floor-level asset. Import equipment from the project inventory.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Floor-Level Assets</h3>
        <p className="text-body text-text-secondary">
          Some assets (like main switches, generators, or server racks) don't belong to a specific
          room but are located on the floor. These can be placed directly on the floor plan:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Asset pins appear as <strong>squares</strong> (rooms are circles)</li>
          <li>Each asset shows an icon based on its type (AP, Switch, Camera, etc.)</li>
          <li>Click a placed asset pin to view/edit or remove from plan</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Draggable Popups</h3>
        <p className="text-body text-text-secondary">
          All popups on the floor plan can be moved:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Drag the popup header to reposition it</li>
          <li>Popup stays in place when navigating between steps</li>
          <li>Position resets when you click a new location on the canvas</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Pin Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          {[
            { color: 'bg-gray-500', label: 'NOT_STARTED' },
            { color: 'bg-blue-500', label: 'IN_PROGRESS' },
            { color: 'bg-green-500', label: 'COMPLETED' },
            { color: 'bg-red-500', label: 'BLOCKED' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${item.color}`} />
              <span className="text-body-sm text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>

        <h3 className="text-h3 text-text-primary">Floor Plan Controls</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Zoom</strong> - Use mouse scroll or +/- buttons</li>
          <li><strong>Pan</strong> - Click and drag to move around (when not in Edit mode)</li>
          <li><strong>Edit Mode</strong> - Toggle to place/move pins</li>
          <li><strong>Drag Pin</strong> - In edit mode, drag pins to reposition</li>
        </ul>

        <Tip>
          Upload high-resolution floor plans for better pin accuracy. Use the zoom controls
          to navigate large floor plans.
        </Tip>
      </div>
    </ManualSection>
  );
}

function RoomsSection() {
  return (
    <ManualSection
      icon={<MapPin size={24} />}
      title="Rooms & Floor Plans"
      description="Manage rooms and asset positioning on floor plans"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Rooms are the work areas within each floor. Each room can have its own floor plan
          showing the exact positions of installed assets.
        </p>

        <h3 className="text-h3 text-text-primary">Room Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Room identifier (e.g., "Room 101", "Server Room")</li>
          <li><strong>Type</strong> - Room category (Guest Room, Corridor, etc.)</li>
          <li><strong>Status</strong> - NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED</li>
          <li><strong>Notes</strong> - Additional information</li>
          <li><strong>Floor Plan</strong> - Room-level layout image</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Room Floor Plan - Placing Assets</h3>
        <p className="text-body text-text-secondary">
          In Edit mode, click on the floor plan to place assets:
        </p>
        <Steps
          steps={[
            { title: 'Upload Floor Plan', description: 'Click "Upload Floor Plan" to add a room layout image.' },
            { title: 'Toggle Edit Mode', description: 'Enable Edit mode using the toggle button.' },
            { title: 'Click Location', description: 'Click where you want to place an asset. A popup will appear.' },
            { title: 'Choose Action', description: 'Select "Place Existing" (assets without coordinates) or "Import from Inventory".' },
            { title: 'Select Asset', description: 'Pick the asset from the list. It will be placed at that location.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Import from Inventory</h3>
        <p className="text-body text-text-secondary">
          You can import equipment directly from the project inventory:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Only equipment with status <strong>IN_STOCK</strong> appears in the list</li>
          <li>When imported, the equipment is assigned to this room</li>
          <li>The equipment status changes to <strong>INSTALLED</strong></li>
          <li>The asset appears as a pin on the room floor plan</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Managing Placed Assets</h3>
        <p className="text-body text-text-secondary">
          Click on any placed asset pin to see options:
        </p>
        <FeatureList
          features={[
            {
              icon: <MousePointer size={20} />,
              title: 'View / Edit',
              description: 'Open the asset detail page to view or edit its properties.',
            },
            {
              icon: <Square size={20} />,
              title: 'Remove from Plan',
              description: 'Remove the pin from the floor plan (asset remains in the room, just without coordinates).',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Draggable Popups</h3>
        <p className="text-body text-text-secondary">
          All popups on the room floor plan can be moved by dragging their header.
          The popup position is preserved when navigating between steps.
        </p>

        <h3 className="text-h3 text-text-primary">Crop Floor Plan from Floor</h3>
        <p className="text-body text-text-secondary">
          When the parent floor has a floor plan, you can crop a section for the room:
        </p>
        <Steps
          steps={[
            { title: 'Navigate to Floor', description: 'Go to the floor detail page that has a floor plan.' },
            { title: 'Find Crop Column', description: 'Look for the "Κάτοψη" column in the Rooms table.' },
            { title: 'Click Crop/Edit', description: 'Click "Crop" (blue) for new, or "Edit" (green) to replace.' },
            { title: 'Select Area', description: 'Click and drag to select the room area on the floor plan.' },
            { title: 'Save', description: 'Click "Save Floor Plan" to apply.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Asset Pin Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          {[
            { color: 'bg-gray-500', label: 'NOT_STARTED' },
            { color: 'bg-blue-500', label: 'IN_PROGRESS' },
            { color: 'bg-green-500', label: 'COMPLETED' },
            { color: 'bg-orange-500', label: 'VERIFIED' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${item.color}`} />
              <span className="text-body-sm text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>

        <Tip>
          Use "Place Existing" for assets already assigned to the room but without coordinates.
          Use "Import from Inventory" to bring new equipment from the project inventory.
        </Tip>
      </div>
    </ManualSection>
  );
}

function AssetsSection() {
  return (
    <ManualSection
      icon={<Box size={24} />}
      title="Assets"
      description="Track equipment and devices"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Assets represent the equipment and devices installed in each room. The system tracks
          their status, specifications, and completion progress.
        </p>

        <h3 className="text-h3 text-text-primary">Asset Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Asset identifier</li>
          <li><strong>Type</strong> - Category (Access Point, Switch, Camera, etc.)</li>
          <li><strong>Serial Number</strong> - Manufacturer serial</li>
          <li><strong>MAC Address</strong> - Network address (if applicable)</li>
          <li><strong>Status</strong> - Installation progress</li>
          <li><strong>Position</strong> - X/Y coordinates on room floor plan</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Asset Status Lifecycle</h3>
        <div className="flex flex-wrap gap-2 my-4">
          {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'FAILED'].map((status) => (
            <span
              key={status}
              className="px-3 py-1 rounded-full text-body-sm bg-surface-secondary text-text-secondary"
            >
              {status}
            </span>
          ))}
        </div>

        <h3 className="text-h3 text-text-primary">Adding an Asset</h3>
        <Steps
          steps={[
            { title: 'Open Room', description: 'Navigate to the room detail page.' },
            { title: 'Click "Add Asset"', description: 'Use the button in the Assets section.' },
            { title: 'Select Type', description: 'Choose the asset type from the dropdown.' },
            { title: 'Enter Details', description: 'Fill in name, serial number, and MAC address.' },
            { title: 'Save', description: 'Click "Add Asset" to create.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Asset Checklists</h3>
        <p className="text-body text-text-secondary">
          Each asset can have multiple checklists for tracking installation progress:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>CABLING</strong> - Cable installation checklist</li>
          <li><strong>EQUIPMENT</strong> - Device installation steps</li>
          <li><strong>CONFIG</strong> - Configuration tasks</li>
          <li><strong>DOCUMENTATION</strong> - Required documentation</li>
        </ul>

        <Tip>
          Generate all checklists at once using the "Generate Checklists" button on the asset page.
        </Tip>
      </div>
    </ManualSection>
  );
}

function ChecklistsSection() {
  return (
    <ManualSection
      icon={<ClipboardCheck size={24} />}
      title="Checklists"
      description="Track installation tasks with photo documentation"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Checklists ensure all installation steps are completed correctly. Each checklist item
          can include photos as documentation.
        </p>

        <h3 className="text-h3 text-text-primary">Checklist Types</h3>
        <FeatureList
          features={[
            {
              icon: <ClipboardCheck size={20} />,
              title: 'CABLING',
              description: 'Cable routing, termination, labeling, and testing steps.',
            },
            {
              icon: <Box size={20} />,
              title: 'EQUIPMENT',
              description: 'Physical installation, mounting, and power connection.',
            },
            {
              icon: <Settings size={20} />,
              title: 'CONFIG',
              description: 'Network configuration, IP assignment, and testing.',
            },
            {
              icon: <FileText size={20} />,
              title: 'DOCUMENTATION',
              description: 'Labels, as-built drawings, and handover documents.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Working with Checklists</h3>
        <Steps
          steps={[
            { title: 'Open Asset', description: 'Navigate to the asset detail page.' },
            { title: 'View Checklists', description: 'Expand the checklist panels to see items.' },
            { title: 'Complete Items', description: 'Check the box when a task is done.' },
            { title: 'Add Photos', description: 'Click the camera icon to upload documentation photos.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Photo Documentation</h3>
        <p className="text-body text-text-secondary">
          Photos provide visual evidence of completed work:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Upload multiple photos per checklist item</li>
          <li>View photos in a gallery lightbox</li>
          <li>Photos are included in PDF reports</li>
          <li>Delete photos if needed</li>
        </ul>

        <Tip>
          Complete checklist items as you work - this updates the asset and room progress automatically.
        </Tip>
      </div>
    </ManualSection>
  );
}

function ChecklistTemplatesSection() {
  return (
    <ManualSection
      icon={<FileCheck size={24} />}
      title="Checklist Templates"
      description="Create reusable checklist templates for different asset types"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Checklist Templates define the standard tasks that need to be completed for each asset type.
          When you generate checklists for an asset, they are created from these templates.
        </p>

        <h3 className="text-h3 text-text-primary">Template Types</h3>
        <FeatureList
          features={[
            {
              icon: <ClipboardCheck size={20} />,
              title: 'CABLING',
              description: 'Cable routing, termination, labeling, and testing steps.',
            },
            {
              icon: <Box size={20} />,
              title: 'EQUIPMENT',
              description: 'Physical installation, mounting, and power connection.',
            },
            {
              icon: <Settings size={20} />,
              title: 'CONFIG',
              description: 'Network configuration, IP assignment, and testing.',
            },
            {
              icon: <FileText size={20} />,
              title: 'DOCUMENTATION',
              description: 'Labels, as-built drawings, and handover documents.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Managing Templates</h3>
        <p className="text-body text-text-secondary">
          Access Checklist Templates from the sidebar (Admin/PM only):
        </p>
        <Steps
          steps={[
            { title: 'View Templates', description: 'See all templates organized by asset type and checklist type.' },
            { title: 'Edit Template', description: 'Click a template to modify its items.' },
            { title: 'Add/Remove Items', description: 'Add new checklist items or remove existing ones.' },
            { title: 'Set Requirements', description: 'Mark items as required and specify if photos are needed.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Template Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Asset Type</strong> - Which type of asset this template applies to (AP, Switch, etc.)</li>
          <li><strong>Checklist Type</strong> - Category (CABLING, EQUIPMENT, CONFIG, DOCUMENTATION)</li>
          <li><strong>Items</strong> - List of tasks to complete</li>
          <li><strong>Required</strong> - Whether the item must be completed</li>
          <li><strong>Photo Required</strong> - Whether a photo is mandatory</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Using Templates</h3>
        <p className="text-body text-text-secondary">
          When you add an asset to a room and click "Generate Checklists":
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>The system finds all templates matching the asset's type</li>
          <li>Checklists are created from each matching template</li>
          <li>Technicians can then complete the checklist items</li>
        </ul>

        <Tip>
          Create templates before adding assets to ensure consistent checklists across all installations.
        </Tip>
      </div>
    </ManualSection>
  );
}

function IssuesSection() {
  return (
    <ManualSection
      icon={<AlertTriangle size={24} />}
      title="Issues"
      description="Track and resolve problems"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Issues system helps track problems, defects, and tasks that need attention.
          Issues can be assigned priorities and tracked through to resolution.
        </p>

        <h3 className="text-h3 text-text-primary">Issue Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Title</strong> - Brief description of the issue</li>
          <li><strong>Description</strong> - Detailed explanation</li>
          <li><strong>Priority</strong> - LOW, MEDIUM, HIGH, CRITICAL</li>
          <li><strong>Status</strong> - OPEN, IN_PROGRESS, RESOLVED, CLOSED</li>
          <li><strong>Assignee</strong> - Team member responsible</li>
          <li><strong>Room</strong> - Associated location</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Issue Workflow</h3>
        <div className="flex flex-wrap items-center gap-2 my-4">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status, index, arr) => (
            <span key={status} className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-body-sm bg-surface-secondary text-text-secondary">
                {status}
              </span>
              {index < arr.length - 1 && <ChevronRight size={16} className="text-text-tertiary" />}
            </span>
          ))}
        </div>

        <h3 className="text-h3 text-text-primary">Quick Actions</h3>
        <p className="text-body text-text-secondary">
          Use quick action buttons to change issue status:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Start</strong> - Move from OPEN to IN_PROGRESS</li>
          <li><strong>Resolve</strong> - Mark as RESOLVED when fixed</li>
          <li><strong>Close</strong> - Close the issue completely</li>
          <li><strong>Reopen</strong> - Reopen a closed issue if needed</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Comments & Photos</h3>
        <p className="text-body text-text-secondary">
          Issues support collaboration through comments and photos:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Add comments to discuss the issue</li>
          <li>Upload photos showing the problem or solution</li>
          <li>View comment history with timestamps</li>
        </ul>

        <Tip>
          The Issues badge in the sidebar shows the count of open issues.
        </Tip>
      </div>
    </ManualSection>
  );
}

function InventorySection() {
  return (
    <ManualSection
      icon={<Package size={24} />}
      title="Inventory"
      description="Manage equipment and materials"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Inventory module has two main sections: <strong>Equipment</strong> (network devices,
          cameras, etc.) and <strong>Materials</strong> (cables, connectors, consumables).
        </p>

        <h3 className="text-h3 text-text-primary">Inventory Tabs</h3>
        <FeatureList
          features={[
            {
              icon: <Box size={20} />,
              title: 'Equipment',
              description: 'Network devices like APs, switches, cameras. Each has serial number, MAC, model.',
            },
            {
              icon: <Package size={20} />,
              title: 'Materials',
              description: 'Consumables like cables, connectors, patch cords. Tracked by quantity and unit.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Equipment Status Lifecycle</h3>
        <p className="text-body text-text-secondary">
          Equipment moves through these statuses:
        </p>
        <div className="flex flex-wrap items-center gap-2 my-4">
          {['PLANNED', 'IN_STOCK', 'INSTALLED', 'CONFIGURED', 'VERIFIED', 'FAULTY'].map((status, index, arr) => (
            <span key={status} className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-body-sm bg-surface-secondary text-text-secondary">
                {status}
              </span>
              {index < arr.length - 1 && <ChevronRight size={16} className="text-text-tertiary" />}
            </span>
          ))}
        </div>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>PLANNED</strong> - Equipment ordered but not yet received</li>
          <li><strong>IN_STOCK</strong> - Received and available for installation</li>
          <li><strong>INSTALLED</strong> - Placed on a floor or room plan</li>
          <li><strong>CONFIGURED</strong> - Network settings applied</li>
          <li><strong>VERIFIED</strong> - Tested and confirmed working</li>
          <li><strong>FAULTY</strong> - Defective, needs replacement</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Adding Equipment</h3>
        <Steps
          steps={[
            { title: 'Select Project', description: 'Choose the project from the dropdown.' },
            { title: 'Click "Add Equipment"', description: 'Opens the bulk add modal.' },
            { title: 'Select Type & Model', description: 'Choose asset type and model from dropdowns.' },
            { title: 'Enter Quantity', description: 'How many units to add.' },
            { title: 'Choose Status', description: 'Select "In Stock" (received) or "Planned" (ordered).' },
            { title: 'Add Serial Numbers', description: 'Enter serial and MAC for each unit.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Materials Management</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Receive</strong> - Add stock when materials arrive</li>
          <li><strong>Consume</strong> - Deduct stock when materials are used</li>
          <li><strong>Adjust</strong> - Correct stock after physical count</li>
          <li><strong>Low Stock Alert</strong> - Items below minimum are highlighted</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Filter Options</h3>
        <p className="text-body text-text-secondary">
          Use filters to find specific items:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Filter by status (All, In Stock, Planned, Installed)</li>
          <li>Filter by asset type (AP, Switch, Camera, etc.)</li>
          <li>Search by name, serial number, or MAC address</li>
        </ul>

        <Tip>
          Only equipment with status "IN_STOCK" can be imported to floor/room plans.
          Use "PLANNED" status for equipment that's ordered but not yet received.
        </Tip>
      </div>
    </ManualSection>
  );
}

function ReportsSection() {
  return (
    <ManualSection
      icon={<FileText size={24} />}
      title="Reports & PDF Export"
      description="Generate comprehensive project reports"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Generate detailed reports for internal use or client presentation. Reports can be
          viewed online or exported as PDF documents.
        </p>

        <h3 className="text-h3 text-text-primary">Report Types</h3>
        <FeatureList
          features={[
            {
              icon: <FileText size={20} />,
              title: 'Summary Report',
              description: 'High-level overview with progress charts and key metrics.',
            },
            {
              icon: <Users size={20} />,
              title: 'Client Report',
              description: 'Professional report suitable for client presentation.',
            },
            {
              icon: <Shield size={20} />,
              title: 'Internal Report',
              description: 'Detailed technical report for internal review (Admin/PM only).',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Generating Reports</h3>
        <Steps
          steps={[
            { title: 'Select Project', description: 'Choose a project from the dropdown.' },
            { title: 'Choose Report Type', description: 'Click on Summary, Client, or Internal tab.' },
            { title: 'Review Content', description: 'Check the report data on screen.' },
            { title: 'Export PDF', description: 'Click "Export PDF" to generate a downloadable file.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Report Content</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Project information and dates</li>
          <li>Progress statistics by floor</li>
          <li>Room completion status</li>
          <li>Asset inventory summary</li>
          <li>Issue summary and resolution stats</li>
          <li>Checklist completion percentages</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Report History</h3>
        <p className="text-body text-text-secondary">
          View previously generated reports in the History section. You can download or delete
          old reports as needed.
        </p>

        <Tip>
          Client reports automatically hide sensitive internal information.
        </Tip>
      </div>
    </ManualSection>
  );
}

function LookupsSection() {
  return (
    <ManualSection
      icon={<ListFilter size={24} />}
      title="Lookup Tables"
      description="Manage dropdown options and reference data (Admin/PM only)"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Lookup tables contain the options that appear in dropdown menus throughout the application.
          Administrators and Project Managers can customize these to match project requirements.
        </p>

        <h3 className="text-h3 text-text-primary">Available Lookup Tables</h3>
        <FeatureList
          features={[
            {
              icon: <MapPin size={20} />,
              title: 'Room Types',
              description: 'Categories for rooms (Guest Room, Corridor, Server Room, etc.) with icons.',
            },
            {
              icon: <Package size={20} />,
              title: 'Inventory Units',
              description: 'Measurement units for materials (pcs, m, kg, box, roll, etc.).',
            },
            {
              icon: <AlertTriangle size={20} />,
              title: 'Issue Causes',
              description: 'Common causes for issues (Defective Equipment, Installation Error, etc.).',
            },
            {
              icon: <Building2 size={20} />,
              title: 'Manufacturers',
              description: 'Equipment manufacturers (Cisco, Ubiquiti, Hikvision, etc.) with websites.',
            },
            {
              icon: <Box size={20} />,
              title: 'Asset Models',
              description: 'Specific product models linked to manufacturers and asset types.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Managing Lookups</h3>
        <Steps
          steps={[
            { title: 'Navigate to Lookups', description: 'Click "Lookups" in the sidebar (Admin section).' },
            { title: 'Select Tab', description: 'Choose which lookup table to manage.' },
            { title: 'Add Item', description: 'Click "Add" to create a new entry.' },
            { title: 'Edit/Delete', description: 'Use the action buttons to modify or remove items.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Room Types</h3>
        <p className="text-body text-text-secondary">
          Each room type has:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Display name in dropdowns</li>
          <li><strong>Icon</strong> - Visual identifier (choose from 30+ icons)</li>
          <li><strong>Order</strong> - Sort position in lists</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Asset Models</h3>
        <p className="text-body text-text-secondary">
          Asset models link to both manufacturers and asset types:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Model name (e.g., "UniFi U6 Pro")</li>
          <li><strong>Manufacturer</strong> - The brand (e.g., "Ubiquiti")</li>
          <li><strong>Asset Type</strong> - Category (e.g., "Access Point")</li>
          <li><strong>Icon</strong> - Visual identifier for floor plan pins</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Manufacturers</h3>
        <p className="text-body text-text-secondary">
          Each manufacturer entry includes:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Company name</li>
          <li><strong>Website</strong> - Optional URL for reference</li>
        </ul>

        <Tip>
          Set up lookup tables at the start of a project. Changes to lookups affect all future
          entries but don't modify existing data.
        </Tip>
      </div>
    </ManualSection>
  );
}

function SettingsSection() {
  return (
    <ManualSection
      icon={<Settings size={24} />}
      title="Settings"
      description="Configure your account and application preferences"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Access Settings from the bottom of the sidebar to customize your experience and
          manage your account.
        </p>

        <h3 className="text-h3 text-text-primary">Settings Sections</h3>
        <FeatureList
          features={[
            {
              icon: <Users size={20} />,
              title: 'Profile',
              description: 'Update your name, email, and profile picture.',
            },
            {
              icon: <Key size={20} />,
              title: 'Password',
              description: 'Change your password for security.',
            },
            {
              icon: <Bell size={20} />,
              title: 'Notifications',
              description: 'Configure email notification preferences.',
            },
            {
              icon: <Palette size={20} />,
              title: 'Theme',
              description: 'Switch between dark, light, or system theme.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Admin-Only Settings</h3>
        <p className="text-body text-text-secondary">
          These settings are only available to Administrators:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Company</strong> - Update company name, logo, and contact information</li>
          <li><strong>API Keys</strong> - Create and manage API keys for integrations</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Theme Options</h3>
        <div className="flex gap-4 my-4">
          {[
            { label: 'Dark', desc: 'Low-light environments' },
            { label: 'Light', desc: 'Bright environments' },
            { label: 'System', desc: 'Follow OS preference' },
          ].map((theme) => (
            <div key={theme.label} className="p-3 bg-surface-secondary rounded-lg text-center flex-1">
              <p className="text-body font-medium text-text-primary">{theme.label}</p>
              <p className="text-caption text-text-tertiary">{theme.desc}</p>
            </div>
          ))}
        </div>

        <Tip>
          Enable "System" theme to automatically switch based on your device's dark mode setting.
        </Tip>
      </div>
    </ManualSection>
  );
}

function UsersSection() {
  return (
    <ManualSection
      icon={<Users size={24} />}
      title="User Management"
      description="Manage system users and access (Admin only)"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          User Management is available only to Administrators. Create, edit, and manage
          user accounts and their access levels.
        </p>

        <h3 className="text-h3 text-text-primary">User Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - User's full name</li>
          <li><strong>Email</strong> - Login email address</li>
          <li><strong>Role</strong> - Access level (ADMIN, PM, TECHNICIAN, CLIENT)</li>
          <li><strong>Status</strong> - Active or inactive</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Managing Users</h3>
        <Steps
          steps={[
            { title: 'View Users', description: 'Access Users from the Admin section in the sidebar.' },
            { title: 'Add User', description: 'Click "Add User" to create a new account.' },
            { title: 'Set Details', description: 'Enter name, email, password, and role.' },
            { title: 'Manage', description: 'Edit, activate/deactivate, or delete users as needed.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">User Actions</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Edit</strong> - Update user details and role</li>
          <li><strong>Activate/Deactivate</strong> - Enable or disable account access</li>
          <li><strong>Delete</strong> - Permanently remove a user (use with caution)</li>
        </ul>

        <Tip>
          Deactivate users instead of deleting them to preserve their activity history.
        </Tip>
      </div>
    </ManualSection>
  );
}

function RolesSection() {
  return (
    <ManualSection
      icon={<Shield size={24} />}
      title="Roles & Permissions"
      description="Understanding user access levels"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Synax uses a role-based access control system. Each role has specific permissions
          determining what users can see and do.
        </p>

        <h3 className="text-h3 text-text-primary">Available Roles</h3>
        <div className="space-y-4 my-6">
          {[
            {
              role: 'ADMIN',
              color: 'bg-red-500/10 text-red-500',
              description: 'Full system access',
              permissions: [
                'All project management features',
                'User management',
                'Company settings',
                'API key management',
                'View all reports',
                'Delete any data',
              ],
            },
            {
              role: 'PM (Project Manager)',
              color: 'bg-blue-500/10 text-blue-500',
              description: 'Project management access',
              permissions: [
                'Create and manage projects',
                'Assign team members',
                'View internal reports',
                'Manage issues',
                'Full asset management',
              ],
            },
            {
              role: 'TECHNICIAN',
              color: 'bg-green-500/10 text-green-500',
              description: 'Field work access',
              permissions: [
                'View assigned projects',
                'Complete checklists',
                'Create and update issues',
                'Update asset status',
                'Manage inventory',
              ],
            },
            {
              role: 'CLIENT',
              color: 'bg-purple-500/10 text-purple-500',
              description: 'Read-only client access',
              permissions: [
                'View project progress',
                'View client reports',
                'View open issues',
                'Limited data access',
              ],
            },
          ].map((item) => (
            <div key={item.role} className="p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-body-sm font-medium ${item.color}`}>
                  {item.role}
                </span>
                <span className="text-body text-text-secondary">{item.description}</span>
              </div>
              <ul className="list-disc list-inside text-body-sm text-text-tertiary space-y-1 ml-4">
                {item.permissions.map((perm) => (
                  <li key={perm}>{perm}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Tip>
          Assign the minimum required role to each user for better security.
        </Tip>
      </div>
    </ManualSection>
  );
}

function PWAOfflineSection() {
  return (
    <ManualSection
      icon={<Smartphone size={24} />}
      title="PWA & Offline Support"
      description="Install the app and work offline"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Synax is a Progressive Web App (PWA) that can be installed on your device and
          used even without an internet connection.
        </p>

        <h3 className="text-h3 text-text-primary">Installing the App</h3>
        <p className="text-body text-text-secondary">
          You can install Synax on your device for quick access:
        </p>
        <Steps
          steps={[
            { title: 'Look for Install Prompt', description: 'A banner will appear at the bottom of the screen asking to install the app.' },
            { title: 'Click Install', description: 'Click the "Install" button to add Synax to your device.' },
            { title: 'Access from Home Screen', description: 'The app icon will appear on your desktop or home screen.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Offline Features</h3>
        <FeatureList
          features={[
            {
              icon: <Wifi size={20} />,
              title: 'Online Indicator',
              description: 'The header shows your connection status with a green/red indicator.',
            },
            {
              icon: <WifiOff size={20} />,
              title: 'Offline Mode',
              description: 'When offline, you can still view cached data and queue changes.',
            },
            {
              icon: <Download size={20} />,
              title: 'Background Sync',
              description: 'Changes made offline are automatically synced when connection is restored.',
            },
            {
              icon: <Smartphone size={20} />,
              title: 'Native Experience',
              description: 'The installed app works like a native application with full-screen mode.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Sync Status</h3>
        <p className="text-body text-text-secondary">
          The header displays sync status information:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Green dot</strong> - Online and synced</li>
          <li><strong>Yellow dot</strong> - Syncing in progress</li>
          <li><strong>Red dot</strong> - Offline or sync error</li>
          <li><strong>Pending count</strong> - Number of changes waiting to sync</li>
        </ul>

        <Tip>
          Install the app on your mobile device for the best field work experience.
        </Tip>
      </div>
    </ManualSection>
  );
}

function QRScannerSection() {
  return (
    <ManualSection
      icon={<QrCode size={24} />}
      title="QR Code Scanner"
      description="Quickly find assets by scanning QR codes"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The QR Scanner allows you to quickly look up assets by scanning their QR codes
          or entering serial numbers manually.
        </p>

        <h3 className="text-h3 text-text-primary">Opening the Scanner</h3>
        <p className="text-body text-text-secondary">
          Click the QR code icon in the header to open the scanner modal.
        </p>

        <h3 className="text-h3 text-text-primary">Scanning Methods</h3>
        <FeatureList
          features={[
            {
              icon: <Camera size={20} />,
              title: 'Camera Scan',
              description: 'Use your device camera to scan QR codes or barcodes.',
            },
            {
              icon: <KeyRound size={20} />,
              title: 'Manual Entry',
              description: 'Type the serial number or MAC address to search.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Using the Camera Scanner</h3>
        <Steps
          steps={[
            { title: 'Allow Camera Access', description: 'Grant permission when prompted by your browser.' },
            { title: 'Point at QR Code', description: 'Hold your device steady and point at the asset QR code.' },
            { title: 'Wait for Detection', description: 'The scanner will automatically detect and read the code.' },
            { title: 'View Results', description: 'The asset details will be displayed, with a link to view more.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Scanner Features</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Camera Switch</strong> - Toggle between front and back cameras</li>
          <li><strong>Flash/Torch</strong> - Enable flashlight for low-light conditions</li>
          <li><strong>Manual Entry</strong> - Switch to manual mode if scanning fails</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Asset QR Codes</h3>
        <p className="text-body text-text-secondary">
          Each asset has a unique QR code displayed on its detail page:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>View the QR code in the asset detail page</li>
          <li>Copy the code value to clipboard</li>
          <li>Download the QR code as an image</li>
        </ul>

        <Tip>
          Print asset QR codes and attach them to equipment for easy scanning in the field.
        </Tip>
      </div>
    </ManualSection>
  );
}

function TimeTrackingSection() {
  return (
    <ManualSection
      icon={<Clock size={24} />}
      title="Time Tracking"
      description="Track work hours across projects"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Time Tracking module allows you to record work hours spent on projects.
          Use the timer for real-time tracking or add entries manually.
        </p>

        <h3 className="text-h3 text-text-primary">Timer Mode</h3>
        <p className="text-body text-text-secondary">
          Start a timer when you begin work and stop it when finished:
        </p>
        <Steps
          steps={[
            { title: 'Select Project', description: 'Choose the project you are working on from the dropdown.' },
            { title: 'Select Type', description: 'Choose the work type (Installation, Configuration, etc.).' },
            { title: 'Click Start', description: 'The timer will begin counting your work time.' },
            { title: 'Click Stop', description: 'When finished, click Stop to save the time entry.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Manual Entry</h3>
        <p className="text-body text-text-secondary">
          Add time entries manually for past work:
        </p>
        <Steps
          steps={[
            { title: 'Click Add Entry', description: 'Open the manual entry form.' },
            { title: 'Fill Details', description: 'Select project, type, date, and hours worked.' },
            { title: 'Add Description', description: 'Optionally describe what you worked on.' },
            { title: 'Save', description: 'Click Save Entry to record the time.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Work Types</h3>
        <div className="flex flex-wrap gap-2 my-4">
          {['INSTALLATION', 'CONFIGURATION', 'TESTING', 'TROUBLESHOOTING', 'TRAVEL', 'MEETING', 'OTHER'].map((type) => (
            <span
              key={type}
              className="px-3 py-1 rounded-full text-body-sm bg-surface-secondary text-text-secondary"
            >
              {type}
            </span>
          ))}
        </div>

        <h3 className="text-h3 text-text-primary">Time Entries List</h3>
        <p className="text-body text-text-secondary">
          View and manage your time entries:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Filter by project or date range</li>
          <li>View total hours and weekly summary</li>
          <li>Delete incorrect entries</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Summary Statistics</h3>
        <p className="text-body text-text-secondary">
          The page displays summary cards showing:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Total Entries</strong> - Number of recorded time entries</li>
          <li><strong>Total Hours</strong> - Sum of all hours worked</li>
          <li><strong>This Week</strong> - Hours worked in the last 7 days</li>
        </ul>

        <Tip>
          Use the timer for accurate tracking - it automatically calculates the duration when you stop.
        </Tip>
      </div>
    </ManualSection>
  );
}

function SignaturesSection() {
  return (
    <ManualSection
      icon={<PenTool size={24} />}
      title="Digital Signatures"
      description="Capture signatures for handovers and approvals"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Digital Signatures allow you to capture handwritten signatures for room handovers,
          stage completions, and final acceptances.
        </p>

        <h3 className="text-h3 text-text-primary">Signature Types</h3>
        <FeatureList
          features={[
            {
              icon: <MapPin size={20} />,
              title: 'Room Handover',
              description: 'Sign-off when a room installation is complete.',
            },
            {
              icon: <ClipboardCheck size={20} />,
              title: 'Stage Completion',
              description: 'Confirm completion of a project phase.',
            },
            {
              icon: <Shield size={20} />,
              title: 'Final Acceptance',
              description: 'Client sign-off for project completion.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Capturing a Signature</h3>
        <Steps
          steps={[
            { title: 'Open Signature Modal', description: 'Click the signature button in a room or project.' },
            { title: 'Enter Name', description: 'Type the name of the person signing.' },
            { title: 'Draw Signature', description: 'Use your finger or mouse to draw the signature on the pad.' },
            { title: 'Submit', description: 'Click Submit to save the signature.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Signature Pad Features</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Touch Support</strong> - Works with touchscreen devices</li>
          <li><strong>Mouse Support</strong> - Use mouse on desktop computers</li>
          <li><strong>Clear Button</strong> - Erase and start over</li>
          <li><strong>Undo</strong> - Remove the last stroke</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Viewing Signatures</h3>
        <p className="text-body text-text-secondary">
          Saved signatures are displayed with:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Signature image</li>
          <li>Signer name</li>
          <li>Date and time</li>
          <li>Signature type</li>
        </ul>

        <Tip>
          Signatures are included in client reports as proof of acceptance.
        </Tip>
      </div>
    </ManualSection>
  );
}

function LabelsSection() {
  return (
    <ManualSection
      icon={<Tags size={24} />}
      title="Label Generation"
      description="Create and print labels for cables, racks, and assets"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Label Generator creates printable labels for cables, racks, assets, and rooms.
          Labels can include QR codes for easy identification.
        </p>

        <h3 className="text-h3 text-text-primary">Label Types</h3>
        <FeatureList
          features={[
            {
              icon: <Tags size={20} />,
              title: 'Cable Labels',
              description: 'Labels for network and power cables with port information.',
            },
            {
              icon: <Box size={20} />,
              title: 'Rack Labels',
              description: 'Labels for server racks and cabinet units.',
            },
            {
              icon: <Box size={20} />,
              title: 'Asset Labels',
              description: 'Labels with asset name, serial number, and QR code.',
            },
            {
              icon: <MapPin size={20} />,
              title: 'Room Labels',
              description: 'Door labels and room identification signs.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Creating Labels</h3>
        <Steps
          steps={[
            { title: 'Select Project', description: 'Choose a project from the dropdown.' },
            { title: 'Choose Label Type', description: 'Select Cable, Rack, Asset, or Room labels.' },
            { title: 'Configure Options', description: 'Set prefix, numbering, and quantity.' },
            { title: 'Generate', description: 'Click Generate to create the labels.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Label Options</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Prefix</strong> - Text before the number (e.g., "CBL-", "RACK-")</li>
          <li><strong>Start Number</strong> - First number in the sequence</li>
          <li><strong>Quantity</strong> - How many labels to generate (1-100)</li>
          <li><strong>Include QR</strong> - Add QR code to each label</li>
          <li><strong>Color</strong> - Choose from 6 color options</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Printing Labels</h3>
        <p className="text-body text-text-secondary">
          After generating labels:
        </p>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li>Click <strong>Print</strong> to open the print dialog</li>
          <li>Select your label printer</li>
          <li>Adjust print settings as needed</li>
          <li>Use "Save as PDF" option for digital export</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Color Options</h3>
        <div className="flex flex-wrap gap-3 my-4">
          {[
            { color: 'bg-white border', label: 'White' },
            { color: 'bg-yellow-300', label: 'Yellow' },
            { color: 'bg-blue-300', label: 'Blue' },
            { color: 'bg-green-300', label: 'Green' },
            { color: 'bg-orange-300', label: 'Orange' },
            { color: 'bg-red-300', label: 'Red' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${item.color}`} />
              <span className="text-body-sm text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>

        <Tip>
          Use colored labels to distinguish between different cable types or project zones.
        </Tip>
      </div>
    </ManualSection>
  );
}

function FAQSection() {
  return (
    <ManualSection
      icon={<HelpCircle size={24} />}
      title="Frequently Asked Questions"
      description="Common questions and answers"
    >
      <div className="space-y-6">
        {[
          {
            q: 'How do I reset my password?',
            a: 'If you forgot your password, click "Forgot password?" on the login page. Enter your email to receive a reset link. Alternatively, go to Settings > Password to change your current password.',
          },
          {
            q: 'Can I work offline?',
            a: 'Yes! Synax is a Progressive Web App (PWA) with offline support. Install the app and your data will be cached locally. Changes made offline are automatically synced when you reconnect.',
          },
          {
            q: 'How do I install the app on my device?',
            a: 'Look for the "Install" banner at the bottom of the screen, or use your browser\'s "Add to Home Screen" option. The app will then appear as an icon on your device.',
          },
          {
            q: 'How do I upload a floor plan?',
            a: 'Navigate to a floor or room detail page and click "Upload Floor Plan". Supported formats are JPG, PNG, PDF, and DWG.',
          },
          {
            q: 'How do I position assets on a floor plan?',
            a: 'Upload a floor plan to the room, then click anywhere on the image to open the asset dropdown. Select an asset to place it at that location.',
          },
          {
            q: 'How do I scan a QR code?',
            a: 'Click the QR icon in the header to open the scanner. Allow camera access, then point your device at the QR code. You can also enter serial numbers manually.',
          },
          {
            q: 'How do I track my work hours?',
            a: 'Go to Time Tracking in the sidebar. Select a project and click Start to begin the timer. Click Stop when finished. You can also add manual entries for past work.',
          },
          {
            q: 'How do I create labels?',
            a: 'Go to Labels in the sidebar, select a project, choose the label type (Cable, Rack, Asset, Room), configure options, and click Generate. Use Print to print the labels.',
          },
          {
            q: 'How do I capture a digital signature?',
            a: 'In a room or project page, click the signature button. Enter the signer\'s name, draw the signature using your finger or mouse, and click Submit.',
          },
          {
            q: 'Can I export data to Excel?',
            a: 'Currently, reports can be exported as PDF. Excel export is planned for a future release.',
          },
          {
            q: 'How do I add team members to a project?',
            a: 'Open the project detail page and scroll to the Team Members section. Click "Add Member" and select from the available users.',
          },
          {
            q: 'What do the asset status colors mean?',
            a: 'Gray = Planned, Blue = In Stock, Green = Installed, Teal = Configured, Orange = Verified, Red = Faulty.',
          },
          {
            q: 'How do I generate a report?',
            a: 'Go to Reports, select a project, choose the report type (Summary, Client, or Internal), and click "Export PDF".',
          },
          {
            q: 'Can multiple users work on the same project?',
            a: 'Yes! Add team members to a project, and they can all work simultaneously. Changes are synced automatically.',
          },
          {
            q: 'How do I contact support?',
            a: 'For technical support, contact your system administrator or the Synax support team.',
          },
          {
            q: 'What is the hierarchy of Projects, Buildings, and Floors?',
            a: 'The hierarchy is: Project → Building → Floor → Room → Asset. Buildings allow you to organize large projects with multiple structures. For simple projects, you can have just one building.',
          },
          {
            q: 'How do I import equipment from inventory to a floor plan?',
            a: 'In Edit mode, click on the floor/room plan. Select "Import from Inventory" from the popup. Only equipment with "IN_STOCK" status will be shown. Select the item to place it at that location.',
          },
          {
            q: 'What are floor-level assets?',
            a: 'Floor-level assets are equipment placed directly on the floor plan without belonging to a specific room (e.g., main switches, generators). They appear as square pins instead of circle pins.',
          },
          {
            q: 'Can I move the popups on the floor plan?',
            a: 'Yes! All popups are draggable. Click and drag the popup header to move it anywhere on the screen. The position is preserved as you navigate between popup steps.',
          },
          {
            q: 'What\'s the difference between "Place Existing" and "Import from Inventory"?',
            a: '"Place Existing" shows assets already assigned to the room/floor but without coordinates. "Import from Inventory" lets you bring new equipment from the project inventory.',
          },
          {
            q: 'How do I manage lookup tables like Room Types and Asset Models?',
            a: 'Go to Lookups in the Admin section of the sidebar. Select the tab for the lookup you want to manage, then add, edit, or delete entries as needed.',
          },
        ].map((faq, index) => (
          <div key={index} className="p-4 bg-surface-secondary rounded-lg">
            <h4 className="text-body font-semibold text-text-primary mb-2">{faq.q}</h4>
            <p className="text-body-sm text-text-secondary">{faq.a}</p>
          </div>
        ))}
      </div>
    </ManualSection>
  );
}

export default ManualPage;
