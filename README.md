# Welcome to the React Router SaaS Template!

A modern, production-ready template for building full-stack B2B & B2C SaaS applications using React Router.

## Tech Stack

- 📖 [React Router](https://reactrouter.com/)
- 🔒 [TypeScript](https://www.typescriptlang.org/) by default
- 🎉 [TailwindCSS](https://tailwindcss.com/) for styling
- 🎨 [Shadcn UI](https://ui.shadcn.com/) components
- 🗄️ [Postgres](https://www.postgresql.org/) with [Supabase](https://supabase.com/) & [Prisma](https://www.prisma.io/)
- 🧹 [ESLint](https://eslint.org/) for linting
- 💅 [Prettier](https://prettier.io/) for code formatting
- ⚡️ [Vitest](https://vitest.dev/) for testing
- 🎭 [Playwright](https://playwright.dev/) for E2E testing
- 🛠️ [Commitizen](https://commitizen-tools.github.io/commitizen/), [Commitlint](https://commitlint.js.org/), and [Husky](https://typicode.github.io/husky/) for enforced commit conventions.

## Features

- 🔒 Authentication with [Supabase](https://supabase.com/docs/guides/auth) (Email Magic Link, Google OAuth)
- 📦 Postgres with [Supabase](https://supabase.com/docs/guides/database/overview)
- 🗃️ File upload with [Supabase Storage](https://supabase.com/docs/guides/storage)
- 💳 Billing with [Stripe](https://stripe.com/)
- 📧 Emails with [Resend](https://resend.com/)
- 👥 Multi-tenant organizations with role-based memberships
- 🌙 Dark mode
- 🔔 Notifications
- 🔍 [Axe](https://www.npmjs.com/package/@axe-core/playwright) for accessibility testing
- 🌐 Internationalization with [i18next](https://www.i18next.com/) and [remix-i18next](https://github.com/sergiodxa/remix-i18next)
- 📦 And much more...

All the services this template uses have generous free tiers, so you can get started at any budget.

## General

This template is tens of thousands of lines of code. It can be scary to navigate such a big foreign project. Luckily this template has good test coverage.

Why is good test coverage important for a template? For the same reason why it's good for your own code base. You want to avoid accidentally breaking something when you update the template and change or ammend its code.

## Getting Started

Get the code:

```bash
npx create-remix --template janhesters/react-router-saas-template
```

### Installation

Install the dependencies:

```bash
npm install
```

Create `.env` file. You can find the `.env.example` file in the root of the project to see all the variables you need to set.

Start by setting the environment variables that you can configure without setting up a service:

- `DATABASE_URL` – The URL of your local Postgres database. You can just download the [Postgres.app](https://postgresapp.com/) and use it to create a local database.
- `APP_URL` – The URL of your app, e.g. `http://localhost:3000`.
- `SESSION_SECRET` – A random string of characters. This is used for the authentication session.
- `COOKIE_SECRET` – A random string of characters. This is used for the dark mode cookie.
- `HONEYPOT_SECRET` – A random string of characters. This is used for the honeypot field in the contact sales form.

To run the app, you'll need to obtain the remaining environment variables by setting up the required services.

### Supabase

1. Create a [new Supabase organization](https://supabase.com/dashboard/new).
2. Create a new project.
   - Generate a password and save it somewhere.
   - Choose the Region closest to your users.
   - Keep the defaults like Postgres.
3. Go to your project's API settings, e.g. `https://supabase.com/dashboard/project/<project-id>/settings/api`. From this screen, you can grab:
  - `SUPABASE_PROJECT_ID` - The ID of your Supabase project. You can grab it from the URL of your project, e.g. `https://supabase.com/dashboard/project/<project-id>`.
  - `SUPABASE_REGION` - The region of your Supabase project.
  - `VITE_SUPABASE_URL` - The URL of your Supabase project. NOTE: If you won't use client side uploads, you can also call it `SUPABASE_URL` instead. The `VITE_` prefix is used for client side variables.
  - `VITE_SUPABASE_ANON_KEY` - The anonymous key of your Supabase project. It's marked as `anon` and `public` in your dashboard. NOTE: If you won't use client side uploads, you can also call it `SUPABASE_URL` instead. The `VITE_` prefix is used for client side variables.
  - `SUPABASE_SERVICE_ROLE_KEY` - The service role key of your Supabase project. It's marked as `service_role` and `secret` in your dashboard. It must only be used on the server side.
4. Go to your project's storage settings, e.g. `https://supabase.com/dashboard/project/<project-id>/settings/storage`. You'll need to click on "New access key". Then you can grab from this screen:
  - `STORAGE_ACCESS_KEY_ID` - The access key ID of your Supabase project.
  - `STORAGE_SECRET_ACCESS_KEY` - The secret access key of your Supabase project.

#### Configuring Site URL at the Correct Location

Now you need to configure the emails for the magic link authentication flow.

Here’s how to set the Site URL under **URL Configuration** for your Supabase project:

1. **Access the Supabase Dashboard**:
   - Go to `https://supabase.com/dashboard/`.
2. **Navigate to URL Configuration**:
   - In the left sidebar, click **Authentication**.
   - Then select **URL Configuration** (the direct URL would be `https://supabase.com/dashboard/project/[your-project-ref]/auth/url-configuration`).
3. **Set the Site URL**:
   - On the **URL Configuration** page, you'll see a field labeled **Site URL**.
   - Enter your application's base URL here (e.g., `https://yourapp.com` or `http://localhost:3000` for local development).
   - This is the base URL that Supabase will use as the `{{ .SiteURL }}` variable in your email templates (like the magic link template you provided).
4. **Save the Configuration**:
   - Click **Save** or the equivalent button to apply your changes.


Next, configure the email templates by clicking on **Emails** then on **Confirm Sign Up** (under `https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in the Supabase Dashboard.

```html
<h2>Create Your Account For The React Router Starter App</h2>

<p>Follow this link to register:</p>
<p><a href="{{ .SiteURL }}/register/confirm?token_hash={{ .TokenHash }}&type=email">Sign Up</a></p>
```

Next, configure the email templates by clicking on **Emails** then on **Magic Link** (under `https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in the Supabase Dashboard.

```html
<h2>Log In To The React Router Starter App</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/login/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

Click **Save Changes** to apply your changes.

#### Google OAuth

This section is based on the Supabase documentation for [**Login With Google**](https://supabase.com/docs/guides/auth/social-login/auth-google), but has been enhanced for clarity because the Supabase documentation does not work out of the box.

1. Create a new Google Cloud project. Go to the [Google Cloud Platform](https://console.cloud.google.com/home/dashboard) and create a new project if necessary.
  - After creating the project, click on `Get Started`, enter your app name, choose your audience, provide your contact information, and agree to the Google API Services.
2. Create your OAuth client.
   - Under **Clients**, click `Create Credentials`.
   - Choose `OAuth client ID`.
   - Choose `Web application`.
   - Click Create.
3. Now edit your OAuth client with your URLs.
   - Under **Authorized JavaScript origins**, add your site URL. (E.g. `http://localhost:3000`, and your production site URL.)
   - Under **Authorized redirect URIs**, enter the callback URL from the [Supabase dashboard](https://supabase.com/dashboard/project/_/auth/providers). Expand the Google Auth Provider section to display it.
      - You need to enter the Client ID and Client Secret in the Google Auth Provider section of the Supabase Dashboard, which you can find under **Additional Information** your OAuth client.
      - The redirect URL is visible to your users. You can customize it by configuring [custom domains](https://supabase.com/docs/guides/platform/custom-domains).
4. In the Google Cloud console, under **Data Access**, click `ADD OR REMOVE SCOPES`.
   - Configure the following non-sensitive scopes:
     - `.../auth/userinfo.email`
     - `...auth/userinfo.profile`
     - `openid`
   - Click `Update`.
5. In the Google Cloud console, Under **Branding** and then **Authorized Domains**, add your Supabase project's domain, which has the form `<PROJECT_ID>.supabase.co`.
6. In your `.env` file, set the `APP_URL` to your local development URL (by default it's `http://localhost:3000`) or your production site URL.

**Note:** [Here](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=environment&environment=server&queryGroups=framework&framework=remix#google-consent-screen) are more details on how to configure the Google consent screen to show your custom domain, and even your app's name and logo.

#### Uploading Directly to Supabase From the Client

Create a bucket in Supabase Storage.

1. Visit your project in the Supabase UI: https://supabase.com/dashboard/project/[your-project-ref].
2. Go to the Storage section.
3. Click on the "New Bucket" button.
4. Enter a name for the bucket, e.g. `"app-images"` if you want to use a special bucket for images, which we recommend.
5. Keep the bucket as "Private" to ensure that only authenticated users can access the files.
6. Click on "Additional configuration", set the maximum upload sizeto 1MB, and set the allowed MIME types to `image/*` to only allow image files.
7. Click on "Save".
8. Set the bucket name to the correct variable in your code. (By default, this is NOT an environment variable in this template, but you can easily change it to an environment variable.) Do a fuzzy search for `BUCKET` to find all the places you need to change the value to your bucket name.

#### Uploading to Supabase From the Server

This approach uses the [S3 compatible API](https://supabase.com/docs/guides/storage/s3/compatibility) of Supabase Storage.

Simply [follow the instructions in the documentation](https://supabase.com/docs/guides/storage/s3/authentication) and set the following environment variables in your `.env` file:

- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_REGION`
- `SUPABASE_PROJECT_ID`

The upload to Supabase Storage is done using `parseFormData` from [`@mjackson/form-data-parser`](https://github.com/mjackson/form-data-parser). This function is under the hood in `validateFormData` in `app/utils/validate-form-data.server.ts`.

### Resend

1. Create a new project at [Resend](https://resend.com/).
2. Got your project's [API keys](https://resend.com/api-keys) and click on "Create API key".
3. Set the `RESEND_API_KEY` environment variable to the API key you just created.

### Stripe

Install the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

or 

```bash
npm install -g stripe/stripe-cli
```

Confirm the installation:

```bash
stripe --version
```

Learn more about Stripe testing [here](https://docs.stripe.com/testing).

In a new terminal, forward webhooks to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks
```

Keep this terminal open. This will print out your local webhook secret. You'll need to set the `STRIPE_WEBHOOK_SECRET` environment variable to this value.

#### Stripe Dashboard

You can manage your products and prices in the Stripe Dashboard.

1. Create a new Stripe account.
2. In your [test mode dashboard](https://dashboard.stripe.com/test/dashboard), grab the API keys:
  - `STRIPE_SECRET_KEY` - The secret key of your Stripe account.

#### Pricing

This project comes with a specific pricing pre-configured:

3 paid tiers, and one enterprise (custom) tier. All paid tiers have a free trial. The free trial is 14 days and always for the highest plan.

If you need different pricing structures (e.g. freemium, one-time payments, etc.) you'll have to write that code yourself. But this template's structure makes it easy to customize the pricing page, the web hook handlers, etc. (NOTE: the public `/pricing` page has a free tier, but that's just to show you how to do it in the UI. The actual app has no free tier.)

For each price, set the "Product tax code" to "SaaS" and the "Unit label" to "seat".

#### 1. Create your products & prices

The React Router SaaS Template is set up to listen to product & prices webhooks. This also allows your account managers to create and manage products & prices in the Stripe Dashboard, and have them automatically reflected in your app.

By default, it uses three plans with seat limits of:

- low (Hobby): 1 seat
- mid (Startup): 10 seats
- high (Business): 25 seats

You might need to tweak a bit of test code if you want to change these limits. Do a fuzzy search for these limits.

For local development, run your app with `npm run dev` and forward webhooks to your local server with `stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks`.

For production, follow the same instructions, but us the production URL of your
app and make sure your app is deployed so it will accept the webhooks of the product creation. If you messed this up, you can always retrigger the webhooks using the Stripe CLI.

1. Go to the [Stripe Dashboard for products](https://dashboard.stripe.com/test/products)
2. Click on "Create Product" (or "Add a product" if you have none).
3. In the modal:
  - Enter the name of the product, e.g.: "Hobby Plan"
  - (Optional) Enter a description of the product, e.g.: "Hobby Plan for 1 user", and upload an image.
  - In the "Product Tax Code" dropdown, select "Software as a Service (SaaS) - business use".
  - Click on "More Options" and set the "Unit label" to "seat".
  - Enter a monhtly recurring price, e.g.: "$17". Make sure you set the currenty to USD in case its NOT the default.
  - Click on "More pricing options" and enter a lookup key, e.g.: "monthly_hobby_plan".
  - Click on "Next".
4. Click on "Add another price" and this time choose "Yearly" as the billing period. Make sure you enter the correct yearly price, e.g.: "$180". And remember to set the lookup key to "annual_hobby_plan".
5. **Important:** Now enter the value: "max_seats" in the metadata field and set it to "1". This app is set up to handle ALL limits via metadata. This allows you to easily change the limits for a product without having to change the code.
6. Finally, click "Add Product".
7. Now write your lookup keys in the `priceLookupKeysByTierAndInterval` object in `app/features/billing/billing-constants.ts`.

##### For Local Development: Replay the Events

After you’ve created your products and prices locally (with `npm run dev` and `stripe listen` forwarding to your webhook endpoint), you’ll see lines in your terminal like:

```
2025-05-10 17:58:56   --> product.created \[evt\_XXXXXXXXXXXXXXXXXXXXXXXX]
2025-05-10 17:58:58   --> price.created   \[evt\_YYYYYYYYYYYYYYYYYYYYYYYY]
2025-05-10 17:59:00   --> price.created   \[evt\_ZZZZZZZZZZZZZZZZZZZZZZZZ]
…etc.
```

1. **Copy the event IDs**  
   Whenever you see a line ending with `[evt_…]`, copy that ID (everything inside the brackets, for example `evt_XXXXXXXXXXXXXXXXXXXXXXXX`).

2. **Save them for later**  
   Put all your event IDs into a file (e.g. `stripe-events.txt`) or an environment variable. For example, in a Unix-style shell you might do:
   ```bash
   # stripe-events.txt
   evt_XXXXXXXXXXXXXXXXXXXXXXXX
   evt_YYYYYYYYYYYYYYYYYYYYYYYY
   evt_ZZZZZZZZZZZZZZZZZZZZZZZZ
   # …etc.
   ```

3. **Replay (resend) the events**
   When you need to wipe your local database and re-seed via webhooks, you can replay all those events at once. For example, if you saved them in `stripe-events.txt`:

   ```bash
   xargs -n1 stripe events resend < stripe-events.txt
   ```

   This command is also available via `npm run stripe:resend-events`.

> **Tip:** Keep `stripe-events.txt` checked into your repo (or in a safe place) so you can easily replay your entire setup whenever you rebuild your local database.

#### 2. Seed Stripe Data for Tests (Local vs. CI)

Your test suite relies on having Stripe products & prices in your database. Here’s how it works in each environment:

##### Local

1. **Replay your real events** (see “For Local Development: Replay the Events” above) so your DB contains the exact products, prices, metadata, and lookup keys you configured in Stripe.
2. **Run Vitest**:
   ```bash
   npm test
   ```

The global setup (`app/test/vitest.global-setup.ts`) will detect your existing products/prices and simply verify they’re present.

#### CI

In CI you won’t have webhook events or a populated database, so we automatically seed dummy data:

* **Global setup file**: `app/test/vitest.global-setup.ts`
* **Seeding helper**: `ensureStripeProductsAndPricesExist()` in `app/test/server-test-utils.ts`

What it does before your tests run:

1. Looks up each lookup key defined in `priceLookupKeysByTierAndInterval`.
2. If no product exists yet, creates one via `createPopulatedStripeProduct()` + `saveStripeProductToDatabase()`.
3. Creates both monthly & annual prices for that product with the right lookup keys & intervals.
4. Logs success or exits on error, ensuring your tests always see exactly the pricing rows they expect.

You don’t need to replay webhooks or manage `stripe-events.txt` in CI—this script handles everything. Just push your code and let your CI pipeline run `npm test`.

#### Checkout Session

You need to configure tax collection. You must have a valid origin address to enable automatic tax calculation in test mode. Visit [your tax dashboard](https://dashboard.stripe.com/test/settings/tax) to update it.

#### Customer Portal

Add the prices you created to your customer portal. Provide a configuration or create your default by saving your [customer portal settings in test mode](https://dashboard.stripe.com/test/settings/billing/portal). You'll also need to set proration and enable the ability to cancel a subscription via the portal.

#### Intentional Design Decisions for Stripe

- Downgrading a subscription does **not** deactivate existing members. The reasoning is simple: more active users typically means more revenue. Automatically removing members would work against that. If your plan has other limits, you should handle those restrictions yourself - but since subscriptions are billed per user per month, it’s in your interest to avoid limiting user count unnecessarily.
- Users can still be added even if the subscription is cancelled. This allows you to generate more revenue if the customer decides to subscribe again - since pricing is per user, more added users means a higher monthly total once they reactivate.

### Misc

Here are a few miscellaneous things you might want to change:

1. Give it your own name! Fuzzy search for `React Router SaaS Template` to find all the places you need to change the name.
2. The current theme violates color contrast. It's best for you to pick a theme that is accessible and configure it in your `app.css` file. Then you can enable contrast checks in your E2E tests again.

## Development

With all the envorinment variables set, you can run the app.

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`.

If you haven't done it yet, with both your dev server and webhook forwarding terminal open, replay the Stripe events in a third terminal.

```bash
npm run stripe:resend-events
```

### Project helper scripts

- `"build"` - Compiles the application using React Router's build process.
- `"build-with-mocks"` - Builds the app and initializes MSW in the client build directory without saving it to `package.json`.
- `"dev"` - Starts the development server using React Router's dev mode.
- `"dev-with-mocks"` - Starts the dev server with both client and server mocks enabled via `VITE_CLIENT_MOCKS=true` and `SERVER_MOCKS=true`.
- `"dev-with-server-mocks"` - Starts the dev server with only server-side mocks enabled.
- `"format"` - Formats all files in the project using Prettier.
- `"lint"` - Runs ESLint to check for linting errors across the codebase.
- `"lint:fix"` - Automatically fixes linting issues using ESLint.
- `"prepare"` - Sets up Git hooks via Husky (non-failing if Husky isn't installed).
- `"start"` - Serves the production build using `react-router-serve`.
- `"start-with-server-mocks"` - Serves the production build with server mocks enabled.
- `"stripe:resend-events"` - Resends Stripe events listed in `stripe-events.txt` using the Stripe CLI.
- `"test"` - Runs unit, integration, and component tests using Vitest with a verbose reporter in watch mode.
- `"test:e2e"` - Executes end-to-end tests using Playwright.
- `"test:e2e:ui"` - Launches Playwright Test Runner UI for interactive debugging.
- `"typecheck"` - Runs type generation for routes and performs TypeScript type checking.
- `"typegen"` - Generates type-safe route definitions for React Router.

### Prisma Helper Scripts

- `"prisma:deploy"` - Applies all pending migrations from the `prisma/migrations` directory to the database, then regenerates the Prisma Client. Typically used in production.
- `"prisma:migrate"` - Run via `npm run prisma:migrate -- my_migration_name` to create a new migration based on schema changes and apply it to the dev database.
- `"prisma:push"` - Pushes the current Prisma schema to the database without generating a migration, then regenerates the Prisma Client. Useful for prototyping.
- `"prisma:reset-dev"` - Wipes the database, seeds it, and starts the development server. Use this for a clean local dev environment.
- `"prisma:seed"` - Executes the seed script defined in `./prisma/seed.ts` to populate the database with initial data.
- `"prisma:setup"` - Regenerates Prisma Client, applies pending migrations, and pushes any remaining schema changes. Ideal for fresh environments.
- `"prisma:studio"` - Opens Prisma Studio, a GUI for exploring and editing your database.
- `"prisma:wipe"` - Resets the database by applying all migrations from scratch (`migrate reset`), then pushes the schema without requiring confirmation.

### Running E2E Tests

When you run the E2E tests locally, we recommend you do it in production mode and with mocks enabled. This resembles how your tests will run in CI. So your steps should be:

1. Run `npm run build-with-mocks`.
2. Run `npm run start-with-server-mocks`.
3. In another terminal, run `npm run test:e2e` UI.
4. Visit `localhost:3000` in your browser once. You should see `🔶 MSW mock server running ...` in the terminal running your app.
5. (Optionally) In a new terminal, run `npm run prisma:wipe` and `npm run stripe:resend-events` to reset the database and replay the Stripe events. (Anohter terminal that forwards the webhooks must already be running.)

### Routing

This template uses [flat routes](https://github.com/kiliman/remix-flat-routes).

### i18n

The French House Stack comes with localization support through
[remix-i18next](https://github.com/sergiodxa/remix-i18next).

The namespaces live in `public/locales/`.

### Toasts

The French House Stack includes utilities for toast notifications based on flash
sessions.

**Flash Data:** Temporary session values, ideal for transferring data to the
next request without persisting in the session.

**Redirect with Toast:**

- Utility: `redirectWithToast` (Path: `app/utils/toast.server.ts`)
- Use for redirecting with toast notifications.
- Example:
  ```tsx
  return redirectWithToast(`/organizations/${newOrganizations.slug}/home`, {
    title: 'Organization created',
    description: 'Your organization has been created.',
  });
  ```
- Accepts extra arguments for `ResponseInit` to set headers.

**Direct Toast Headers:**

- Utility: `createToastHeaders` (Path: `app/utils/toast.server.ts`)
- Use for non-redirect scenarios.
- Example:
  ```tsx
  return json(
    { success: true },
    {
      headers: await createToastHeaders({
        description: 'Organization updated',
        type: 'success',
      }),
    },
  );
  ```

**Combining Multiple Headers:**

- Utility: `combineHeaders` (Path: `app/utils/toast.server.tsx`)
- Combine toast headers with additional headers.
- Example:
  ```tsx
  return json(
    { success: true },
    {
      headers: combineHeaders(
        await createToastHeaders({ title: 'Profile updated' }),
        { 'x-foo': 'bar' },
      ),
    },
  );
  ```

### Playwright 🎭

> **Note:** make sure you've run `npm run dev` at least one time before you run
> the E2E tests!

We use Playwright for our End-to-End tests in this project. You'll find those in
the `playwright/` directory. As you make changes to your app, add to an existing
file or create a new file in the `playwright/e2e` directory to test your
changes.

[Playwright natively features testing library selectors](https://playwright.dev/docs/release-notes#locators)
for selecting elements on the page semantically.

To run these tests in development, run `npm run test:e2e` which will start the
dev server for the app as well as the Playwright client.

> **Note:** You might need to run `npx playwright install` to install the
> Playwright browsers before running your tests for the first time.

#### Problems with ShadcnUI

Some of the colors of ShadcnUI's components are lacking the necessary contrast.

You can deactivate those elements in checks like this:

```ts
const accessibilityScanResults = await new AxeBuilder({ page })
  .disableRules('color-contrast')
  .analyze();

// or

const accessibilityScanResults = await new AxeBuilder({ page })
  .disableRules('color-contrast')
  .analyze();
```

or pick a color scheme like "purple" that has good contrast.

#### VSCode Extension

If you're using VSCode, you can install the
[Playwright extension](https://github.com/microsoft/playwright-vscode) for a
better developer experience.

#### Utilities

We have a utility for testing authenticated features without having to go
through the login flow:

```ts
test('something that requires an authenticated user', async ({ page }) => {
  await loginByCookie({ page });
  // ... your tests ...
});
```

Check out the `playwright/utils.ts` file for other utility functions.

#### Miscellaneous

To mark a test as todo in Playwright,
[you have to use `.fixme()`](https://github.com/microsoft/playwright/issues/10918).

```ts
test('something that should be done later', ({}, testInfo) => {
  testInfo.fixme();
});

test.fixme('something that should be done later', async ({ page }) => {
  // ...
});

test('something that should be done later', ({ page }) => {
  test.fixme();
  // ...
});
```

The version using `testInfo.fixme()` is the "preferred" way and can be picked up
by the VSCode extension.

### Vitest ⚡️

For lower level tests of utilities and individual components, we use `vitest`.
We have DOM-specific assertion helpers via
[`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

By default, Vitest runs tests in the
[`"happy-dom"` environment](https://vitest.dev/config/#environment). However,
test files that have `.server` in the name will be run in the `"node"`
environment.

### Test Scripts

- `npm run test` - Runs all Vitest tests.
- `npm run test:e2e` - Runs all E2E tests with Playwright.
- `npm run test:e2e:ui` - Runs all E2E tests with Playwright in UI mode.

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your
editor to get a really great in-editor experience with type checking and
auto-complete. To run type checking across the whole project, run
`npm run type-check`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.cjs`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project.
It's recommended to install an editor plugin (like the
[VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode))
to get auto-formatting on save. There's also a `npm run format` script you can
run to format all files in the project.

### AI-Driven Development

This template leverages and was written with **AI-Driven Development (AIDD)**, where you steer high-level design and let AI generate the bulk of your implementation via [**SudoLang**](https://github.com/paralleldrive/sudolang-llm-support), a natural-language-style pseudocode that advanced LLMs already understand.

With AIDD you can:

- Define requirements and architecture in plain pseudocode.
- Let AI produce 90%+ of your source code (tests, UIs, state layers, etc.).
- Iterate and refactor faster, keeping consistency across your codebase.

#### Included SudoLang Metaprograms

Under `meta/`, you’ll find ready-to-use scripts that automate common workflows:

- **tdd-functions.sudo** – full TDD pipelines (gather requirements, generate tests, implement)
- **react-component.sudo** – scaffold React components with tests and docs
- **action-tests.sudo** – test React Router action handlers
- **svg-to-react.sudo** – convert SVG assets into React components

Learn more about AIDD and SudoLang in [The Art of Effortless Programming](https://leanpub.com/effortless-programming) by [Eric Elliott](https://www.threads.com/@__ericelliott).

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

This template includes three Dockerfiles optimized for different package managers:

- `Dockerfile` - for npm
- `Dockerfile.pnpm` - for pnpm
- `Dockerfile.bun` - for bun

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# For pnpm
docker build -f Dockerfile.pnpm -t my-app .

# For bun
docker build -f Dockerfile.bun -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Maintenance

You can use

```
npx npm-check-updates -u
```

to check for updates and install the latest versions.

It should be easy to upgrade all packages since your static analysis checks and your tests will tell you if anything is broken.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Check Out the Epic Stack

Some of the code of this starter template was taken from or inspired by the [Epic Stack](https://github.com/epicweb-dev/epic-stack) from [Kent C. Dodds](http://kentcdodds.com/). His template has different defaults, so check it out if you're looking for a different opinionated starter template.

## Built with ❤️ by [ReactSquad](https://reactsquad.io/)

If you want to hire senior React developers to augment your team, or build your entire product from scratch, [schedule a call with us](https://www.reactsquad.io/schedule-a-call).

## [Buidl!](https://www.urbandictionary.com/define.php?term=%23BUIDL)

Now go out there make some magic! 🧙‍♂️
