---
inclusion: always
---
# React Best Practices

React and Next.js performance optimization guidelines from Vercel Engineering. Contains 40+ rules across 8 categories, prioritized by impact.

## Priority-Ordered Guidelines

Rules are prioritized by impact:

| Priority | Category                  | Impact      |
| -------- | ------------------------- | ----------- |
| 1        | Eliminating Waterfalls    | CRITICAL    |
| 2        | Bundle Size Optimization  | CRITICAL    |
| 3        | Server-Side Performance   | HIGH        |
| 4        | Client-Side Data Fetching | MEDIUM-HIGH |
| 5        | Re-render Optimization    | MEDIUM      |
| 6        | Rendering Performance     | MEDIUM      |
| 7        | JavaScript Performance    | LOW-MEDIUM  |
| 8        | Advanced Patterns         | LOW         |

## Critical Patterns (Apply First)

### Eliminate Waterfalls

- Defer await until needed (move into branches)
- Use `Promise.all()` for independent async operations
- Start promises early, await late
- Use Suspense boundaries to stream content

### Reduce Bundle Size

- Avoid barrel file imports (import directly from source)
- Use dynamic imports for heavy components
- Defer non-critical third-party libraries
- Preload based on user intent

## High-Impact Patterns

### Server Patterns

- Use `React.cache()` for per-request deduplication
- Use LRU cache for cross-request caching
- Minimize serialization at RSC boundaries
- Parallelize data fetching with component composition

### Client Patterns

- Use SWR/React Query for automatic request deduplication
- Defer state reads to usage point
- Use lazy state initialization for expensive values
- Use derived state subscriptions
- Apply `startTransition` for non-urgent updates

## Medium-Impact Patterns

### Re-render Optimization

- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback` when passed to child components
- Use `React.memo` for pure components that receive stable props
- Avoid creating new objects/arrays in render

### Rendering Performance

- Animate SVG wrappers, not SVG elements directly
- Use `content-visibility: auto` for long lists
- Prevent hydration mismatch with inline scripts
- Use explicit conditional rendering (`? :` not `&&`)

## JavaScript Patterns

- Batch DOM CSS changes via classes
- Build index maps for repeated lookups
- Cache repeated function calls
- Use `toSorted()` instead of `sort()` for immutability
- Early length check for array comparisons

## Anti-patterns to Avoid

- Barrel file imports that pull entire modules
- Synchronous data fetching in components
- Unnecessary re-renders from unstable references
- Layout thrashing from interleaved DOM reads/writes
- Blocking the main thread with heavy computations

## Code Examples

### Bad: Sequential Fetching (Waterfall)

```typescript
// ❌ Creates waterfall
const user = await fetchUser(id);
const posts = await fetchPosts(user.id);
const comments = await fetchComments(posts[0].id);
```

### Good: Parallel Fetching

```typescript
// ✅ Parallel when possible
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);
```

### Bad: Barrel Import

```typescript
// ❌ Imports entire module
import {Button} from '@/components';
```

### Good: Direct Import

```typescript
// ✅ Tree-shakeable
import Button from '@/components/shared/Button/Button';
```

### Bad: Unstable References

```typescript
// ❌ Creates new object every render
<Component style={{ color: 'red' }} />
```

### Good: Stable References

```typescript
// ✅ Stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<Component style={style} />
```
