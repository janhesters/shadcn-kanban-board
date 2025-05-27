import { useTranslation } from 'react-i18next';

import { CodeBlockCommand } from '~/components/code-block-command';

export function InstallationInstructions() {
  const { t } = useTranslation('landing', {
    keyPrefix: 'installation-instructions',
  });
  return (
    <section className="mx-auto max-w-xl">
      <h2 className="text-primary mb-10 text-center text-3xl font-semibold">
        {t('title')}
      </h2>

      <CodeBlockCommand
        __npmCommand__="npx shadcn@latest add https://shadcn-kanban-board.com/r/kanban-suite.json"
        __yarnCommand__="yarn dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban-suite.json"
        __pnpmCommand__="pnpm dlx shadcn@latest add https://shadcn-kanban-board.com/r/kanban-suite.json"
        __bunCommand__="bunx shadcn@latest add https://shadcn-kanban-board.com/r/kanban-suite.json"
      />
    </section>
  );
}
