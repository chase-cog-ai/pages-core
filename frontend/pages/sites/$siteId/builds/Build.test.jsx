import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Build from '@pages/sites/$siteId/builds/Build';
import { createTestQueryClient } from '@support/queryClient';

// Mocking react-router-dom's <Link> component
// to avoid rendering actual routing elements in tests.
// This prevents warnings  when <Link> is used outside a Router
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    Link: ({ to, children }) => {
      return `Link[to="${to}"] ${children}`;
    },
  };
});

describe('<Build />', () => {
  const props = {
    build: { state: '', id: 1 },
    containerRef: { current: { offsetTop: 0 } },
    latestForBranch: true,
    showBuildTasks: true,
    site: { id: 123 },
  };

  const createWrapper = createTestQueryClient();

  function testValidBuild(container) {
    expect(container.querySelector('.build-info-prefix')).toHaveTextContent('#1');
    expect(screen.queryByRole('button', { name: 'Rebuild' })).toBeInTheDocument();
    expect(screen.getByText(/View build logs/)).toHaveTextContent(
      'Link[to="/sites/123/builds/1/logs"]',
    );
  }

  test('it renders successful build', () => {
    const { container } = render(
      <Build
        {...props}
        build={{
          ...props.build,
          state: 'success',
          startedAt: 1770775800000,
          branch: 'main',
        }}
      />,
      { wrapper: createWrapper() },
    );
    testValidBuild(container);
  });

  test('it renders failed build', () => {
    const { container } = render(
      <Build
        {...props}
        build={{
          ...props.build,
          state: 'error',
          startedAt: 1770775800000,
          branch: 'main',
        }}
      />,
      { wrapper: createWrapper() },
    );
    testValidBuild(container);
  });

  test('it renders invalid build', () => {
    const { container } = render(
      <Build
        {...props}
        build={{ ...props.build, state: 'invalid', branch: 'invalid branch ~!@#$%^&*()' }}
      />,
      { wrapper: createWrapper() },
    );
    expect(container.querySelector('.build-info-prefix')).toHaveTextContent('#1');
    const logsLink = screen.getByText(/View build logs/);
    expect(logsLink).toHaveTextContent('Link[to="/sites/123/builds/1/logs"]');
    expect(screen.queryByRole('button', { name: 'Rebuild' })).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: /invalid branch ~!@#\$%\^&\*\(\)/i });
    expect(link).toHaveAttribute('href', 'https://github.com/undefined/undefined/tree/invalid%20branch%20~!%40%23%24%25%5E%26*()');
    expect(link).toHaveAttribute('title', 'View branch on GitHub');
  });
});
