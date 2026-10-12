# Image storage

Product uploads now default to database storage (`PRODUCT_IMAGE_STORAGE=database`) to support Render Free without an ephemeral file dependency. Encoded image bytes are stored in `product_images`; an immutable public `/storage/products/{filename}` route serves them with the correct MIME type. The product continues to store its public image URL, preserving the deployed frontend contract. `PRODUCT_IMAGE_STORAGE=public` retains the original filesystem implementation and requires persistent storage plus storage:link. The earlier local/proxy diagnoses below are historical; the final Render Free fix supersedes the requirement to purchase a disk for new database-backed uploads.

Local setup (backend on port 8000):

```powershell
cd backend
# In .env: APP_URL=http://localhost:8000
php artisan storage:link
php artisan config:clear
```

`composer setup` now creates the storage link. Failed writes to the public disk throw an error instead of allowing an upload to report success with a bad path.

For deployment, set `APP_URL` to the public HTTPS backend origin (including a port if needed), run `php artisan storage:link`, and refresh cached configuration. The web server document root must be `backend/public` and must permit access through `public/storage`. The backend process must be able to write `storage/app/public`; the web server must be able to read it. Verify a returned image URL gives HTTP 200 and an image Content-Type.

Keep `storage/app/public` on persistent storage across releases and restarts. A serverless or ephemeral filesystem requires persistent object storage and a corresponding upload disk implementation; changing `FILESYSTEM_DISK` alone does not change this upload handler, which explicitly uses `public`. This repository's local environment does not verify any deployed hosting storage.

Legacy product upload URLs on localhost, 127.0.0.1 and IPv6 loopback under `/storage/products/` are normalized in both product APIs and upload responses, without a database migration. Existing external images and frontend assets are preserved. This fixes URL routing only: a missing physical file must be recovered from storage/backups. Old non-loopback domains require a confirmed migration target; they are not rewritten automatically.

2026-10-11 local diagnosis: APP_URL lacked backend port 8000; public/storage was absent. A real upload saved 2,184,147 bytes and returned a localhost:80 URL (connection refused). Requesting the same file at backend port 8000 returned HTTP 403 before storage:link. Existing database contained three frontend SVG assets and no earlier uploaded product files.

After repair, a new upload returned `http://localhost:8000/storage/products/...png`, fetched as HTTP 200 with `image/png` and SHA-256 identical to the original. A fresh product API request returned the same persisted URL; fetching it again and restarting the backend both succeeded with HTTP 200. All three existing SVG URLs returned HTTP 200. Backend suite: 71 tests, 541 assertions passed; frontend production build passed. No connected browser was available, so visual rendering, file selection UI, browser Network/Console, CSS and lazy loading behavior were reviewed in code but not verified in a live browser. Tests used a copy of the local database.

## Follow-up UI verification (2026-10-11)

Browser inventory still reports no apps or browsers. `npm.cmd run lint` completed with exit code 0 and no diagnostics. No frontend source changes or lint fixes were needed; neither new nor pre-existing lint errors were reported.

The follow-up started the frontend at `http://127.0.0.1:5173` and backend at `http://127.0.0.1:8000` against the original database. HTTP checks confirmed the frontend admin route returns 200, the Vite-proxied products API returns the three existing products, all three SVG images return 200 with `image/svg+xml`, and the storage junction points to the correct persistent local directory. This confirms HTTP availability, not browser rendering.

Code review: saving waits for the upload and then refetches the admin product list. Uploaded images are appended, so the table continues to show the first existing image; reopen the editor to inspect every image, or select the new thumbnail on the product detail page. This ordering is existing behavior. Admin images are not lazy loaded. The main product image is eager; storefront cards and thumbnails are lazy loaded. Relevant CSS gives images dimensions and object-fit without explicitly hiding them. Actual DOM, computed CSS, Network, Console, and visual rendering remain unverified.

Manual check with the local servers running:

1. Open `http://127.0.0.1:5173/admin/products` and sign in with an existing admin/staff account. Open DevTools Network, enable Preserve log and Disable cache, and clear Console.
2. Edit a product with fewer than eight images, select a new PNG/JPG/WebP under 5 MB, and save. Confirm `POST /api/admin/products/{id}/images` returns 200 with the new path in `data`. With default configuration it must start with `/storage/products/` and contain no localhost/127.0.0.1 origin. Confirm the subsequent product list request contains that same path.
3. Reopen the editor: confirm the new image appears among all images. A product's existing first image remains its table cover. Open `/san-pham/{slug}` for a published product and click the newly added thumbnail to inspect it as the main image.
4. In Network filter by Img (scroll lazy images into view), confirm the new image returns 200 and `Content-Type: image/...`; open its exact request URL in a new tab. Inspect Console for failed requests, mixed content, CSP, or decoding errors.
5. Reload the admin and detail pages. Reopen the editor and reselect the new thumbnail, since the detail gallery starts at the first image after reload. Confirm the new image is still present and loads.
6. Inspect the existing products `/san-pham/tram-cai-toc-hoa-sen`, `/san-pham/kieng-co-cham-hoa-van`, and `/san-pham/hoa-tai-ngoc-do`; confirm their existing SVG images visually display before and after reload. Existing uploaded files were absent from the original local database.

