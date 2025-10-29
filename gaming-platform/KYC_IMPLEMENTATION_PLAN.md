# KYC, Aldersverifisering og Geofencing - Implementeringsplan

## 📋 Oversikt

Denne planen beskriver hvordan vi implementerer Know Your Customer (KYC), aldersverifisering og geofencing på en profesjonell måte som oppfyller compliance-krav for betalinger og gambling.

---

## 🏗️ 1. DATABASE-STRUKTUR

### 1.1 Nye Prisma Models

```prisma
model UserVerification {
  id                String   @id @default(cuid())
  userId            String   @unique
  status            String   @default("pending") // pending, in_progress, approved, rejected, expired
  verificationLevel String   @default("basic") // basic, age_verified, full_kyc
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents         VerificationDocument[]
  
  @@index([status])
  @@index([verificationLevel])
}

model VerificationDocument {
  id                  String            @id @default(cuid())
  verificationId      String
  type                String            // id_front, id_back, selfie, proof_of_address, etc.
  documentUrl         String            // URL til dokumentet i Cloudinary
  providerReference   String?           // Referanse fra tredjepartsleverandør
  status              String            @default("pending") // pending, verified, rejected
  providerName        String?           // "jumio", "sumsub", "onfido", etc.
  metadata            Json?             // Ekstra data fra provider
  createdAt           DateTime          @default(now())
  verifiedAt          DateTime?
  verification        UserVerification  @relation(fields: [verificationId], references: [id], onDelete: Cascade)
  
  @@index([status])
  @@index([type])
}

model AgeVerification {
  id                  String   @id @default(cuid())
  userId              String   @unique
  status              String   @default("pending") // pending, verified, rejected
  dateOfBirth         DateTime?
  verifiedAge         Int?
  verificationMethod  String?  // manual, automated, third_party
  providerName        String?  // "jumio", "sumsub", etc.
  providerReference   String?
  metadata            Json?
  createdAt           DateTime @default(now())
  verifiedAt          DateTime?
  expiresAt           DateTime? // For tidsbegrensede verifiseringer
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([status])
}

model GeographicRestriction {
  id                String   @id @default(cuid())
  userId            String   @unique
  country           String   // ISO 3166-1 alpha-2 country code (e.g., "NO", "US")
  region            String?  // Optional region/state code
  ipAddress         String?
  detectedBy        String   // ip_geolocation, user_input, payment_method
  restrictionLevel  String   @default("blocked") // allowed, restricted, blocked
  reason             String?  // Hvorfor brukeren er blokkert
  verifiedAt         DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([country])
  @@index([restrictionLevel])
}

model AllowedCountry {
  id          String   @id @default(cuid())
  countryCode String  @unique // ISO 3166-1 alpha-2
  countryName String
  isActive    Boolean  @default(true)
  minAge      Int      @default(18) // Minimum alder for det landet
  restrictions Json?   // Spesifikke restriksjoner per land
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([isActive])
}

model BlockedCountry {
  id          String   @id @default(cuid())
  countryCode String  @unique // ISO 3166-1 alpha-2
  countryName String
  reason      String?  // Hvorfor landet er blokkert
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([isActive])
}
```

### 1.2 Oppdater User Model

```prisma
model User {
  // ... eksisterende felter ...
  
  verification        UserVerification?
  ageVerification    AgeVerification?
  geographicRestriction GeographicRestriction?
  
  // Nye felter for compliance
  dateOfBirth        DateTime?
  country            String? // ISO 3166-1 alpha-2
  address            String? // Sensitive data - kryptert
  phoneNumber        String? // Optional for KYC
  taxId              String? // Optional (kryptert)
}
```

---

## 🔌 2. TREDJEPARTSLEVERANDØRER

### 2.1 Anbefalte Tjenester

#### For KYC og Identity Verification:
1. **Jumio** (Anbefalt)
   - Pros: Automatisk dokumentskanning, AI-powered, GDPR-compliant
   - Cons: Dyrere
   - Best for: Full KYC med automatisk validering

2. **Sumsub** (Kostnadseffektiv)
   - Pros: God balance mellom pris og funksjonalitet, gode API-er
   - Cons: Mindre navngitt enn Jumio
   - Best for: Start-ups og vekstfasen

3. **Onfido**
   - Pros: God brukeropplevelse, solid dokumentsjekk
   - Cons: Kan være dyrere enn Sumsub
   - Best for: Hvis fokus er på UX

