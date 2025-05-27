import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  within,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { OnboardingStepsProps } from './onboarding-steps';
import { OnboardingSteps } from './onboarding-steps';

const createProps: Factory<OnboardingStepsProps> = ({
  label = faker.lorem.words(2),
  steps = [
    {
      name: faker.word.words(5),
      href: faker.internet.url(),
      status: 'complete' as const,
    },
    {
      name: faker.word.words(5),
      href: faker.internet.url(),
      status: 'current' as const,
    },
    {
      name: faker.word.words(5),
      href: faker.internet.url(),
      status: 'upcoming' as const,
    },
    {
      name: faker.word.words(5),
      href: faker.internet.url(),
      status: faker.helpers.arrayElement(['complete', 'upcoming'] as const),
      disabled: true,
    },
  ],
} = {}) => ({ label, steps });

describe('OnboardingSteps component', () => {
  test('given: an empty steps array, should: render nothing', () => {
    const path = '/onboarding';
    const props = createProps({ steps: [] });
    const RoutesStub = createRoutesStub([
      { path, Component: () => <OnboardingSteps {...props} /> },
    ]);

    render(<RoutesStub initialEntries={[path]} />);

    // It renders no list items.
    const progressNav = screen.getByRole('navigation', { name: props.label });
    expect(within(progressNav).queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('given: a completed step, a current step, an upcoming step, and a disabled step, should: render a list of steps', () => {
    const path = '/onboarding';
    const props = createProps();
    const RoutesStub = createRoutesStub([
      { path, Component: () => <OnboardingSteps {...props} /> },
    ]);

    render(<RoutesStub initialEntries={[path]} />);

    // It renders a list of steps.
    const progressNav = screen.getByRole('navigation', { name: props.label });
    const stepsList = within(progressNav).getByRole('list');
    const steps = within(stepsList).getAllByRole('listitem');
    expect(steps).toHaveLength(4);

    // It renders a completed step.
    const completedStep = steps[0];
    expect(within(completedStep).getByRole('link')).toHaveAttribute(
      'href',
      props.steps[0].href,
    );

    // It renders a current step.
    const currentStep = steps[1];
    expect(within(currentStep).getByRole('link')).toHaveAttribute(
      'href',
      props.steps[1].href,
    );

    // It renders an upcoming step.
    const upcomingStep = steps[2];
    expect(within(upcomingStep).getByRole('link')).toHaveAttribute(
      'href',
      props.steps[2].href,
    );

    // It renders a disabled step (only completed and upcoming can be disabled).
    const disabledUpcomingStep = steps[3];
    expect(
      within(disabledUpcomingStep).queryByRole('link'),
    ).not.toBeInTheDocument();
    expect(
      within(disabledUpcomingStep).getByText(props.steps[3].name),
    ).toBeInTheDocument();
  });
});
