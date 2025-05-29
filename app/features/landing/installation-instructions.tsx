import { CodeBlockCommand } from '~/components/code-block-command';

export function InstallationInstructions() {
  return (
    <section className="mx-auto flex max-w-xl flex-col">
      <h2 className="text-primary mb-10 text-center text-3xl font-semibold">
        Installation
      </h2>

      <h3 className="text-muted-foreground mb-6 text-xl font-semibold">
        Install the Kanban Board:
      </h3>

      <CodeBlockCommand
        __npmCommand__="npx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json"
        __yarnCommand__="yarn dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json"
        __pnpmCommand__="pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json"
        __bunCommand__="bunx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json"
      />

      <h3 className="text-muted-foreground mt-8 mb-6 text-xl font-semibold">
        Install the use-js-loaded hook:
      </h3>

      <CodeBlockCommand
        __npmCommand__="npx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json"
        __yarnCommand__="yarn dlx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json"
        __pnpmCommand__="pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json"
        __bunCommand__="bunx shadcn@latest add https://shadcn-kanban-board.com/r/use-js-loaded.json"
      />
    </section>
  );
}
