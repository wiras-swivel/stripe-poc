# Stripe Pricing Demo

A React + TypeScript + MUI proof of concept for a GitHub Pages-friendly Stripe pricing table.

- The app is fully static and can be published on GitHub Pages
- The Stripe pricing table handles checkout, pricing, and cross-sell
- You can update products, prices, and cross-sell behavior in Stripe without changing app code

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in the Stripe publishable key and pricing table ID.
3. Install dependencies: `npm install`
4. Start the frontend locally: `npm run dev`

## Required environment values

Frontend:

- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICING_TABLE_ID`

## Stripe setup

Create or keep a Stripe pricing table, then configure any cross-sell or add-on behavior inside Stripe itself.
This app simply embeds that pricing table and stays out of the checkout flow.

If you later change prices or product logic in Stripe, the page will reflect those changes as long as the pricing table stays updated in Stripe.

## Publish on GitHub Pages

This repo includes a workflow at `.github/workflows/deploy-pages.yml` that deploys the app to GitHub Pages when you push to `main`.

1. Push this project to a GitHub repository.
2. In GitHub, open **Settings -> Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. In **Settings -> Secrets and variables -> Actions -> Variables**, add:
	- `VITE_STRIPE_PUBLISHABLE_KEY`
	- `VITE_STRIPE_PRICING_TABLE_ID`
5. Push to `main` (or run the workflow manually from the **Actions** tab).

After deployment, your site will be available at your repository's GitHub Pages URL.

## Stripe redirect target

Use the confirmation hash route for your Stripe success URL, for example:

`https://<your-pages-url>/#/confirmation`

The app stores the entered account details and selected plan in session storage so the confirmation screen can show the payment summary after checkout redirects back.
