EL# Claude Protocol - Συνεργασία & Αποφυγή Λαθών

## Φιλοσοφία

Είμαι συνεργάτης, όχι απλά εκτελεστής. Στόχος μου:
- Να καταλάβω τι πραγματικά χρειάζεσαι
- Να προτείνω καλύτερους τρόπους αν υπάρχουν
- Να αποφύγω λάθη με σωστή επικοινωνία
- Να σε βοηθήσω να πετύχεις το καλύτερο αποτέλεσμα

---

## Session Persistence

**ΠΑΝΤΑ διαβάζω αυτά τα αρχεία κατά την εκκίνηση:**

| Αρχείο | Σκοπός |
|--------|--------|
| `CLAUDE.md` | Project rules & instructions |
| `.claude/todo.md` | Τρέχουσες εργασίες |
| `.claude/history.md` | Ιστορικό όλων των εργασιών |
| `.claude/chat-history.md` | Πλήρες ιστορικό συνομιλίας |
| `docs/PLAN.md` | Αρχιτεκτονική, modules, database, API |
| `docs/STYLE-GUIDE.md` | UI/UX design system, colors, components |

---

## Κανόνας Chat History

**ΜΕΤΑ ΑΠΟ ΚΑΘΕ ΑΠΑΝΤΗΣΗ:**
1. Ενημερώνω το `.claude/chat-history.md` με τη νέα συνομιλία
2. Προσθέτω τι είπε ο χρήστης
3. Προσθέτω τι απάντησα
4. Ενημερώνω την "Τρέχουσα Κατάσταση"

**Αυτό είναι ΥΠΟΧΡΕΩΤΙΚΟ για κάθε απάντηση!**

---

## Πρωτόκολλο 4 Φάσεων

### ΦΑΣΗ 1 - ΚΑΤΑΝΟΗΣΗ
- Τι ΑΚΡΙΒΩΣ ζητάει ο χρήστης;
- Ερωτήσεις διευκρίνισης αν χρειάζονται
- Επιβεβαίωση κατανόησης

### ΦΑΣΗ 2 - ΣΧΕΔΙΟ & ΠΡΟΤΑΣΗ
- Ενημέρωση `.claude/todo.md`
- Παρουσίαση σχεδίου
- Εναλλακτική πρόταση αν υπάρχει καλύτερη
- Αναμονή έγκρισης σε πολύπλοκες εργασίες

### ΦΑΣΗ 3 - ΕΚΤΕΛΕΣΗ
- Ένα βήμα τη φορά
- Ακολουθώ το συμφωνημένο σχέδιο
- Αν προκύψει απρόοπτο → ΣΤΑΜΑΤΩ και ρωτάω

### ΦΑΣΗ 4 - ΕΠΑΛΗΘΕΥΣΗ & ΟΛΟΚΛΗΡΩΣΗ
- Έκανα αυτό που συμφωνήθηκε;
- Ενημέρωση history.md
- Καθαρισμός todo.md
- **Ενημέρωση chat-history.md**

---

## Αμετάκλητοι Κανόνες

### ΠΟΤΕ
- ❌ **Git commit/push χωρίς ρητή εντολή από τον χρήστη**
- ❌ Deploy χωρίς επιβεβαίωση server
- ❌ Edit χωρίς να διαβάσω πρώτα
- ❌ Destructive εντολή χωρίς έγκριση
- ❌ Υπόθεση αντί για ερώτηση
- ❌ Ξεκίνημα χωρίς todo
- ❌ Ολοκλήρωση χωρίς history update
- ❌ Απάντηση χωρίς ενημέρωση chat-history.md

### ΠΑΝΤΑ
- ✅ Ρωτάω αν δεν είναι ξεκάθαρο
- ✅ Εξηγώ πώς θα το κάνω
- ✅ Προτείνω καλύτερο τρόπο αν υπάρχει
- ✅ Διαβάζω πριν κάνω edit
- ✅ Επιβεβαιώνω server/path
- ✅ Ενημερώνω `.claude/todo.md` & `.claude/history.md`
- ✅ Διαβάζω όλα τα md μετά από compress/start
- ✅ Ανακοινώνω "ΕΝΗΜΕΡΩΘΗΚΑ ΑΠΟ ΤΑ MD"
- ✅ **Ενημερώνω το `.claude/chat-history.md` μετά από ΚΑΘΕ απάντηση**
- ✅ **Ακολουθώ το `docs/STYLE-GUIDE.md` για UI components & styling**
- ✅ **Συμβουλεύομαι το `docs/PLAN.md` για αρχιτεκτονικές αποφάσεις**

---

## Project Files

```
synax/
├── CLAUDE.md                    # Αυτό το αρχείο - κανόνες
├── README.md                    # Main project readme
├── .claude/                     # Development files
│   ├── todo.md                  # Τρέχουσες εργασίες
│   ├── history.md               # Ιστορικό ολοκληρωμένων
│   ├── chat-history.md          # Ιστορικό συνομιλίας (ΕΝΗΜΕΡΩΝΕΤΑΙ ΠΑΝΤΑ)
│   └── protocol-original.md     # Αρχικό protocol document
├── docs/                        # Project documentation
│   ├── PLAN.md                  # Αρχιτεκτονική, DB, API
│   ├── STYLE-GUIDE.md           # UI/UX design system
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DATABASE.md              # Database schema
│   ├── API.md                   # API reference
│   ├── FEATURES.md              # Feature documentation
│   ├── WORKFLOWS.md             # User workflows
│   ├── user-guides/             # Role-specific guides
│   └── deployment/              # Deployment guides
├── project.txt                  # Αρχικό specification
└── template/                    # Screenshots από Katalyst template
```
