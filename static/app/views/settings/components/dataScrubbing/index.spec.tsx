import {InjectedRouter} from 'react-router';
import {Location} from 'history';

import {initializeOrg} from 'sentry-test/initializeOrg';
import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';
import {textWithMarkupMatcher} from 'sentry-test/utils';

import GlobalModal from 'sentry/components/globalModal';
import {Organization} from 'sentry/types';
import {OrganizationContext} from 'sentry/views/organizationContext';
import {RouteContext} from 'sentry/views/routeContext';
import {DataScrubbing} from 'sentry/views/settings/components/dataScrubbing';

const relayPiiConfig = JSON.stringify(TestStubs.DataScrubbingRelayPiiConfig());

function ComponentProviders({
  router,
  location,
  organization,
  children,
}: {
  children: React.ReactNode;
  location: Location;
  organization: Organization;
  router: InjectedRouter;
}) {
  return (
    <OrganizationContext.Provider value={organization}>
      <RouteContext.Provider
        value={{
          router,
          location,
          params: {},
          routes: [],
        }}
      >
        {children}
      </RouteContext.Provider>
    </OrganizationContext.Provider>
  );
}

describe('Data Scrubbing', function () {
  describe('Organization level', function () {
    const {organization, router} = initializeOrg();
    const additionalContext = 'These rules can be configured for each project.';
    const endpoint = `organization/${organization.slug}/`;

    it('default render', function () {
      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <DataScrubbing
            additionalContext={additionalContext}
            endpoint={endpoint}
            relayPiiConfig={relayPiiConfig}
            organization={organization}
            onSubmitSuccess={jest.fn()}
          />
        </ComponentProviders>
      );

      // Header
      expect(screen.getByText('Advanced Data Scrubbing')).toBeInTheDocument();

      // Alert
      expect(
        screen.getByText(
          textWithMarkupMatcher(
            `${additionalContext} The new rules will only apply to upcoming events. For more details, see full documentation on data scrubbing.`
          )
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {name: 'full documentation on data scrubbing'})
      ).toHaveAttribute(
        'href',
        `https://docs.sentry.io/product/data-management-settings/scrubbing/advanced-datascrubbing/`
      );

      // Body
      expect(screen.getAllByRole('button', {name: 'Edit Rule'})).toHaveLength(3);

      // Actions
      expect(screen.getByRole('button', {name: 'Read Docs'})).toHaveAttribute(
        'href',
        `https://docs.sentry.io/product/data-management-settings/scrubbing/advanced-datascrubbing/`
      );
      expect(screen.getByRole('button', {name: 'Add Rule'})).toBeEnabled();
    });

    it('render empty state', function () {
      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <DataScrubbing
            endpoint={endpoint}
            relayPiiConfig={undefined}
            organization={organization}
            onSubmitSuccess={jest.fn()}
          />
        </ComponentProviders>
      );

      expect(screen.getByText('You have no data scrubbing rules')).toBeInTheDocument();
    });

    it('render disabled actions', function () {
      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <DataScrubbing
            additionalContext={additionalContext}
            endpoint={endpoint}
            relayPiiConfig={relayPiiConfig}
            organization={organization}
            onSubmitSuccess={jest.fn()}
            disabled
          />
        </ComponentProviders>
      );

      // Read Docs is the only enabled action
      expect(screen.getByRole('button', {name: 'Read Docs'})).toBeEnabled();

      expect(screen.getByRole('button', {name: 'Add Rule'})).toBeDisabled();

      for (const index in JSON.parse(relayPiiConfig).rules) {
        expect(screen.getAllByRole('button', {name: 'Edit Rule'})[index]).toBeDisabled();
        expect(
          screen.getAllByRole('button', {name: 'Delete Rule'})[index]
        ).toBeDisabled();
      }
    });
  });

  describe('Project level', function () {
    it('default render', function () {
      const {organization, router, project} = initializeOrg();

      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <DataScrubbing
            endpoint={`/projects/${organization.slug}/foo/`}
            relayPiiConfig={relayPiiConfig}
            organization={organization}
            onSubmitSuccess={jest.fn()}
            project={project}
          />
        </ComponentProviders>
      );

      // Header
      expect(
        screen.getByText('There are no data scrubbing rules at the organization level')
      ).toBeInTheDocument();
    });

    it('OrganizationRules has content', function () {
      const {organization, router, project} = initializeOrg({
        ...initializeOrg(),
        organization: {
          ...initializeOrg().organization,
          relayPiiConfig,
        },
      });

      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <DataScrubbing
            endpoint={`/projects/${organization.slug}/foo/`}
            relayPiiConfig={relayPiiConfig}
            organization={organization}
            onSubmitSuccess={jest.fn()}
            project={project}
          />
        </ComponentProviders>
      );

      // Organization Rules
      expect(screen.getByText('Organization Rules')).toBeInTheDocument();
    });

    it('Delete rule successfully', async function () {
      const {organization, router, project} = initializeOrg();

      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <GlobalModal />
          <DataScrubbing
            endpoint={`/projects/${organization.slug}/foo/`}
            project={project}
            relayPiiConfig={relayPiiConfig}
            disabled={false}
            organization={organization}
            onSubmitSuccess={jest.fn()}
          />
        </ComponentProviders>
      );

      userEvent.click(screen.getAllByLabelText('Delete Rule')[0]);

      expect(
        await screen.findByText('Are you sure you wish to delete this rule?')
      ).toBeInTheDocument();
    });

    it('Open Add Rule Modal', async function () {
      const {organization, router, project} = initializeOrg();

      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <GlobalModal />
          <DataScrubbing
            endpoint={`/projects/${organization.slug}/foo/`}
            project={project}
            relayPiiConfig={relayPiiConfig}
            disabled={false}
            organization={organization}
            onSubmitSuccess={jest.fn()}
          />
        </ComponentProviders>
      );

      userEvent.click(screen.getByRole('button', {name: 'Add Rule'}));

      expect(
        await screen.findByText('Add an advanced data scrubbing rule')
      ).toBeInTheDocument();
    });

    it('Open Edit Rule Modal', function () {
      const {organization, router, project} = initializeOrg();

      render(
        <ComponentProviders
          location={router.location}
          router={router}
          organization={organization}
        >
          <GlobalModal />
          <DataScrubbing
            endpoint={`/projects/${organization.slug}/foo/`}
            project={project}
            relayPiiConfig={relayPiiConfig}
            disabled={false}
            organization={organization}
            onSubmitSuccess={jest.fn()}
          />
        </ComponentProviders>
      );

      userEvent.click(screen.getAllByRole('button', {name: 'Edit Rule'})[0]);

      // Verify the router to open the modal was called
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: `/settings/${organization.slug}/projects/${project.slug}/security-and-privacy/advanced-data-scrubbing/0/`,
        })
      );
    });
  });
});
