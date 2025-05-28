import { CheckIcon, ClipboardIcon } from 'lucide-react';
import * as React from 'react';

import { usePackageManager } from '~/hooks/use-package-manager';

import { copyToClipboardWithMeta } from './copy-button';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type NpmCommands = {
  __npmCommand__?: string;
  __yarnCommand__?: string;
  __pnpmCommand__?: string;
  __bunCommand__?: string;
};

export function CodeBlockCommand({
  __npmCommand__,
  __yarnCommand__,
  __pnpmCommand__,
  __bunCommand__,
}: React.ComponentProps<'pre'> & NpmCommands) {
  const [packageManager, setPackageManager] = usePackageManager();
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const tabs = React.useMemo(() => {
    return {
      pnpm: __pnpmCommand__,
      npm: __npmCommand__,
      yarn: __yarnCommand__,
      bun: __bunCommand__,
    };
  }, [__npmCommand__, __pnpmCommand__, __yarnCommand__, __bunCommand__]);

  const copyCommand = React.useCallback(() => {
    const command = tabs[packageManager];

    if (!command) {
      return;
    }

    copyToClipboardWithMeta(command);
    setHasCopied(true);
  }, [packageManager, tabs]);

  return (
    <div className="bg-card dark:bg-card border-border relative mt-6 max-h-[650px] overflow-x-auto rounded-xl border">
      <Tabs
        value={packageManager}
        onValueChange={value => {
          setPackageManager(value as 'pnpm' | 'npm' | 'yarn' | 'bun');
        }}
      >
        <div className="border-border bg-muted flex items-center justify-between border-b px-3 pt-2.5">
          <TabsList className="h-7 translate-y-[2px] gap-3 bg-transparent p-0 pl-1">
            {Object.entries(tabs).map(([key]) => {
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-muted-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground dark:data-[state=active]:!bg-muted dark:data-[state=active]:!border-muted dark:data-[state=active]:!border-b-foreground rounded-none border-b border-transparent bg-transparent p-0 pb-1.5 font-mono data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {key}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        <div className="overflow-x-auto">
          {Object.entries(tabs).map(([key, value]) => {
            return (
              <TabsContent key={key} value={key} className="mt-0">
                <pre className="px-4 py-5">
                  <code
                    className="relative font-mono text-sm leading-none"
                    data-language="bash"
                  >
                    {value}
                  </code>
                </pre>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
      <Button
        size="icon"
        variant="ghost"
        className="text-foreground hover:bg-accent hover:text-accent-foreground absolute top-2 right-2.5 z-10 h-6 w-6 [&_svg]:h-3 [&_svg]:w-3"
        onClick={copyCommand}
      >
        <span className="sr-only">Copy</span>
        {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
      </Button>
    </div>
  );
}
