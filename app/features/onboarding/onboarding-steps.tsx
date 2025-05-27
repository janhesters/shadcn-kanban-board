import { CheckIcon } from 'lucide-react';
import { Link } from 'react-router';

import { DisableableLink } from '~/components/disableable-link';
import { cn } from '~/lib/utils';

type OnboardingStep = {
  name: string;
  href: string;
  status: 'complete' | 'current' | 'upcoming';
  disabled?: boolean;
};

export type OnboardingStepsProps = {
  className?: string;
  label: string;
  steps: OnboardingStep[];
};

export function OnboardingSteps({
  className,
  label,
  steps,
}: OnboardingStepsProps) {
  return (
    <nav aria-label={label} className={cn(className)}>
      <ol className="divide-border bg-card divide-y rounded-lg border shadow md:flex md:divide-y-0">
        {steps.map((step, stepIndex) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {step.status === 'complete' ? (
              <DisableableLink
                className="group ring-offset-background focus-visible:ring-ring flex w-full items-center rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={step.disabled}
                to={step.href}
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span
                    className={cn(
                      'bg-primary flex size-10 flex-shrink-0 items-center justify-center rounded-full',
                      !step.disabled && 'group-hover:bg-primary/90',
                    )}
                  >
                    <CheckIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </span>

                  <span className="text-foreground ml-4 text-sm font-medium">
                    {step.name}
                  </span>
                </span>
              </DisableableLink>
            ) : step.status === 'current' ? (
              <Link
                aria-current="step"
                className="ring-offset-background focus-visible:ring-ring flex items-center rounded-md px-6 py-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                to={step.href}
              >
                <span className="border-primary/90 flex size-10 flex-shrink-0 items-center justify-center rounded-full border-2">
                  <span className="text-primary/90">
                    {(stepIndex + 1).toString().padStart(2, '0').slice(-2)}
                  </span>
                </span>

                <span className="text-primary/90 ml-4 text-sm font-medium">
                  {step.name}
                </span>
              </Link>
            ) : (
              <DisableableLink
                className="group ring-offset-background focus-visible:ring-ring flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                disabled={step.disabled}
                to={step.href}
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span
                    className={cn(
                      'border-foreground/30 flex size-10 flex-shrink-0 items-center justify-center rounded-full border-2',
                      !step.disabled && 'group-hover:border-foreground/40',
                    )}
                  >
                    <span
                      className={cn(
                        'text-foreground/60',
                        !step.disabled && 'group-hover:text-foreground',
                      )}
                    >
                      {(stepIndex + 1).toString().padStart(2, '0').slice(-2)}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'text-foreground/60 ml-4 text-sm font-medium',
                      !step.disabled && 'group-hover:text-foreground',
                    )}
                  >
                    {step.name}
                  </span>
                </span>
              </DisableableLink>
            )}

            {stepIndex === steps.length - 1 ? undefined : (
              <>
                <div
                  className="absolute top-0 right-0 hidden h-full w-5 md:block"
                  aria-hidden="true"
                >
                  <svg
                    className="text-border h-full w-full"
                    viewBox="0 0 22 80"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 -2L20 40L0 82"
                      vectorEffect="non-scaling-stroke"
                      stroke="currentcolor"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