#### For IP-geolocation:
1. **MaxMind GeoIP2** (Anbefalt)
   - Pros: Nøyaktig, billig, enkelt API
   - Cons: Må håndtere database-oppdateringer
   - Best for: Geofencing og IP-basert lokasjon

2. **ipapi.co** / **ip-api.com**
   - Pros: Gratis tier, enkelt å bruke
   - Cons: Rate limits på gratis tier
   - Best for: Start eller testing

3. **Cloudflare Geolocation**
   - Pros: Hvis du allerede bruker Cloudflare
   - Cons: Begrenset funksjonalitet
   - Best for: Hvis du allerede er på Cloudflare

### 2.2 Miljøvariabler (.env)

```env
# KYC Provider (Jumio)
JUMIO_API_TOKEN=your_jumio_api_token
JUMIO_API_SECRET=your_jumio_api_secret
JUMIO_BASE_URL=https://api.jumio.com

# Alternativ: Sumsub
SUMSUB_APP_TOKEN=your_sumsub_app_token
SUMSUB_APP_SECRET=your_sumsub_app_secret
SUMSUB_BASE_URL=https://api.sumsub.com

# GeoIP (MaxMind)
MAXMIND_LICENSE_KEY=your_maxmind_license_key
MAXMIND_ACCOUNT_ID=your_maxmind_account_id

# Alternativ: ipapi.co
IPAPI_API_KEY=your_ipapi_key

# Compliance Settings
MINIMUM_AGE=18
REQUIRED_KYC_LEVEL=full_kyc # basic, age_verified, full_kyc
ALLOWED_COUNTRIES=NO,SE,DK,UK,US,CA # Kommaseparert liste
BLOCKED_COUNTRIES=US_NV,US_NJ,US_DE # Stater/provinser som skal blokkeres
```

---

## 📝 3. VERIFIKASJONSPROSESS

### 3.1 Verifikasjonsnivåer

**Nivå 1: Basic (Ingen verifisering)**
- Kan se innhold, men ikke spille for penger
- Kan ikke gjøre deposits/withdrawals

**Nivå 2: Age Verified**
- Minimum alder bekreftet
- Kan se alle kamper, men ikke delta i kamper med buy-in
- Kan ikke gjøre deposits/withdrawals

**Nivå 3: Full KYC**
- Identitet verifisert
- Aldersverifisering fullført
- Geografisk lokasjon godkjent
- Kan gjøre deposits/withdrawals
- Kan delta i alle kamper

### 3.2 Flyt for verifisering

```
1. Bruker registrerer seg
   └─> Sjekk geofencing (IP-basert) ved registrering
   └─> Opprett UserVerification (status: pending)

2. Bruker forsøker å gjøre deposit/joine match med buy-in
   └─> Sjekk verifikasjonsstatus
   └─> Hvis ikke verifisert: Redirect til verifikasjonsside

3. Aldersverifisering
   └─> Bruker oppgir fødselsdato
   └─> Last opp ID-dokument (forside)
   └─> Automatisk eller manuell verifisering via tredjepart
   └─> Oppdater AgeVerification status

4. Full KYC (hvis nødvendig)
   └─> Last opp ID-dokument (forside + bakside)
   └─> Selfie med ID
   └─> Proof of address (valgfritt avhengig av land)
   └─> Tredjepartsverifisering via Jumio/Sumsub
   └─> Admin kan manuelt godkjenne avvise

5. Geografisk verifisering
   └─> IP-geolocation ved registrering
   └─> Bekreftelse via betalingsmetode (hvis mulig)
   └─> Admin kan manuelt overskrive
```

---

## 🛠️ 4. API-STRUKTUR

### 4.1 Nye API Endpoints

```
POST   /api/verification/start
  - Starter verifikasjonsprosess for bruker
  - Returnerer verifikasjons-ID og upload-URLs

POST   /api/verification/upload-document
  - Upload av dokumenter (ID, selfie, etc.)
  - Returnerer dokument-ID og status

POST   /api/verification/submit
  - Sender inn verifikasjon til tredjepartsleverandør
  - Starter automatisk verifisering

GET    /api/verification/status
  - Hent gjeldende verifikasjonsstatus
  - Inkluderer status på alle dokumenter

GET    /api/verification/webhook
  - Webhook for tredjepartsleverandører
  - Mottar status-oppdateringer fra Jumio/Sumsub

POST   /api/age-verification/verify
  - Aldersverifisering med fødselsdato
  - Kan kombineres med ID-upload

GET    /api/geolocation/check
  - Sjekk brukerens geografiske lokasjon
  - Returnerer tillatt/blokkert status

POST   /api/geolocation/override
  - Admin: Overstyr geografiske restriksjoner
  - For manuelle godkjenninger

GET    /api/compliance/requirements
  - Hent hva brukeren trenger for å oppnå neste nivå
  - Returnerer liste over manglende krav
```

