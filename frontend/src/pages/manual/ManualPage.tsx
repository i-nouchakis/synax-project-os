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
  | 'floors'
  | 'rooms'
  | 'assets'
  | 'checklists'
  | 'issues'
  | 'inventory'
  | 'time-tracking'
  | 'qr-scanner'
  | 'labels'
  | 'signatures'
  | 'reports'
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
  { id: 'floors', label: 'Floors', icon: <Layers size={18} />, category: 'Project Management' },
  { id: 'rooms', label: 'Rooms & Floor Plans', icon: <MapPin size={18} />, category: 'Project Management' },
  { id: 'assets', label: 'Assets', icon: <Box size={18} />, category: 'Asset Management' },
  { id: 'qr-scanner', label: 'QR Scanner', icon: <QrCode size={18} />, category: 'Asset Management' },
  { id: 'checklists', label: 'Checklists', icon: <ClipboardCheck size={18} />, category: 'Field Work' },
  { id: 'issues', label: 'Issues', icon: <AlertTriangle size={18} />, category: 'Field Work' },
  { id: 'inventory', label: 'Inventory', icon: <Package size={18} />, category: 'Field Work' },
  { id: 'time-tracking', label: 'Time Tracking', icon: <Clock size={18} />, category: 'Field Work' },
  { id: 'signatures', label: 'Digital Signatures', icon: <PenTool size={18} />, category: 'Field Work' },
  { id: 'reports', label: 'Reports & PDF', icon: <FileText size={18} />, category: 'Reporting' },
  { id: 'labels', label: 'Label Generation', icon: <Tags size={18} />, category: 'Reporting' },
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
          {activeSection === 'floors' && <FloorsSection />}
          {activeSection === 'rooms' && <RoomsSection />}
          {activeSection === 'assets' && <AssetsSection />}
          {activeSection === 'qr-scanner' && <QRScannerSection />}
          {activeSection === 'checklists' && <ChecklistsSection />}
          {activeSection === 'issues' && <IssuesSection />}
          {activeSection === 'inventory' && <InventorySection />}
          {activeSection === 'time-tracking' && <TimeTrackingSection />}
          {activeSection === 'signatures' && <SignaturesSection />}
          {activeSection === 'reports' && <ReportsSection />}
          {activeSection === 'labels' && <LabelsSection />}
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

function FloorsSection() {
  return (
    <ManualSection
      icon={<Layers size={24} />}
      title="Floors"
      description="Manage building floors and floor plans"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          Floors represent the physical levels within a project. Each floor can have its own
          floor plan and contains multiple rooms.
        </p>

        <h3 className="text-h3 text-text-primary">Adding a Floor</h3>
        <Steps
          steps={[
            { title: 'Open Project', description: 'Navigate to the project detail page.' },
            { title: 'Click "Add Floor"', description: 'Use the button in the Floors section.' },
            { title: 'Enter Details', description: 'Provide floor name and level number.' },
            { title: 'Upload Floor Plan', description: 'Optionally upload a floor plan image or PDF.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Floor Plan Features</h3>
        <FeatureList
          features={[
            {
              icon: <MapPin size={20} />,
              title: 'Interactive Pins',
              description: 'Click on the floor plan to place pins marking room locations.',
            },
            {
              icon: <ChevronRight size={20} />,
              title: 'Status Colors',
              description: 'Pins are color-coded based on room status (Not Started, In Progress, Completed, Blocked).',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Floor Plan Viewer</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Zoom</strong> - Use mouse scroll or +/- buttons</li>
          <li><strong>Pan</strong> - Click and drag to move around</li>
          <li><strong>Click Pin</strong> - View room details</li>
          <li><strong>Drag Pin</strong> - Reposition room marker</li>
        </ul>

        <Tip>
          Upload high-resolution floor plans for better pin accuracy and visibility.
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

        <h3 className="text-h3 text-text-primary">Room Floor Plan</h3>
        <p className="text-body text-text-secondary">
          Each room can have its own floor plan showing asset positions:
        </p>
        <Steps
          steps={[
            { title: 'Upload Floor Plan', description: 'Click "Upload Floor Plan" to add a room layout image.' },
            { title: 'Place Assets', description: 'Click on the floor plan to open the asset selection dropdown.' },
            { title: 'Select Asset', description: 'Choose which asset to place at that location.' },
            { title: 'Reposition', description: 'Drag pins to adjust their positions.' },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Crop Floor Plan from Floor</h3>
        <p className="text-body text-text-secondary">
          When a floor has a floor plan uploaded, you can crop a section of it to use as the room's floor plan:
        </p>
        <Steps
          steps={[
            { title: 'Navigate to Floor', description: 'Go to the floor detail page that has a floor plan.' },
            { title: 'Find Crop Column', description: 'Look for the "Κάτοψη" column in the Rooms table (visible only when floor has a floor plan).' },
            { title: 'Click Crop/Edit', description: 'Click "Crop" (blue) for new, or "Edit" (green) if room already has a floor plan.' },
            { title: 'Select Area', description: 'In the modal, click and drag to select the room area on the floor plan.' },
            { title: 'Zoom Controls', description: 'Use zoom in/out buttons to adjust the view for precise selection.' },
            { title: 'Save', description: 'Click "Save Floor Plan" to apply the cropped section to the room.' },
          ]}
        />
        <Tip>
          If a room already has a floor plan, clicking "Edit" will show a confirmation dialog before proceeding,
          as the action will replace the existing floor plan.
        </Tip>

        <h3 className="text-h3 text-text-primary">Pin Colors</h3>
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
          Click an asset pin to view its details and checklists directly from the floor plan.
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
      description="Manage stock and materials"
    >
      <div className="space-y-6">
        <p className="text-body text-text-primary">
          The Inventory module tracks materials and equipment stock levels. Monitor what's
          available, what's been used, and when to reorder.
        </p>

        <h3 className="text-h3 text-text-primary">Inventory Item Properties</h3>
        <ul className="list-disc list-inside text-body text-text-secondary space-y-2 ml-4">
          <li><strong>Name</strong> - Item name</li>
          <li><strong>SKU</strong> - Stock keeping unit code</li>
          <li><strong>Quantity</strong> - Current stock level</li>
          <li><strong>Unit</strong> - Measurement unit (pcs, m, kg, etc.)</li>
          <li><strong>Min Quantity</strong> - Reorder threshold</li>
          <li><strong>Category</strong> - Item category</li>
        </ul>

        <h3 className="text-h3 text-text-primary">Stock Movements</h3>
        <p className="text-body text-text-secondary">
          Track stock changes with movement types:
        </p>
        <FeatureList
          features={[
            {
              icon: <Package size={20} />,
              title: 'RECEIVED',
              description: 'Items added to stock from suppliers.',
            },
            {
              icon: <Box size={20} />,
              title: 'CONSUMED',
              description: 'Items used during installation.',
            },
            {
              icon: <ChevronRight size={20} />,
              title: 'RETURNED',
              description: 'Items returned to stock.',
            },
            {
              icon: <Settings size={20} />,
              title: 'ADJUSTED',
              description: 'Stock corrections after inventory count.',
            },
          ]}
        />

        <h3 className="text-h3 text-text-primary">Low Stock Alerts</h3>
        <p className="text-body text-text-secondary">
          Items with quantity below the minimum threshold are highlighted in the inventory list.
          Check the statistics at the top of the page for quick counts.
        </p>

        <Tip>
          Use the "Update Stock" button to record material consumption during work.
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