For DOM diagnostics select the failing `<img>` in Elements, then run this read-only Console snippet:

```javascript
const image = $0;
const box = image.getBoundingClientRect();
const css = getComputedStyle(image);
console.table({
  srcAttribute: image.getAttribute('src'),
  resolvedSrc: image.src,
  currentSrc: image.currentSrc,
  complete: image.complete,
  naturalWidth: image.naturalWidth,
  naturalHeight: image.naturalHeight,
  loading: image.loading,
  width: box.width,
  height: box.height,
  display: css.display,
  visibility: css.visibility,
  opacity: css.opacity,
});
```

For a loaded image, naturalWidth/naturalHeight should be greater than zero. If they are zero, inspect the image request and response. If they are positive but the image is invisible, inspect the image and its ancestors for zero dimensions, display:none, visibility:hidden, opacity:0, clipping, or overlays. For lazy loading, scroll the image into view and, only for diagnosis, set the selected image's `loading` to `eager` in Elements. Compare with cache disabled and enabled; do not substitute a fallback image.

## Shared links: routing repair (2026-10-11)

The actual shared URL was not supplied. No tunnel process was found; current local servers listen on loopback only. A Vercel project link exists but connected Vercel reads returned project-not-found/permission errors. Therefore LAN vs hosting vs tunnel and the live deployment configuration remain unconfirmed. No hosting release or public tunnel was created.

The confirmed code defect was that product uploads used APP_URL=http://localhost:8000 to create URLs sent directly to the recipient's browser. Such URLs refer to the recipient's machine, and HTTP image URLs can also be blocked on an HTTPS frontend.

Changes: public disk defaults to relative `/storage`, configurable via PUBLIC_STORAGE_URL for a real public CDN; Vite dev and preview proxy both `/api` and `/storage` to the same server-side API_PROXY_TARGET; frontend product mappers resolve storage paths via VITE_API_BASE_URL; legacy loopback upload URLs are normalized in API responses. Local addresses in API_PROXY_TARGET are server-side destinations, never browser image URLs.

Configure the confirmed sharing method as follows:

- Single frontend tunnel: forward the tunnel to Vite port 5173, keep VITE_API_BASE_URL empty and PUBLIC_STORAGE_URL=/storage. Vite forwards `/api` and `/storage` privately to Laravel via API_PROXY_TARGET. Add only the actual tunnel hostname to Vite's allowedHosts if Vite rejects it; do not disable host validation. The tunnel must permit POST/multipart and image GET requests. Images then use the tunnel's HTTPS scheme automatically.
- LAN: run Vite with `npm.cmd run dev -- --host 0.0.0.0`, share `http://<actual-LAN-IP>:5173`, keep the API base empty. Laravel can stay loopback-only because Vite proxies requests. Firewall/router reachability must be verified from the recipient's device. This repository has not widened listeners/firewall rules automatically without a confirmed sharing mode.
- Separate hosted frontend/backend: build with VITE_API_BASE_URL set to the actual public HTTPS backend URL ending in `/api`. Set Laravel APP_URL to that backend HTTPS origin, FRONTEND_URL to the actual frontend origin for CORS, PUBLIC_STORAGE_URL=/storage, create public/storage and use persistent storage. React resolves `/storage` to the backend HTTPS origin. A static Vercel build does not use the Vite dev proxy; keeping an empty API base requires real hosting rewrites for both `/api` and `/storage`. The repository's existing Vercel SPA rewrite supplies no backend destination.
- If using PUBLIC_STORAGE_URL explicitly, it must be an externally reachable HTTPS media URL for an HTTPS frontend, never loopback or an internal backend address.

Verification after these changes: 72 backend tests, 555 assertions passed; npm.cmd run lint and npm.cmd run build passed; 15 direct frontend URL assertions passed across simulated HTTPS same-origin, LAN, and separate HTTPS API configurations. A real multipart upload through Vite `/api` returned a relative storage URL; the Vite `/storage` request returned HTTP 200, image/png, 2,184,147 bytes with SHA-256 identical to the input. A fresh product API read and repeat image request succeeded. Three existing SVGs returned HTTP 200. The audit used a disposable copy of the database. These are local proxy/HTTP and code checks, not a verified public tunnel, HTTPS browser session, remote upload, visual rendering, or F5 test.

External acceptance check: on another device open the actual shared URL, sign in, upload a new image, reopen the editor and inspect the new image (uploads append to the gallery). Confirm the upload returns 200 and the actual img.currentSrc uses the shared frontend or configured public HTTPS backend/media origin. Open that exact URL independently; it must return an image, not HTML/login/404. Inspect Network/Console with cache disabled, then F5 and reselect the new thumbnail. Confirm both old and new images remain visible and no request targets localhost/127.0.0.1, an inaccessible port, or HTTP from an HTTPS page.

## Confirmed Vercel + Render deployment (2026-10-11)

