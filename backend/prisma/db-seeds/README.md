# DB Seeds

Seed scripts για τη βάση δεδομένων του Synax.

## Διαθέσιμα Seeds

### seed-dropdowns.ts
Γεμίζει **μόνο** τα lookup tables για τα dropdowns:
- `LookupRoomType` - Τύποι δωματίων (47 items)
- `LookupInventoryUnit` - Μονάδες μέτρησης (27 items)
- `LookupIssueCause` - Αιτίες προβλημάτων (26 items)
- `LookupManufacturer` - Κατασκευαστές (45 items)
- `AssetType` - Τύποι εξοπλισμού με checklist templates (16 items)
- `LookupAssetModel` - Μοντέλα εξοπλισμού (85+ items)

## Εκτέλεση

```bash
# Από τον φάκελο backend/
cd backend

# Με tsx (recommended)
npx tsx prisma/db-seeds/seed-dropdowns.ts

# Ή με ts-node
npx ts-node --esm prisma/db-seeds/seed-dropdowns.ts
```

## Σημειώσεις

- Τα seeds χρησιμοποιούν **upsert** - μπορείς να τα τρέξεις πολλές φορές χωρίς πρόβλημα
- Δεν διαγράφουν υπάρχοντα δεδομένα
- Ενημερώνουν τα υπάρχοντα records αν αλλάξουν οι τιμές
- Είναι **ανεξάρτητα** από τα project seeds (δεν δημιουργούν users, projects, κτλ)
