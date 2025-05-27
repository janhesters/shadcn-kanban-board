import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';

import { NotFound } from './not-found';

describe('NotFound Component', () => {
  test('given: component renders, should: display all required elements', () => {
    const path = '/non-existent';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NotFound /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify heading
    const heading = screen.getByRole('heading', {
      name: /page not found/i,
      level: 1,
    });
    expect(heading).toBeInTheDocument();

    // Verify status code
    const statusCode = screen.getByText(/404/i);
    expect(statusCode).toBeInTheDocument();

    // Verify description
    const description = screen.getByText(/we couldn't find the page/i);
    expect(description).toBeInTheDocument();

    // Verify home link
    const homeLink = screen.getByRole('link', { name: /return home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
