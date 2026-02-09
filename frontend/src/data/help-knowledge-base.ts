// Help Bot Knowledge Base - Decision Tree Structure
// Each node has an id, label, and either children (sub-categories) or content (final answer)

export interface HelpNode {
  id: string;
  label: string;
  icon?: string;
  children?: HelpNode[];
  content?: string;
  keywords?: string[]; // for search matching
  route?: string; // which page this help relates to
}

export const helpTree: HelpNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'FolderKanban',
    children: [
      {
        id: 'dashboard-overview',
        label: 'Τι δείχνει το Dashboard;',
        route: '/dashboard',
        keywords: ['dashboard', 'αρχική', 'στατιστικά', 'overview', 'charts'],
        content: `**Dashboard Overview:**

Το Dashboard είναι η αρχική σελίδα και δείχνει συνοπτικά:

- **Κάρτες στατιστικών** - Projects, Buildings, Assets, Issues
- **Γραφήματα** - Κατάσταση εξοπλισμού, issues ανά priority
- **Πρόσφατη δραστηριότητα** - Τελευταίες αλλαγές
- **Open Issues** - Ανοιχτά προβλήματα

**Tip:** Κάνε hover πάνω σε γραφήματα για λεπτομέρειες.`,
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects & Clients',
    icon: 'FolderKanban',
    children: [
      {
        id: 'project-create',
        label: 'Πώς δημιουργώ νέο Project;',
        route: '/projects',
        keywords: ['project', 'νέο', 'δημιουργία', 'create', 'έργο'],
        content: `**Δημιουργία Νέου Project:**

1. Πήγαινε στο **Projects** από το sidebar
2. Πάτα το κουμπί **"+ New Project"** πάνω δεξιά
3. Συμπλήρωσε τα πεδία:
   - **Όνομα** (υποχρεωτικό)
   - **Πελάτης** (επιλογή από λίστα)
   - **Διεύθυνση**
   - **Κατάσταση** (Planning, In Progress, Completed)
4. Πάτα **"Create"**

Το project θα εμφανιστεί στη λίστα και μπορείς να αρχίσεις να προσθέτεις κτίρια.`,
      },
      {
        id: 'project-edit',
        label: 'Πώς επεξεργάζομαι ένα Project;',
        route: '/projects',
        keywords: ['project', 'edit', 'επεξεργασία', 'αλλαγή', 'τροποποίηση'],
        content: `**Επεξεργασία Project:**

1. Πήγαινε στο **Projects**
2. Κάνε κλικ στο project που θέλεις
3. Πάτα το **εικονίδιο μολυβιού** ή **"Edit"**
4. Άλλαξε τα πεδία που θέλεις
5. Πάτα **"Save"**`,
      },
      {
        id: 'client-create',
        label: 'Πώς προσθέτω Πελάτη;',
        route: '/clients',
        keywords: ['client', 'πελάτης', 'νέος', 'προσθήκη'],
        content: `**Προσθήκη Νέου Πελάτη:**

1. Πήγαινε στο **Clients** από το sidebar
2. Πάτα **"+ New Client"**
3. Συμπλήρωσε:
   - **Όνομα** (υποχρεωτικό)
   - **Email, Τηλέφωνο**
   - **Εταιρεία, ΑΦΜ**
4. Πάτα **"Create"**

Ο πελάτης θα είναι διαθέσιμος στη λίστα επιλογών κατά τη δημιουργία Project.`,
      },
    ],
  },
  {
    id: 'buildings',
    label: 'Buildings & Floors',
    icon: 'Building2',
    children: [
      {
        id: 'building-create',
        label: 'Πώς προσθέτω Κτίριο;',
        route: '/buildings',
        keywords: ['building', 'κτίριο', 'νέο', 'προσθήκη'],
        content: `**Προσθήκη Κτιρίου:**

1. Πήγαινε σε ένα **Project**
2. Στην καρτέλα **Buildings**, πάτα **"+ Add Building"**
3. Συμπλήρωσε:
   - **Όνομα** (π.χ. "Κτίριο Α")
   - **Διεύθυνση** (προαιρετικά)
4. Πάτα **"Create"**

Μετά μπορείς να προσθέσεις ορόφους μέσα στο κτίριο.`,
      },
      {
        id: 'floor-create',
        label: 'Πώς προσθέτω Όροφο;',
        route: '/floors',
        keywords: ['floor', 'όροφος', 'νέος', 'προσθήκη', 'κάτοψη'],
        content: `**Προσθήκη Ορόφου:**

1. Μπες σε ένα **Building**
2. Πάτα **"+ Add Floor"**
3. Συμπλήρωσε:
   - **Όνομα** (π.χ. "1ος Όροφος")
   - **Αριθμός ορόφου**
4. Πάτα **"Create"**

**Σημαντικό:** Μπορείς να ανεβάσεις κάτοψη (floor plan image) αφού δημιουργήσεις τον όροφο.`,
      },
      {
        id: 'floor-plan-upload',
        label: 'Πώς ανεβάζω κάτοψη;',
        route: '/floors',
        keywords: ['κάτοψη', 'plan', 'upload', 'εικόνα', 'σχέδιο', 'floor plan'],
        content: `**Ανέβασμα Κάτοψης:**

1. Μπες στη σελίδα ενός **Floor**
2. Πάτα **"Upload Plan"** ή σύρε μια εικόνα στην περιοχή
3. Υποστηριζόμενοι τύποι: **JPG, PNG, PDF**
4. Η κάτοψη θα εμφανιστεί και μπορείς να τοποθετήσεις pins πάνω της

**Tip:** Χρησιμοποίησε εικόνα με καλή ανάλυση για ευκρίνεια στο zoom.`,
      },
    ],
  },
  {
    id: 'rooms',
    label: 'Rooms',
    icon: 'DoorOpen',
    children: [
      {
        id: 'room-create',
        label: 'Πώς δημιουργώ Δωμάτιο;',
        route: '/rooms',
        keywords: ['room', 'δωμάτιο', 'χώρος', 'νέο', 'δημιουργία'],
        content: `**Δημιουργία Δωματίου:**

1. Μπες σε ένα **Floor**
2. Πάτα **"+ Add Room"**
3. Συμπλήρωσε:
   - **Όνομα** (π.χ. "Γραφείο 101")
   - **Τύπος** (Office, Server Room, Storage κλπ.)
   - **Εμβαδόν** (τ.μ.)
4. Πάτα **"Create"**

Το δωμάτιο θα εμφανιστεί στη λίστα και μπορείς να το τοποθετήσεις στην κάτοψη.`,
      },
      {
        id: 'room-pin',
        label: 'Πώς τοποθετώ δωμάτιο στην κάτοψη;',
        route: '/floors',
        keywords: ['pin', 'τοποθέτηση', 'κάτοψη', 'drag', 'σύρε'],
        content: `**Τοποθέτηση Δωματίου στην Κάτοψη:**

1. Μπες στη σελίδα του **Floor**
2. Πάτα **"Edit Mode"** (εικονίδιο μολυβιού)
3. Θα εμφανιστούν τα δωμάτια ως **pins** (πινέζες)
4. **Σύρε** ένα pin στη σωστή θέση στην κάτοψη
5. Πάτα **"Save"** για να αποθηκεύσεις τις θέσεις

Κάνε κλικ σε ένα pin για να δεις πληροφορίες ή να πλοηγηθείς στο δωμάτιο.`,
      },
    ],
  },
  {
    id: 'assets',
    label: 'Assets & Equipment',
    icon: 'Box',
    children: [
      {
        id: 'asset-create',
        label: 'Πώς προσθέτω Εξοπλισμό;',
        route: '/assets',
        keywords: ['asset', 'εξοπλισμός', 'νέος', 'προσθήκη', 'equipment'],
        content: `**Προσθήκη Εξοπλισμού:**

1. Πήγαινε στο **Assets** από το sidebar
2. Πάτα **"+ New Asset"**
3. Συμπλήρωσε:
   - **Τύπος** (Switch, Router, Camera κλπ.)
   - **Μοντέλο / Κατασκευαστής**
   - **Project** (σε ποιο ανήκει)
   - **Floor / Room** (που θα εγκατασταθεί)
   - **Κατάσταση** (In Stock, Planned, Installed)
4. Πάτα **"Create"**`,
      },
      {
        id: 'asset-install',
        label: 'Πώς τοποθετώ εξοπλισμό στο σχέδιο;',
        route: '/floors',
        keywords: ['asset', 'install', 'εγκατάσταση', 'τοποθέτηση', 'pin', 'σχέδιο'],
        content: `**Τοποθέτηση Εξοπλισμού στο Σχέδιο:**

1. Μπες στη σελίδα ενός **Floor** ή **Room**
2. Πάτα **"Edit Mode"**
3. Τα assets εμφανίζονται ως **χρωματιστά pins**
4. **Σύρε** κάθε pin στη σωστή θέση
5. Πάτα **"Save"**

**Χρώματα pins:**
- Πράσινο = Installed
- Κίτρινο = Planned
- Μπλε = In Stock`,
      },
      {
        id: 'asset-qr',
        label: 'Πώς σκανάρω QR code εξοπλισμού;',
        route: '/assets',
        keywords: ['qr', 'scan', 'σκάναρε', 'κώδικας', 'barcode'],
        content: `**Σκανάρισμα QR Code:**

1. Πάτα το **εικονίδιο QR** στο header (πάνω δεξιά)
2. Δώσε πρόσβαση στην κάμερα
3. Σκάναρε τον QR κώδικα του εξοπλισμού
4. Θα μεταφερθείς αυτόματα στη σελίδα του asset

**Tip:** Μπορείς να εκτυπώσεις QR labels από τη σελίδα **Labels**.`,
      },
    ],
  },
  {
    id: 'drawing',
    label: 'Drawing & Σχεδίαση',
    icon: 'Pencil',
    children: [
      {
        id: 'drawing-start',
        label: 'Πώς σχεδιάζω στην κάτοψη;',
        route: '/floors',
        keywords: ['drawing', 'σχεδίαση', 'draw', 'γραμμή', 'σχήμα'],
        content: `**Σχεδίαση στην Κάτοψη:**

1. Μπες σε ένα **Floor** ή **Room**
2. Πάτα **"Fullscreen"** (εικονίδιο πλήρους οθόνης)
3. Θα εμφανιστεί η **toolbar σχεδίασης** στα αριστερά
4. Επίλεξε εργαλείο:
   - **Rectangle** - Ορθογώνιο
   - **Circle** - Κύκλος
   - **Line** - Γραμμή
   - **Free Draw** - Ελεύθερο σχέδιο
   - **Text** - Κείμενο
   - **Cable** - Καλωδίωση
5. Σχεδίασε στην κάτοψη
6. Πάτα **"Save"** για αποθήκευση

**Tip:** Μπορείς να αλλάξεις χρώμα, πάχος γραμμής και opacity από το **Properties Panel** (δεξιά).`,
      },
      {
        id: 'drawing-cable',
        label: 'Πώς σχεδιάζω καλωδίωση;',
        route: '/floors',
        keywords: ['cable', 'καλώδιο', 'καλωδίωση', 'σύνδεση'],
        content: `**Σχεδίαση Καλωδίωσης:**

1. Μπες σε **Fullscreen** mode σε ένα Floor ή Room
2. Επίλεξε το εργαλείο **"Cable"** από τη toolbar
3. Κάνε κλικ σε ένα **asset pin** (αρχή καλωδίου)
4. Κάνε κλικ σε δεύτερο **asset pin** (τέλος καλωδίου)
5. Επίλεξε τον **τύπο καλωδίου** από το popup
6. Το καλώδιο θα εμφανιστεί ως γραμμή μεταξύ των assets

**Tip:** Τα καλώδια ακολουθούν τα assets - αν μετακινήσεις ένα pin, το καλώδιο προσαρμόζεται.`,
      },
    ],
  },
  {
    id: 'checklists',
    label: 'Checklists & Issues',
    icon: 'ClipboardCheck',
    children: [
      {
        id: 'checklist-create',
        label: 'Πώς δημιουργώ Checklist;',
        route: '/checklists',
        keywords: ['checklist', 'λίστα', 'έλεγχος', 'δημιουργία'],
        content: `**Δημιουργία Checklist:**

1. Πήγαινε στο **Checklists**
2. Πάτα **"+ New Checklist"**
3. Επίλεξε:
   - **Template** (από τα διαθέσιμα templates)
   - **Project**, **Building**, **Floor** (που αφορά)
   - **Assigned to** (ποιος θα το εκτελέσει)
4. Πάτα **"Create"**

Τα items του checklist έρχονται από το template. Ο assigned user μπορεί να τα τσεκάρει.`,
      },
      {
        id: 'issue-create',
        label: 'Πώς αναφέρω Issue/Πρόβλημα;',
        route: '/issues',
        keywords: ['issue', 'πρόβλημα', 'αναφορά', 'bug', 'ζήτημα'],
        content: `**Αναφορά Issue:**

1. Πήγαινε στο **Issues**
2. Πάτα **"+ New Issue"**
3. Συμπλήρωσε:
   - **Τίτλος** (περιγραφή προβλήματος)
   - **Priority** (Low, Medium, High, Critical)
   - **Project / Floor / Room** (που εντοπίστηκε)
   - **Assigned to** (ποιος θα το διορθώσει)
   - **Φωτογραφίες** (προαιρετικά)
4. Πάτα **"Create"**

Τα issues εμφανίζονται στο dashboard και μπορούν να φιλτραριστούν ανά κατάσταση.`,
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Αποθήκη',
    icon: 'Warehouse',
    children: [
      {
        id: 'inventory-view',
        label: 'Πώς βλέπω τι εξοπλισμό έχω;',
        route: '/inventory',
        keywords: ['inventory', 'αποθήκη', 'stock', 'απόθεμα', 'διαθέσιμα'],
        content: `**Προβολή Αποθήκης:**

1. Πήγαινε στο **Inventory** από το sidebar
2. Θα δεις λίστα με όλο τον εξοπλισμό
3. Φιλτράρισε ανά:
   - **Κατάσταση** (In Stock, Planned, Installed)
   - **Τύπο** εξοπλισμού
   - **Project**
4. Κάνε κλικ σε ένα item για λεπτομέρειες

**In Stock** = Διαθέσιμος στην αποθήκη
**Planned** = Παραγγελμένος, δεν έχει παραληφθεί
**Installed** = Τοποθετημένος στο χώρο`,
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Labels',
    icon: 'FileText',
    children: [
      {
        id: 'report-generate',
        label: 'Πώς δημιουργώ Report;',
        route: '/reports',
        keywords: ['report', 'αναφορά', 'pdf', 'εξαγωγή', 'export'],
        content: `**Δημιουργία Report:**

1. Πήγαινε στο **Reports**
2. Επίλεξε **Project**
3. Δες τα στατιστικά: assets, rooms, checklists
4. Πάτα **"Export PDF"** για εξαγωγή

Το PDF περιλαμβάνει: γενικά στοιχεία, στατιστικά, κατάσταση εξοπλισμού, κατόψεις.`,
      },
      {
        id: 'label-print',
        label: 'Πώς εκτυπώνω Labels/QR;',
        route: '/labels',
        keywords: ['label', 'ετικέτα', 'εκτύπωση', 'qr', 'print'],
        content: `**Εκτύπωση Labels:**

1. Πήγαινε στο **Labels**
2. Επίλεξε **Project** και **φίλτρα**
3. Θα εμφανιστούν τα assets με QR codes
4. Πάτα **"Print"** για εκτύπωση

Κάθε label περιέχει: QR code, όνομα asset, τοποθεσία, τύπο.`,
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar & Messenger',
    icon: 'CalendarDays',
    children: [
      {
        id: 'calendar-event',
        label: 'Πώς δημιουργώ Event;',
        route: '/calendar',
        keywords: ['calendar', 'ημερολόγιο', 'event', 'ραντεβού', 'συνάντηση'],
        content: `**Δημιουργία Event:**

1. Πήγαινε στο **Calendar**
2. Κάνε κλικ σε μια **ημερομηνία** ή πάτα **"+ New Event"**
3. Συμπλήρωσε:
   - **Τίτλος**
   - **Ημ/νία & Ώρα** (έναρξη - λήξη)
   - **Περιγραφή**
   - **Project** (προαιρετικά)
4. Πάτα **"Create"**

Τα events εμφανίζονται στο calendar view (μήνας/εβδομάδα/ημέρα).

**Tip:** Μπορείς να σύρεις events για αλλαγή ημερομηνίας (drag & drop).`,
      },
      {
        id: 'calendar-recurring',
        label: 'Πώς δημιουργώ επαναλαμβανόμενο Event;',
        route: '/calendar',
        keywords: ['recurring', 'επαναλαμβανόμενο', 'repeat', 'daily', 'weekly', 'monthly'],
        content: `**Επαναλαμβανόμενο Event:**

1. Δημιούργησε ένα **νέο Event**
2. Ενεργοποίησε **"Recurring"**
3. Επίλεξε συχνότητα:
   - **Daily** - Κάθε μέρα
   - **Weekly** - Κάθε εβδομάδα
   - **Monthly** - Κάθε μήνα
4. Πάτα **"Create"**

Τα επαναλαμβανόμενα events εμφανίζονται με ειδικό εικονίδιο στο calendar.`,
      },
      {
        id: 'messenger-use',
        label: 'Πώς στέλνω μήνυμα;',
        route: '/messenger',
        keywords: ['messenger', 'μήνυμα', 'chat', 'συνομιλία', 'message'],
        content: `**Αποστολή Μηνύματος:**

1. Πήγαινε στο **Messenger**
2. Επίλεξε μια **υπάρχουσα συνομιλία** ή δημιούργησε νέα
3. Γράψε το μήνυμά σου στο πεδίο κάτω
4. Πάτα **Enter** ή το **Send** button

**Features:**
- Emoji picker
- Αποστολή αρχείων (file attachments)
- Group conversations
- Real-time ενημερώσεις (WebSocket)`,
      },
      {
        id: 'messenger-file',
        label: 'Πώς στέλνω αρχείο στο Messenger;',
        route: '/messenger',
        keywords: ['file', 'αρχείο', 'attachment', 'upload', 'στέλνω'],
        content: `**Αποστολή Αρχείου:**

1. Μπες σε μια **συνομιλία**
2. Πάτα το **εικονίδιο συνδετήρα** (attachment)
3. Επίλεξε αρχείο από τον υπολογιστή σου
4. Θα εμφανιστεί preview αν είναι εικόνα
5. Πάτα **Send**

Υποστηρίζονται: εικόνες, PDF, documents κ.ά.`,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Προφίλ',
    icon: 'HelpCircle',
    children: [
      {
        id: 'settings-profile',
        label: 'Πώς αλλάζω το προφίλ μου;',
        route: '/settings',
        keywords: ['profile', 'προφίλ', 'όνομα', 'email', 'avatar', 'φωτογραφία'],
        content: `**Αλλαγή Προφίλ:**

1. Πήγαινε στο **Settings** (εικονίδιο γρανάζι, κάτω αριστερά)
2. Στην ενότητα **Profile**:
   - Άλλαξε **Όνομα**
   - Άλλαξε **Email**
   - Ανέβασε **Avatar** (φωτογραφία προφίλ)
3. Πάτα **"Save"**`,
      },
      {
        id: 'settings-password',
        label: 'Πώς αλλάζω τον κωδικό μου;',
        route: '/settings',
        keywords: ['password', 'κωδικός', 'αλλαγή', 'change password'],
        content: `**Αλλαγή Κωδικού:**

1. Πήγαινε στο **Settings**
2. Στην ενότητα **Change Password**:
   - Βάλε τον **τρέχοντα κωδικό**
   - Βάλε τον **νέο κωδικό** (τουλάχιστον 6 χαρακτήρες)
3. Πάτα **"Change Password"**`,
      },
      {
        id: 'settings-notifications',
        label: 'Πώς ρυθμίζω τις ειδοποιήσεις;',
        route: '/settings',
        keywords: ['notification', 'ειδοποίηση', 'email', 'notify'],
        content: `**Ρυθμίσεις Ειδοποιήσεων:**

1. Πήγαινε στο **Settings**
2. Στην ενότητα **Notifications**:
   - **Email on Issue** - Ειδοποίηση για νέα issues
   - **Email on Assignment** - Ειδοποίηση όταν σου ανατίθεται κάτι
   - **Email on Comment** - Ειδοποίηση για σχόλια
   - **Email Digest** - Περιληπτικό email
3. Ενεργοποίησε/απενεργοποίησε ό,τι θέλεις`,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin Διαχείριση',
    icon: 'HelpCircle',
    children: [
      {
        id: 'admin-users',
        label: 'Πώς διαχειρίζομαι χρήστες;',
        route: '/users',
        keywords: ['user', 'χρήστης', 'διαχείριση', 'δημιουργία', 'admin'],
        content: `**Διαχείριση Χρηστών (Admin):**

1. Πήγαινε στο **Users** (ADMIN section στο sidebar)
2. Εδώ βλέπεις όλους τους χρήστες
3. **Δημιουργία:** Πάτα **"+ New User"**, συμπλήρωσε email/password/name/role
4. **Επεξεργασία:** Κάνε κλικ στο **Edit** σε κάθε χρήστη
5. **Reset Password:** Στο edit popup, χρησιμοποίησε το **"Reset Password"** section
6. **Απενεργοποίηση:** Άλλαξε το **Active** status

**Ρόλοι:** ADMIN, PM, TECHNICIAN, CLIENT`,
      },
      {
        id: 'admin-reset-password',
        label: 'Πώς κάνω reset κωδικό χρήστη;',
        route: '/users',
        keywords: ['reset', 'password', 'κωδικός', 'admin', 'χρήστης'],
        content: `**Reset Κωδικού Χρήστη (Admin):**

1. Πήγαινε στο **Users**
2. Πάτα **Edit** στον χρήστη
3. Στο popup, πήγαινε στο **"Reset Password"** section (κάτω)
4. Βάλε τον **νέο κωδικό** (τουλάχιστον 6 χαρακτήρες)
5. Πάτα **"Reset Password"**
6. Επιβεβαίωσε στο confirmation dialog

Ο χρήστης θα πρέπει να χρησιμοποιήσει τον νέο κωδικό στο επόμενο login.`,
      },
      {
        id: 'admin-dropdowns',
        label: 'Πώς διαχειρίζομαι τα Dropdowns;',
        route: '/lookups',
        keywords: ['dropdown', 'lookup', 'τύποι', 'κατασκευαστές', 'μοντέλα', 'dropdowns'],
        content: `**Διαχείριση Dropdowns (Admin):**

1. Πήγαινε στο **Dropdowns** (ADMIN section)
2. Διαχειρίζεσαι:
   - **Room Types** - Τύποι δωματίων (Office, Server Room κλπ.)
   - **Asset Types** - Τύποι εξοπλισμού (Switch, Router κλπ.)
   - **Manufacturers** - Κατασκευαστές (Cisco, Ubiquiti κλπ.)
   - **Asset Models** - Μοντέλα εξοπλισμού
   - **Issue Causes** - Αιτίες προβλημάτων
   - **Inventory Units** - Μονάδες μέτρησης
3. Πάτα **"+ Add"** για προσθήκη νέας εγγραφής
4. Πάτα **Edit/Delete** για αλλαγή/διαγραφή`,
      },
      {
        id: 'admin-templates',
        label: 'Πώς δημιουργώ Checklist Template;',
        route: '/checklist-templates',
        keywords: ['template', 'πρότυπο', 'checklist', 'δημιουργία'],
        content: `**Δημιουργία Checklist Template (Admin):**

1. Πήγαινε στο **Templates** (ADMIN section)
2. Πάτα **"+ New Template"**
3. Συμπλήρωσε:
   - **Όνομα** template
   - **Κατηγορία**
4. Πρόσθεσε **items** (βήματα ελέγχου)
5. Πάτα **"Save"**

Τα templates χρησιμοποιούνται κατά τη δημιουργία Checklists.`,
      },
      {
        id: 'admin-feedback',
        label: 'Πώς διαχειρίζομαι το Feedback;',
        route: '/feedback',
        keywords: ['feedback', 'bug', 'change', 'διαχείριση', 'admin'],
        content: `**Διαχείριση Feedback (Admin):**

1. Πήγαινε στο **Feedback** (ADMIN section)
2. Βλέπεις λίστα με όλα τα feedback (bugs & changes)
3. **Φίλτρα:** All/Open/Resolved και All types/Bugs/Changes
4. Κάνε **κλικ σε ένα item** για λεπτομέρειες
5. Στο popup μπορείς:
   - **Αλλαγή τύπου** (Bug ↔ Change) - πάτα στο toggle
   - **Admin Notes** - Γράψε σημειώσεις
   - **Resolve/Reopen** - Αλλαγή κατάστασης
   - **Delete** - Διαγραφή
6. Δες screenshot αν υπάρχει (κλικ για fullscreen)`,
      },
    ],
  },
  {
    id: 'general',
    label: 'Γενικά & Βοήθεια',
    icon: 'HelpCircle',
    children: [
      {
        id: 'feedback-send',
        label: 'Πώς στέλνω Feedback;',
        keywords: ['feedback', 'bug', 'αναφορά', 'σφάλμα', 'πρόταση'],
        content: `**Αποστολή Feedback:**

1. Πάτα το **μωβ κουμπί** κάτω δεξιά
2. Θα γίνει αυτόματο **screenshot** της σελίδας
3. Επίλεξε τύπο:
   - **Bug** = Κάτι δεν λειτουργεί σωστά
   - **Change** = Πρόταση βελτίωσης
4. Γράψε **περιγραφή**
5. Πάτα **"Send"**

Το screenshot στέλνεται αυτόματα μαζί με το μήνυμα.`,
      },
      {
        id: 'search-use',
        label: 'Πώς ψάχνω στην εφαρμογή;',
        keywords: ['search', 'αναζήτηση', 'ψάξιμο', 'βρες', 'φίλτρο'],
        content: `**Αναζήτηση:**

Χρησιμοποίησε τη **μπάρα αναζήτησης** πάνω στο header.

- Η αναζήτηση φιλτράρει **ανά σελίδα**
- Π.χ. στα Projects ψάχνει projects, στα Assets ψάχνει assets
- Πληκτρολόγησε και τα αποτελέσματα φιλτράρονται αυτόματα
- Πάτα **✕** για να καθαρίσεις την αναζήτηση`,
      },
      {
        id: 'manual-access',
        label: 'Πού είναι το πλήρες Manual;',
        route: '/manual',
        keywords: ['manual', 'εγχειρίδιο', 'οδηγίες', 'βοήθεια', 'documentation'],
        content: `**Πλήρες Manual:**

1. Πήγαινε στο **Manual** από το sidebar (στο HELP section)
2. Θα βρεις αναλυτικές οδηγίες για κάθε module
3. Χρησιμοποίησε την **πλοήγηση αριστερά** για να πας σε συγκεκριμένο θέμα

Το Manual περιέχει αναλυτικές οδηγίες για όλα τα modules.`,
      },
      {
        id: 'roles-info',
        label: 'Ποιοι ρόλοι υπάρχουν;',
        keywords: ['role', 'ρόλος', 'admin', 'δικαιώματα', 'permissions'],
        content: `**Ρόλοι Χρηστών:**

- **ADMIN** - Πλήρης πρόσβαση σε όλα + διαχείριση χρηστών, dropdowns, templates, feedback
- **PM** (Project Manager) - Διαχείριση projects, buildings, assets, checklists, issues
- **TECHNICIAN** - Εκτέλεση checklists, αναφορά issues, προβολή assets
- **CLIENT** - Πρόσβαση σε projects που τους αφορούν

Ο Admin μπορεί να αλλάξει ρόλους από **Users** στο ADMIN section.`,
      },
    ],
  },
];

// Flatten all help items for search
export function getAllHelpItems(): (HelpNode & { parentLabel: string })[] {
  const items: (HelpNode & { parentLabel: string })[] = [];

  function traverse(nodes: HelpNode[], parentLabel: string) {
    for (const node of nodes) {
      if (node.content) {
        items.push({ ...node, parentLabel });
      }
      if (node.children) {
        traverse(node.children, node.label);
      }
    }
  }

  traverse(helpTree, '');
  return items;
}

// Search help items by query
export function searchHelp(query: string): (HelpNode & { parentLabel: string })[] {
  const items = getAllHelpItems();
  const q = query.toLowerCase().trim();

  if (!q) return [];

  return items.filter((item) => {
    const matchLabel = item.label.toLowerCase().includes(q);
    const matchContent = item.content?.toLowerCase().includes(q);
    const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
    return matchLabel || matchContent || matchKeywords;
  });
}

// Get help items relevant to a specific route
export function getHelpForRoute(pathname: string): (HelpNode & { parentLabel: string })[] {
  const items = getAllHelpItems();
  const section = '/' + pathname.split('/')[1]; // e.g. /floors/123 → /floors

  return items.filter((item) => item.route === section);
}
