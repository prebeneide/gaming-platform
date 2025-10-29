# Geofencing Test Guide

## ✅ Hvordan teste at geofencing fungerer

### 1. **Test ved å legge til blokkert land**

#### Steg-for-steg:
1. Gå til `/admin/geolocation`
2. Legg til et test-land (f.eks. "US" - United States) i blocked countries
3. Logg ut og opprett en ny test-bruker (eller bruk VPN)
4. Prøv å gjøre en deposit eller joine en match med buy-in
5. Du skal få en feilmelding som blokkerer handlingen

### 2. **Test ved å sjekke brukers lokasjon**

#### Via Admin Panel:
1. Gå til `/admin/users/[user-id]`
2. Sjekk om brukeren har en `GeographicRestriction` record
3. Se hvilket land som er detektert
4. Se om restrictionLevel er "blocked" eller "allowed"

#### Via API:
```
GET /api/geolocation/check
```
Dette returnerer:
```json
{
  "country": "US",
  "isAllowed": false,
  "restrictionLevel": "blocked",
  "reason": "Country is blocked by administrator"
}
```

### 3. **Test Allowlist (hvis aktivert)**

1. Legg til noen land i "Allowed Countries" (f.eks. NO, SE, DK)
2. **Ikke** legg til et annet land i blocked list
3. Test fra et land som IKKE er i allowed list (f.eks. US)
4. Det skal blokkere (fordi det ikke er i allowed list)

### 4. **Test fra forskjellige IP-adresser**

#### Metoder for testing:
- **VPN**: Bruk VPN-tjeneste til å simulere forskjellige land
- **Test-brukere**: Opprett test-brukere og manuelt sett deres lokasjon
- **Admin override**: Test admin override-funksjonaliteten

### 5. **Verifiser at det faktisk blokkerer**

#### Test scenarios:

**Scenario A: Blokkert land**
1. Legg til "US" i blocked countries
2. Simuler bruker fra USA (VPN eller manuell override)
3. Prøv deposit → Skal gi feilmelding
4. Prøv å opprette match med buy-in → Skal gi feilmelding
5. Prøv å joine match med buy-in → Skal gi feilmelding

**Scenario B: Tillatt land**
1. Fjern eller deaktiver "US" fra blocked countries
2. Eller legg til "US" i allowed countries (hvis allowlist er aktiv)
3. Simuler bruker fra USA
4. Prøv deposit → Skal fungere
5. Prøv match med buy-in → Skal fungere

### 6. **Sjekk Activity Logs**

1. Gå til `/admin/users/[user-id]` → Activities tab
2. Se etter geofencing-relaterte logs
3. Verifiser at location checks logges

### 7. **Manuell Admin Override Test**

1. Gå til `/admin/users/[user-id]`
2. Legg merke til at brukeren har `GeographicRestriction`
3. Bruk admin override for å tillate brukeren selv om landet er blokkert
4. Verifiser at brukeren nå kan gjøre deposits/joine matches

---

## 🔍 **Hvordan sjekke at IP-geolocation fungerer**

### Via Browser Console:

```javascript
// Test API-endpoint direkte i browser console
fetch('/api/geolocation/check')
  .then(res => res.json())
  .then(data => console.log('My location:', data));
```

### Via Server Logs:

Sjekk terminalen hvor Next.js kjører. Du skal se:
- `Creating allowed country with data: {...}`
- `Successfully created allowed country: {...}`
- Eventuelle errors med stack traces

---

## ⚠️ **Vanlige problemer og løsninger**

### Problem: "Could not determine country from IP"
- **Årsak**: IP er localhost eller private IP
- **Løsning**: Test fra produksjon eller bruk VPN

### Problem: "Country is not in the allowed list"
- **Årsak**: Allowlist er aktivert og landet er ikke i listen
- **Løsning**: Legg til landet i allowed countries, eller fjern allowlist

### Problem: Geolocation API feiler
- **Årsak**: ipapi.co free tier er utbrukt (1000 requests/dag)
- **Løsning**: Vent til reset eller oppgrader til paid tier

---

## 📊 **Monitoring og verifisering**

### Når systemet kjører i produksjon:

1. **Check admin dashboard** for blocked/allowed countries
2. **Monitor errors** i server logs for geofencing-relaterte feil
3. **Review user complaints** - hvis brukere fra tillatte land får blokkering
4. **Check activity logs** for geofencing-checks

---

## 🎯 **Quick Test Checklist**

- [ ] Kan legge til blocked country i admin
- [ ] Kan legge til allowed country i admin  
- [ ] IP-geolocation fungerer (sjekk via `/api/geolocation/check`)
- [ ] Deposit er blokkert for blocked countries
- [ ] Match creation (med buy-in) er blokkert for blocked countries
- [ ] Match joining (med buy-in) er blokkert for blocked countries
- [ ] Admin kan override user restrictions
- [ ] Activity logs viser geofencing-checks

