# Ecommerce Admin

A Vite, React, and TypeScript admin application. The current implementation
includes a responsive dashboard shell, mock dashboard metrics and charts,
Firebase email/password authentication scaffolding, and theme/sidebar state.

## Getting started

```sh
npm install
npm run dev
```

The sign-in screen requires a Firebase project. Copy `.env.example` to
`.env.local` and fill in the Firebase web app values. The app validates that
the configuration is complete before initializing Firebase.

Enable Email/Password in Firebase Authentication and create an admin user.
Create a Firestore document at `users/{uid}` for that user's Firebase Auth UID
with at least these fields:

```text
name: string
role: "admin" | "editor" | "viewer"
isActive: boolean
createdAt: ISO date string or Firestore timestamp
```

An optional `avatar` string is also supported. Configure Firestore security
rules to enforce access by authenticated user and role; client-side route guards
are not a substitute for database security rules. Do not commit `.env.local`.

## Product catalog setup

The product page reads and writes the Firestore `products` collection. In
Firebase Console, open **Build → Storage**, enable the default bucket, and
review any billing requirements Firebase presents for your project. Product
image uploads require Firebase Storage; the app accepts JPEG, PNG, or WebP
images up to 5 MB each, with up to 10 images per product.

Product creation and editing work without images. Firebase Storage currently
requires the Blaze plan for this project, so image uploads are optional and
are disabled by default. Once Storage is enabled, set
`VITE_FIREBASE_STORAGE_ENABLED=true` in `.env.local` and restart Vite to enable
the image picker.

Before using product data, publish the repository's `firestore.rules` in
**Firestore Database → Rules** and `storage.rules` in **Storage → Rules**.
These rules allow active accounts to read products and allow active `admin` or
`editor` accounts to create, update, and delete products and images. They also
limit uploaded file type and size. Review and test rules in the Firebase Rules
Playground before production use.

The initial admin profile must be created by a trusted project administrator
in Firebase Console. Client rules intentionally prevent users from changing
their own role or active status.

## Orders and staff profiles

The **Orders** page reads order documents from the Firestore `orders`
collection. Order documents must use the structure in
[`src/types/order.ts`](./src/types/order.ts), including nested customer,
shipping-address, and item fields. Orders are created by the store checkout
system or a trusted backend; this dashboard only reads orders and lets
admin/editor users update their fulfillment status.

The **Users** page is admin-only. It lists existing `users/{uid}` profile
documents and lets admins change another user's `role` and `isActive` values.
An admin cannot change their own access from this page. To add a staff member,
first create their account in **Firebase Authentication → Users**, then create
a matching Firestore `users/{uid}` document with `name`, `email`, `role`,
`isActive`, and `createdAt`. Client-side account creation is intentionally not
provided because securely provisioning Firebase Auth users requires a trusted
Admin SDK backend.

After any Firestore rules change, publish the latest `firestore.rules` in
**Firestore Database → Rules**. The rules allow active accounts to read orders,
admin/editor users to update order status, and admins to list/update other
staff profiles.

## Checks

```sh
npm test
npm run lint
npm run build
```

The unit tests cover auth-store state transitions and product filtering.

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow at
`.github/workflows/deploy.yml`. On GitHub:

1. Push this project to a repository owned by `Roshan20222` named
   `ecommerce-admin-dashboard`, using the `main` branch.
2. In the repository, open **Settings → Pages** and set the build and
   deployment source to **GitHub Actions**.
3. Open **Settings → Secrets and variables → Actions → Variables** and add
   these six variables from the Firebase web app configuration:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.
   These are browser-side Firebase configuration values, not admin credentials.
4. Push to `main` or manually run **Deploy to GitHub Pages** from the
   **Actions** tab. The project site URL will be
   `https://roshan20222.github.io/ecommerce-admin-dashboard/`.
5. In Firebase Console, add `roshan20222.github.io` under **Authentication →
   Settings → Authorized domains**. Publish the current `firestore.rules`
   before using live database features.

The app uses hash-based routing so refreshing a nested page works on static
GitHub Pages hosting. GitHub Pages serves a public website; Firebase
authentication and Firestore rules must protect account access and data.

See [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) for the verified implementation
status, remaining work, and Firebase setup actions.
