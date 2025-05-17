// This file is intentionally modified to avoid defining a page route
// that conflicts with src/app/page.tsx.
// The (app) directory is a route group and does not add to the URL path.
// Therefore, a page.tsx inside src/app/(app)/ that default exports a component
// would also try to serve the "/" route, causing a conflict.
//
// If you encounter a "parallel routes" error related to src/app/(app) even after
// this change, you likely need to DELETE THIS FILE MANUALLY.

// This is a named export and not a React component intended as a page.
export const appDirectoryPlaceholder = true;

// If you need components or utilities specific to the (app) layout segment,
// define them here and export them by name, not as a default React component.
