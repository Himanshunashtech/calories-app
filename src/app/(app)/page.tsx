// IMPORTANT: This file is intentionally structured to NOT be a page.
// It exists to ensure the (app) route group is recognized by Next.js.
// If you are seeing a "parallel routes" error related to src/app/(app),
// it means Next.js is still trying to treat this as a page for the "/" route,
// which conflicts with src/app/page.tsx.

// The (app) directory is a route group and does not add to the URL path.
// Therefore, a page.tsx inside src/app/(app)/ that default exports a component
// would also try to serve the "/" route, causing a conflict.

// PLEASE TRY THE FOLLOWING IF THE ERROR PERSISTS:
// 1. Stop your Next.js development server.
// 2. Delete the .next folder in your project root.
// 3. Manually DELETE THIS FILE (src/app/(app)/page.tsx).
// 4. Restart your Next.js development server.

// This is a named export and NOT a React component intended as a page.
export const appDirectoryPlaceholder = true;

// If you need components or utilities specific to the (app) layout segment,
// define them here and export them by name, not as a default React component.
// Example:
// export function someAppUtil() { /* ... */ }
