# Ecommerce Admin Project Roadmap

This roadmap reflects the repository as inspected on 2026-10-26. Checklist
marks from earlier notes were not treated as proof of implementation; each
status below is based on the source code and package manifest.

## Current status

| Phase | Steps | Status |
| --- | --- | --- |
| Foundation | 1-5, 7 | Complete: Vite/React/TypeScript, dependencies, Tailwind, folders/types, and Zustand stores are present. |
| Firebase setup | 6 | Local config is present; auth implementation exists. Live verification requires published security rules and a successful sign-in. |
| Layout & auth | 8-14 | Implemented: dashboard shell, sidebar, navbar, login, routing, protected-route foundation, and theme toggle. |
| Dashboard | 15-19 | Implemented with typed mock data: stat cards, revenue/orders charts, and recent orders. |
| Products CRUD | 20-27 | Product create/list/edit/delete works without images. Optional image uploads are implemented but disabled by default because Storage requires Blaze. |
| Orders & users | 28-31 | Implemented: Firestore order list/detail/status updates and admin-only management of existing staff profile roles/access. Requires latest Firestore rules published and data in the collections. Auth account provisioning requires Firebase Console or a trusted Admin SDK backend. |
| Polish | 32-38 | Partially complete: CSV/PDF exports, table loading skeletons, toast feedback, responsive layouts, app error boundary, and focused automated tests are implemented. Full responsive QA, live Firebase verification, deployment, and dependency advisory review remain. |

## Recommended execution order

1. **Verify Orders and Users (Steps 28-31):** publish the latest
   `firestore.rules` under Firestore Database → Rules, then test order access
   and status changes with admin/editor/viewer accounts. Test staff profile
   management as admin. Existing order/profile data is required to exercise
   populated screens.
2. **Complete release checks (Steps 32-38):** run the automated suite with
   `npm test`, finish responsive QA across desktop/tablet/mobile, and review
   dependency advisories. Lint, TypeScript build, and production build are
   already passing.
3. **Deploy:** GitHub Pages is selected. Create the public
   `Roshan20222/ecommerce-admin-dashboard` repository, configure the six
   Firebase Actions variables, enable Pages with GitHub Actions, and add
   `roshan20222.github.io` to Firebase Authentication's authorized domains.
4. **Optional image uploads:** when a supported Firebase Storage billing plan
   is available, enable the default bucket, publish `storage.rules`, and set
   `VITE_FIREBASE_STORAGE_ENABLED=true`.

## Firebase setup needed from the project owner

1. Create or select a Firebase project and register a web app.
2. Enable **Email/Password** in Firebase Authentication and create the initial
   admin account.
3. Create a Firestore database and a `users/{uid}` document for the account,
   where `{uid}` is its Firebase Authentication UID. Include `name`, `role`
   (`admin`, `editor`, or `viewer`), `isActive` (`true`), and `createdAt`
   (ISO date string or Firestore timestamp). `avatar` is optional.
4. Copy `.env.example` to `.env.local` at the project root and fill all six
   `VITE_FIREBASE_*` values from the Firebase web app settings. Keep this local
   file out of source control; restart the dev server after editing it.
5. Share only that setup is ready; the config values do not need to be pasted
   into chat. The Firebase client config is used by the browser, but Firestore
   security rules must still protect every collection.
6. Firebase Storage uploads are optional and currently deferred. To enable
   them later, review Firebase's Blaze billing requirements, create/enable the
   default bucket, and publish `storage.rules`.
7. Publish the latest repository `firestore.rules` in the Firebase Console.

## Current release gates

- `npm run build` and `npm run lint` pass.
- `npm test` passes (7 focused tests covering auth-store transitions and
  product filtering).
- Firebase configuration variables are present in the ignored `.env.local`
  file. The owner confirmed sign-in/dashboard access and product creation
  without images. Orders/users features compile, but their live queries and
  updates still need testing after the latest `firestore.rules` are published.
- Image uploads require an eligible Firebase Storage billing plan and remain
  disabled by default; product CRUD without images does not require Storage.
- GitHub Pages deployment workflow is configured, but publishing is blocked
  until the owner reauthenticates GitHub CLI and the repository is created.
- `npm audit --omit=dev` currently reports four high-severity findings in the
  Firebase/Firestore dependency tree. Review a compatible fix before release;
  do not apply a major-version downgrade automatically.
- Analytics remains a planned navigation destination. Orders and Users screens
  are implemented but require seeded Firestore data and published rules to
  complete live validation.