The supplied shared URL is https://frontend-jade-zeta-89.vercel.app/admin/products. Reading its deployed JavaScript confirmed the API base is https://daisy-api-quocdai.onrender.com/api. This is a static Vercel frontend with a separate Render Laravel backend, not LAN or a frontend tunnel. The deployed admin bundle uses returned image strings directly as img src. No live DOM/browser session was available.

The public Render products endpoint returned HTTP 200 JSON with four products and ten stored upload URLs. All ten URLs use the correct public Render HTTPS origin, but every image request returned HTTP 404 and text/html. The API CORS header already allows the supplied frontend origin; the upload OPTIONS preflight returned 204, permitting POST and Authorization. Thus the confirmed live failure is file serving/storage on Render, not localhost, HTTP mixed content, or CORS. A Vercel `/api/products` request returns the SPA HTML, but the deployed client correctly calls the separate Render API and does not use that path.

The repository Docker startup omitted storage:link. It now creates storage/app/public, sets its directory ownership for Apache, and recreates the storage symlink before starting the application. The Docker ignore file now excludes the Windows public/storage junction and local uploaded files so they cannot turn the container storage link into an accidentally copied directory or package user uploads into an image.

Remote status: connected Vercel inspection returned deployment-not-found under the linked team; Render CLI reported an expired token. There is no authenticated remote admin session for a new upload (admin access without a session returns 401). Therefore no deployment, server filesystem inspection, remote upload, browser rendering or F5 check has been completed. The public evidence cannot distinguish a missing symlink from already-lost physical files; both must be checked on Render.

Concrete setup for this deployment:

```text
Vercel production build:
VITE_API_BASE_URL=https://daisy-api-quocdai.onrender.com/api

Render environment:
APP_URL=https://daisy-api-quocdai.onrender.com
FRONTEND_URL=https://frontend-jade-zeta-89.vercel.app
PUBLIC_STORAGE_URL=/storage
```

In Render Shell, first inspect without deploying/restarting:

```sh
ls -ld public/storage storage/app/public storage/app/public/products
readlink -f public/storage
find storage/app/public/products -maxdepth 1 -type f | wc -l
test -f storage/app/public/products/cFNkdGGay7eaD2tJGEsJ9HP7F13GMvUed00Ojas6.png && echo 'sample exists' || echo 'sample missing'
```

Back up existing uploaded files before adding a disk or redeploying. Then create a persistent disk mounted at `/var/www/html/storage/app/public`, or implement persistent object storage before treating this as fixed. Render disks require a paid service; without persistent storage, uploaded local files are lost across deploys/restarts (https://render.com/docs/disks). Mounting a new disk does not recover old files. Restore a backup to the disk; if no copy of an old file exists, upload that image again. Do not change database paths to nonexistent files or use fallback pictures.

Deploy the fixed backend Dockerfile after preserving existing files, clear cached config if required, and redeploy the frontend changes with the above VITE_API_BASE_URL. Alternatively, if all old files are still present, `php artisan storage:link --force` in Render Shell can restore immediate serving without a deployment, but durable storage remains required. Verify a new upload from another device via the Vercel URL, confirm its actual resolved URL is on the Render HTTPS origin and returns 200 image/*, F5 and reselect it, then verify after an approved backend restart/redeploy. Recheck old images only after their files are confirmed/restored.

## Final Render Free repair deployed

Render login was renewed. Service `srv-danp7goae00c739jc90g` is Docker on the Free plan; its PostgreSQL database is already available. Free web services do not support SSH/Shell or persistent disks, so the prior disk-based instructions cannot be applied on this plan (https://render.com/docs/ssh). Instead of upgrading billing, new product uploads now use database-backed storage, like the existing QR image feature.

Commit `6ba1ba629780c60d7ead99b52860ddde28e0092f` was pushed to main with only image-related backend files. Render deployment `dep-db5ksm8ae00c739phgl0` reached live. Migration adds `product_images` without modifying existing product data; upload saves encoded bytes and the product URL in one transaction. Public image responses have correct MIME, nosniff, immutable content-hash filenames and ETag/304 support. The existing Vercel bundle works with the returned absolute Render HTTPS URLs; no frontend release was needed. The public filesystem driver remains available when explicitly configured.

Verification: 73 backend tests and 570 assertions passed; frontend lint passed. Using the existing configured admin account, a real 2,184,147-byte PNG was uploaded via the deployed Render API. Its saved HTTPS URL returned HTTP 200 image/png, SHA-256 identical to the original. A fresh authenticated product read contained the same URL and repeat downloads succeeded. The temporary gallery entry was removed while preserving the product's existing images, and the test login token was revoked. After Render restart, the instance changed from k7jzp to gj599 and the same image still returned HTTP 200 with the original SHA-256. The additive migration was also applied locally so local uploads keep working.

Six earlier upload URLs still return 404. Their physical files cannot be recovered from their database URL strings. No placeholder images were substituted and existing gallery entries were not automatically deleted. Users should remove broken gallery entries and re-upload their original images; new uploads use PostgreSQL instead of ephemeral storage. Browser DOM, visual rendering and actual F5 remain unverified because no browser is connected. Database-backed persistence lasts as long as the database itself; the current free database reports expiry on 2026-10-20, so its retention/lifecycle must also be managed.
