# Blob outage recovery

The Vercel Blob store `syncbyte-uploads` exceeded the Hobby plan's 10 GB included
data transfer and was blocked: every `*.public.blob.vercel-storage.com` URL returns
`403 Your store is blocked`. The database still holds those URLs.

## Kill-switch

Set `BLOB_BLOCKED=1` (Production + Preview) to make every server-side resolver ignore
Blob URLs and fall through to the bundled `/public` fallback that each one already
has. See `lib/blob-status.ts`. **Remove the variable once the store is live again.**

## Originals needed

Drop product photos into `public/images/products/` named by the **slug** in the first
column, with any of `.webp .png .jpg .jpeg` — e.g. `k40-pro.webp`. `getProductImage()`
indexes that folder by slug, so the filename no longer has to match the product id's
exact casing.

### Product photos (49)

| slug (filename to use) | category | product |
|---|---|---|
| `attendance` | software-solutions | Attendance Software |
| `bg-dc-101` | boom-barrier | BG-DC-101 |
| `c3-100` | access-control | C3-100 |
| `d3` | face | D3 |
| `et-1000` | turnstiles | ET-1000 |
| `face-depot-7c` | face | Face Depot 7C |
| `fbl200` | flap-barriers | FBL 200 |
| `fbl500` | flap-barriers | FBL 500 |
| `fek-rw-69-02` | hotel-lock | FEK RW 69 02 |
| `fl600` | fingerprint-door-lock | FL 600 |
| `fl600ss` | fingerprint-door-lock | FL 600 SS |
| `fl900` | fingerprint-door-lock | FL 900 |
| `hrms` | software-solutions | HRMS |
| `in01a` | fingerprint | IN01-A |
| `indigo-face6` | face | Indigo Face 6 |
| `indigo-face8-pro` | face | Indigo Face 8 Pro |
| `js-39-e` | mobile-app-devices | JS 39 E |
| `k40-pro` | fingerprint | K40 Pro |
| `k45-pro` | fingerprint | K45 Pro |
| `kr26e` | rfid-readers | KR 26E |
| `kr5e` | rfid-readers | KR 5E |
| `mb30` | face | MB30 |
| `mb360` | face | MB360 |
| `mini-ac` | face | Mini AC |
| `mini-ac-plus` | face | Mini AC Plus |
| `multibio-300` | face | Multibio 300 |
| `multibio-500` | face | Multibio 500 |
| `n-access10-pro` | fingerprint | N-Access10 Pro |
| `n-bio101w` | face | N-Bio 101 W |
| `n-bioaccess` | fingerprint | N-Bio Access |
| `n-bm20-idpro` | fingerprint | N-BM20+ID Pro |
| `n-bm22` | fingerprint | N-BM22 |
| `n-bm22-face` | face | N-BM22 Face |
| `n-bm60wpro` | face | N-BM60 W Pro |
| `n-bm70-w-pro` | face | N-BM70 W Pro |
| `n-e90-pro` | fingerprint | NE90 Pro |
| `n-f22` | face | N-F22 |
| `n-fr12` | fingerprint | N-FR12 |
| `n-k30pro` | fingerprint | N-K 30 Pro |
| `payroll` | software-solutions | Payroll Software |
| `sa228` | rfid-readers | SA 228 |
| `saturn-f1000` | flap-barriers | Saturn-F1000 |
| `speed-face-m4` | face | Speed Face M4 |
| `speed-face-v5l` | face | Speed Face V5L |
| `u11d` | rfid-readers | U11-D |
| `u12i` | rfid-readers | U12-I |
| `u14` | rfid-readers | U14 UHF Reader |
| `ur10r-1f` | rfid-readers | UR 10 R-1F |
| `vega-w-poe` | fingerprint | VEGA+W+POE |

### Brand logos (5)

Destination `public/images/brands/<slug>.png`. These have no bundled logo:

- `biomax` — was `biomax-1779371512275.png`
- `crew-inc` — was `crew-inc-1788976896931.jpg`
- `mantra` — was `mantra-1779969758157.png`
- `panasonic` — was `panasonic-1779371727416.png`
- `zkteco` — was `zkteco-1779371682049.png`

### Gallery photos (1)

No bundled fallback — hidden while blocked. Re-upload via `/admin/gallery`.

- `shadowfax-technologies-ltd-corporate-office-1779372022290.jpg`

### Site downloads (8)

No bundled fallback. Still listed on `/downloads`, shown as "Temporarily unavailable".

- `device-management-tool-1780595166486.zip`
- `e-time-track-lite-1791289636446-KyvLvES4znoyD7RQHvoW5BUGpUQfJk.zip`
- `e-time-track-lite-web-1791289707045-AXk5tWQTP4uuI2cnJopkyElfUFEzTt.zip`
- `ebio-server-1780630761598-hbDngVOtZpTePeyqAScUV4lH8CP7q2.zip`
- `smart-office-desktop-1780630552349-DEyRUtEx6ERpdeKLrKJHBmzm32DlkP.zip`
- `smart-office-web-1780630657140-EkymRLc1GyKG5KJRs1StrYOYNUSanC.zip`
- `sql-server-1789033320469-d2FRiZ8JTspGpSygHeA9dd2Dk9qe3j.zip`
- `sql-server-1789033465014-RzwvIZNUR0Y9JDaDvYOL3T0AZTTL2l.zip`

## Already missing before the outage

These static products have neither a bundled image nor a Blob upload, so they were
already rendering the SVG placeholder: `bg-100-grey`, `c3-200`, `c3-400`, `et-2000`,
`mantra-l1-fp-scanner`.
