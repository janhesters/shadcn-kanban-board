import { Trans, useTranslation } from 'react-i18next';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type FAQItem = {
  question: string;
  answer: string;
  links?: Record<string, string>;
};

export function FAQ() {
  const { t } = useTranslation('landing', { keyPrefix: 'faq' });
  const items = t('items', { returnObjects: true }) as FAQItem[];

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-primary mb-10 text-3xl font-semibold">
          {t('title')}
        </h2>

        <Accordion type="single" collapsible>
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>

              <AccordionContent className="text-muted-foreground">
                {item.links ? (
                  <Trans
                    i18nKey={`landing:faq.items.${index}.answer`}
                    components={Object.fromEntries(
                      Object.entries(item.links).map(([_key, href], index_) => [
                        index_ + 1,
                        <a
                          href={href}
                          className={cn(
                            buttonVariants({ variant: 'link' }),
                            'px-1 py-0',
                          )}
                        />,
                      ]),
                    )}
                  />
                ) : (
                  item.answer
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