### 4.2 Middleware for Verifikasjonssjekk

```typescript
// middleware/verificationCheck.ts
export async function requireVerification(
  userId: string,
  requiredLevel: 'basic' | 'age_verified' | 'full_kyc'
): Promise<{ allowed: boolean; reason?: string }> {
  // Sjekk verifikasjonsstatus
  // Sjekk geografisk lokasjon
  // Returner tillatelse eller grunn for blokkering
}
```

### 4.3 Integrasjon i Eksisterende Endpoints

Oppdater disse endpoints med verifikasjonssjekk:
- `POST /api/matches` - Sjekk før match-opprettelse med buy-in
- `POST /api/matches/[id]/join` - Sjekk før join med buy-in
- `POST /api/wallet` - Sjekk før deposits
- `GET /api/wallet` - Sjekk før withdrawals

---

## 🎨 5. UI/UX IMPLEMENTERING

### 5.1 Nye Sider

1. **`/verification`** - Hovedverifikasjonsside
   - Progress indicator (3 steg)
   - Opplasting av dokumenter
   - Live status-oppdateringer

2. **`/verification/age`** - Aldersverifisering
   - Fødselsdato-input
   - ID-upload (forside)
   - Status-visning

3. **`/verification/kyc`** - Full KYC
   - Steg-for-steg guide
   - Dokument-opplasting (ID forside/bakside, selfie)
   - Real-time validering

4. **`/verification/status`** - Verifikasjonsstatus
   - Oversikt over alle verifikasjoner
   - Dokument-status
   - Historikk

### 5.2 Komponenter

- `VerificationStatus` - Badge som viser verifikasjonsnivå
- `DocumentUpload` - Drag-and-drop dokumentopplasting
- `GeolocationCheck` - Viser land og status
- `AgeVerificationForm` - Aldersverifiseringsskjema
- `ComplianceGate` - Blokkerer actions hvis ikke verifisert

### 5.3 Integrasjon i Eksisterende UI

- **Dashboard**: Viser verifikasjonsstatus og hva som mangler
- **Match Creation**: Blokkerer hvis ikke verifisert
- **Wallet Page**: Redirecter til verifikasjon hvis ikke godkjent
- **Header/Navbar**: Verification status badge

---

## 👨‍💼 6. ADMIN-FUNKSJONALITET

### 6.1 Admin Pages

1. **`/admin/verifications`** - Oversikt over alle verifikasjoner
   - Filter: status, nivå, dato
   - Søk på bruker
   - Bulk-actions

2. **`/admin/verifications/[id]`** - Detaljert visning
   - Vis alle dokumenter
   - Manuell godkjenning/avvisning
   - Kommentarfelt
   - Aktivitetlogg

3. **`/admin/geolocation`** - Geolocation management
   - Liste over tillatte/blokkerte land
   - Legg til/fjern land
   - Oversikt over brukere per land

4. **`/admin/compliance-settings`** - Compliance-innstillinger
   - Minimum alder
   - Påkrevde KYC-nivåer
   - Tillatte/blokkerte land

### 6.2 Admin Features

- **Manuell godkjenning**: Admin kan godkjenne avvise verifikasjoner
- **Override geolocation**: Unntak for spesifikke brukere
- **Compliance-rapporter**: Eksport av verifikasjonsdata
- **Notifikasjoner**: Varsler ved nye verifikasjoner som trenger godkjenning

---

## 🔒 7. SIKKERHET OG COMPLIANCE

### 7.1 Datasikkerhet

- **Kryptering**: Følsomme data (fødselsdato, adresse, skattenummer) skal krypteres
- **GDPR**: Rett til sletting, dataminimering, privacy by design
- **Datalagring**: Dokumenter lagres i Cloudinary med begrenset tilgang
- **Audit Log**: All KYC-aktivitet logges i ActivityLog

