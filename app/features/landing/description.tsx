import {
  AccessibilityIcon,
  PackageIcon,
  PaintbrushIcon,
  PaletteIcon,
  PlugIcon,
} from 'lucide-react';

import { cn } from '~/lib/utils';

const featureIconMap = {
  'zero-dependencies': PackageIcon,
  'css-performance': PaletteIcon,
  accessibility: AccessibilityIcon,
  theming: PaintbrushIcon,
  'framework-agnostic': PlugIcon,
};

const features = {
  'zero-dependencies': {
    title: 'Zero-Dependencies',
    description:
      'No extra libraries. Just plain React. Drop it into your project and start dragging and dropping.',
  },
  'css-performance': {
    title: 'CSS & Performance Assurance',
    description:
      'Comes with a hook to toggle between a skeleton loader and the board, ensuring styles and scripts are loaded before interaction for a snappy, flicker-free experience.',
  },
  accessibility: {
    title: 'Accessibility-First',
    description:
      'Built-in keyboard controls and screen-reader announcements ensure everyone can manage tasks.',
  },
  theming: {
    title: 'Seamless Theming',
    description:
      'Automatically adapts to your Shadcn color scheme for perfect visual integration with light an dark mode.',
  },
  'framework-agnostic': {
    title: 'Framework-Agnostic',
    description:
      'Works equally well with local state, React Router v7 actions, or Next.js server actions, and so on ... No lock-in!',
  },
};

const imageClassNames =
  'border-border w-3xl max-w-none rounded-xl border sm:w-228 md:-ml-4 lg:-ml-0';

export function Description() {
  return (
    <div className="py-24 sm:py-32">
      <div className="px-4">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pr-8">
            <div className="lg:max-w-xl">
              <h2 className="text-primary text-base font-semibold">
                Why choose this Kanban Board?
              </h2>

              <p className="text-foreground mt-2 text-4xl font-semibold tracking-tight text-pretty sm:text-5xl">
                Easily customize this Kanban board
              </p>

              <p className="text-muted-foreground mt-6 text-lg/8">
                Get up and running in minutes with a production-ready,
                accessible, and themeable Kanban board built on Shadcn/UI.
              </p>

              <dl className="text-muted-foreground mt-10 max-w-xl space-y-8 text-base/7 lg:max-w-none">
                {Object.entries(features).map(([key, feature]) => {
                  const Icon =
                    featureIconMap[key as keyof typeof featureIconMap];
                  return (
                    <div key={feature.title} className="relative pl-9">
                      <dt className="text-foreground inline font-semibold">
                        <Icon
                          aria-hidden="true"
                          className="text-primary absolute top-1 left-1 size-5"
                        />
                        {feature.title}
                      </dt>{' '}
                      <dd className="inline">{feature.description}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>

          <img
            alt="Kanban Board screenshot (light)"
            className={cn(imageClassNames, 'dark:hidden')}
            height={1442}
            src="/images/app-light.png"
            width={2432}
          />

          <img
            alt="Kanban Board screenshot (dark)"
            className={cn(imageClassNames, 'hidden dark:block')}
            height={1442}
            src="/images/app-dark.png"
            width={2432}
          />
        </div>
      </div>
    </div>
  );
}
