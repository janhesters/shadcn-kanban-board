# Shadcn/UI Kanban Board

A modern, production-ready Kanban board for building full-stack B2B & B2C SaaS applications using Shadcn/UI.

[Try it out here.](https://shadcn-kanban-board.com/example)

## Features

- ⚛️ Zero-Dependencies: pure React - no extra libraries required
- ⚡ Performance Assurance: `useJsLoaded` hook to show a skeleton until your styles and scripts are ready
- 🔍 Accessibility-First: full keyboard controls and screen-reader announcements out of the box  
- 🎨 Seamless Theming: automatically adapts to your [Shadcn/UI](https://ui.shadcn.com) color scheme
- 🔄 Framework-Agnostic: works with local state, [React Router v7](https://reactrouter.com) actions, or [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions) ...
- 🧩 Extensible APIs: register custom DnD monitors and announcement handlers for fine-grained control

## Motivation

We needed a good Kanban board for our LinkedIn scheduling and employee advocacy app, [SocialKit](https://getsocialkit.com/). We're building the app with Shadcn/UI and couldn’t find a Kanban board that was accessible, themeable, and easy to use. So we built our own.

## Installation

* `npm:`

  ```bash
  npx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
  npx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json
  ```

* `yarn:`

  ```bash
  yarn dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
  yarn dlx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json
  ```

* `pnpm:`

  ```bash
  pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
  pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json
  ```

* `bun:`

  ```bash
  bunx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
  bunx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json
  ```

## Example

Check out the [example page](https://github.com/janhesters/shadcn-kanban-board/blob/main/app/routes/example.tsx). It demonstrates:

- **Provider & layout**: Wraps everything in `KanbanBoardProvider` and sets up `<KanbanBoard>` inside your page.
- **Dynamic columns & cards**: Uses `createId()` from `@paralleldrive/cuid2` to generate stable IDs.
- **Add / remove**: Add or delete columns and cards, with auto-scroll to keep the latest column in view.
- **Inline editing**: Edit column titles and card titles in place via `<Input>` and `<Textarea>`.
- **Drag & drop**: Full mouse & keyboard DnD powered by `useDndEvents()`, including space/enter to pick up & drop, arrow keys to move, escape to cancel.
- **Skeleton & JS-load guard**: Shows a `<KanbanBoardColumnSkeleton>` via `useJsLoaded()` until client-side JS is ready.
- **Accessibility**: Screen-reader announcements on drag events, focus management, and ARIA labels everywhere.
- **Theming & colors**: Color-circle primitives (`KanbanColorCircle`) driven by your theme’s CSS vars.
- **Menus & icons**: Per-column dropdown (edit/delete) with `lucide-react` icons, tooltips, and `<DropdownMenu>`.

Between the hooks, primitives and UX details (autoscroll, autofocus, multi-line card support), it’s a complete pattern you can lift straight into your own app. Just paste in `KanbanBoardPage` and go.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Built with ❤️ by [ReactSquad](https://reactsquad.io/)

If you want to hire senior React developers to augment your team, or build your entire product from scratch, [schedule a call with us](https://www.reactsquad.io/schedule-a-call).