### 7.2 Compliance-krav

- **Age Verification**: Påkrevd i de fleste jurisdiksjoner
- **KYC**: Påkrevd for finansielle transaksjoner over visse beløp
- **Geofencing**: Påkrevd for gambling i mange land
- **Retention Policy**: Hvor lenge dokumenter skal lagres (vanligvis 5-7 år)

### 7.3 Rate Limiting

- Begrens antall verifikasjonsforsøk per bruker
- Begrens antall dokument-uploads per time
- IP-basert rate limiting for geolocation checks

---

## 📦 8. IMPLEMENTERINGSREKKEFØLGE

### Fase 1: Grunnleggende struktur (Uke 1-2)
1. Legg til Prisma models
2. Opprett database-migrasjoner
3. Bygg grunnleggende API-endpoints
4. Lag admin-oversikt (utvikling)

### Fase 2: Geofencing (Uke 2-3)
1. Integrer GeoIP-tjeneste
2. IP-deteksjon ved registrering/login
3. Blokker deposits/match-joining basert på lokasjon
4. Admin-oversikt for geolocation

### Fase 3: Aldersverifisering (Uke 3-4)
1. Fødselsdato-input og validering
2. ID-dokument upload
3. Integrer tredjepartsleverandør (Sumsub/Jumio)
4. Automatisk/manuell godkjenning
5. UI for aldersverifisering

### Fase 4: Full KYC (Uke 4-6)
1. Flere dokumenttyper (ID bakside, selfie, proof of address)
2. Fullt verifikasjonsflyt
3. Webhook-håndtering fra tredjepartsleverandør
4. Manuell admin-godkjenning
5. Compliance-rapportering

### Fase 5: Integrasjon og testing (Uke 6-7)
1. Integrer verifikasjonssjekk i alle relevante endpoints
2. UI-basert verifikasjonsgate
3. Testing av hele flyten
4. Security audit
5. Performance-optimalisering

### Fase 6: Produksjon og monitoring (Uke 7-8)
1. Deploy til staging
2. End-to-end testing
3. Monitoring og logging
4. Produksjonsdeploy
5. Dokumentasjon

---

## 💰 9. KOSTNADSANSLAG

### Tredjepartstjenester (månedlig):
- **Sumsub**: ~$0.10-0.50 per verifisering (avhengig av volum)
- **Jumio**: ~$0.50-2.00 per verifisering
- **MaxMind GeoIP2**: ~$99-500/mnd (avhengig av volum)

### Egenutvikling:
- Estimert tid: 6-8 uker (1 utvikler)
- Anbefalt: Start med Sumsub + MaxMind for kostnadseffektivitet

---

## ⚠️ 10. VIKTIGE OVERVEIELSER

### 10.1 Juridisk Compliance
- **Consult advokat** spesialisert på gambling/compliance
- Avhengig av hvilke land du opererer i, kan kravene variere
- USA har state-by-state regler (mange stater blokkerer gambling)
- EU har GDPR som påvirker datalagring

### 10.2 Brukeropplevelse
- Ikke gjør verifikasjonen for tung
- Gi klar feedback på hva som mangler
- La brukere kunne bruke appen (begrenset) mens de venter på godkjenning

### 10.3 Skalering
- Automatisk verifisering der mulig
- Manuell review kun når nødvendig
- Caching av geolocation-data
- Rate limiting for å unngå misbruk

### 10.4 Backup-plan
- Hvis tredjepartsleverandør går ned, ha manuell prosess
- Lagre dokumenter lokalt også (kryptert)
- Admin kan alltid manuelt godkjenne

---

## 📚 11. DOKUMENTASJON

- API-dokumentasjon for alle nye endpoints
- Admin-guide for verifikasjonsgodkjenning
- Brukerguide for verifikasjonsprosess
- Compliance-dokumentasjon
- Incident response plan for datasikkerhet

---

## 🎯 12. NESTE STEG

1. **Godkjenn denne planen** med teamet og stakeholders
2. **Velg tredjepartsleverandør** (anbefaler Sumsub for start)
3. **Konsulter juridisk** for compliance-krav
4. **Start med Fase 1**: Database-struktur og grunnleggende API
5. **Test grundig** før produksjonsdeploy

---

## 📞 Støtte

Spørsmål eller behov for justeringer? Diskuter med teamet før implementering starter.

