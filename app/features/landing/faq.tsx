import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const faqItems = [
  {
    question: 'Is this free?',
    answer:
      'Yes! This is an open-source project and is free to use under the MIT license.',
  },
  {
    question: 'How do I contribute?',
    answer: (
      <>
        Glad you asked! We're always looking for help with the project. If
        you're interested in contributing, please check out our{' '}
        <a
          href="https://github.com/janhesters/shadcn-kanban-board/blob/main/CONTRIBUTING.md"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          contributing guide
        </a>{' '}
        for more information.
      </>
    ),
  },
  {
    question: "I'm stuck! Where can I get help?",
    answer: (
      <>
        You can ask in GitHub discussions. If you're interested in professional
        help building your app from senior React developers, reach out to us at{' '}
        <a
          href="https://reactsquad.io"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          ReactSquad
        </a>
        .
      </>
    ),
  },
  {
    question: 'This is awesome! How can I support you?',
    answer: (
      <>
        Thank you so much! You can follow Jan Hesters on{' '}
        <a
          href="https://x.com/janhesters"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          X
        </a>
        ,{' '}
        <a
          href="https://www.linkedin.com/in/jan-hesters/"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          LinkedIn
        </a>
        , or{' '}
        <a
          href="https://www.youtube.com/@janhesters"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          YouTube
        </a>
        , and drop a thank you. And if you know anyone who needs senior React
        developers, please recommend{' '}
        <a
          href="https://reactsquad.io"
          className={cn(buttonVariants({ variant: 'link' }), 'px-1 py-0')}
        >
          ReactSquad
        </a>
        . Thank you!
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-primary mb-10 text-3xl font-semibold">
          Frequently asked questions
        </h2>

        <Accordion type="single" collapsible>
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>

              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
