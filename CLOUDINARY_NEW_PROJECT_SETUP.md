# Cloudinary Setup for Nytt Prosjekt

Denne guiden viser deg hvordan du setter opp Cloudinary i ditt nye prosjekt med samme abonnement som gaming-platform.

## Steg 1: Installer Cloudinary

```bash
npm install cloudinary
# eller
yarn add cloudinary
```

## Steg 2: Legg til Credentials

Opprett en `.env.local` fil i roten av ditt nye prosjekt og legg til:

```env
CLOUDINARY_CLOUD_NAME=dftlla3we
CLOUDINARY_API_KEY=116141821175757
CLOUDINARY_API_SECRET=JV03OJJq2YHoheVNodljDXR7AlE
```

## Steg 3: Lag Upload API Route

Opprett en fil: `src/app/api/upload/route.ts` (eller `app/api/upload/route.ts` hvis du bruker App Router)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedTypes = [
  "image/png", "image/jpeg", "image/jpg", "image/gif",
  "video/mp4", "video/quicktime", "video/webm", "video/mov"
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ 
      error: "File type not supported. Allowed: PNG, JPG, JPEG, GIF, MP4, MOV, WEBM." 
    }, { status: 400 });
  }
  
  // Konverter til buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Last opp til Cloudinary
  try {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: "mitt-nye-prosjekt", // ← ENDRE DENNE til ditt prosjektnavn!
          resource_type: "auto" 
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });
    
    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
```

## Steg 4: Bruk Upload API i din Frontend

```typescript
// Eksempel: Opplasting av fil fra frontend
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log('File uploaded:', data.url);
    return data.url;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## Viktig: Endre Folder Navn

⚠️ **IKKE GLEM:** Endre folder navnet i linje 44 fra `"mitt-nye-prosjekt"` til noe unikt for ditt prosjekt, f.eks:

- `"min-nettside"`
- `"min-app"`
- `"produkt-navn"`
- etc.

Dette sørger for at bildene dine organiseres separat fra gaming-platform prosjektet.

## Verifiser Opplastning

Test upload ved å:

1. Start dev-serveren: `npm run dev`
2. Kall `/api/upload` med en fil
3. Sjekk Cloudinary Dashboard - bildet skal nå være i mappen `mitt-nye-prosjekt`

## Organisering

- **gaming-platform** → mapper til `gaming-platform` folder
- **ditt nye prosjekt** → mapper til `mitt-nye-prosjekt` folder (eller hva du kaller det)
- **match proofs** → mapper til `match-proofs` folder

Alle deler samme Cloudinary-abonnement, men er organisert i separate mapper! 🎉

## Troubleshooting

### "Invalid API key"
- Sjekk at `.env.local` har riktige credentials
- Restart dev-serveren etter å ha lagt til environment variables

### "Upload failed"
- Sjekk at filtypen er støttet (PNG, JPG, GIF, MP4, MOV, WEBM)
- Sjekk Cloudinary Dashboard for feilmeldinger

### Billedn ikke vises
- Verifiser at `secure_url` brukes (ikke bare `url`)
- Sjekk CORS-innstillinger hvis du henter bilder fra frontend

## Nyttige Ressurser

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Cloudinary Upload Reference](https://cloudinary.com/documentation/image_upload_api_reference)

