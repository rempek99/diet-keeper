# Meal Tracker and Fitatu Exporter: Project Todo

## Project goal

Create a web app for saving recipes, recording prepared/eaten servings, calculating
nutrition, and exporting meal details for manual entry in Fitatu. The app owns all
meal data; any unofficial Fitatu integration is optional and experimental.

## Recommended stack

| Area              | Choice                      | Learning resource                                                            |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Backend API       | Node.js, TypeScript, NestJS | [NestJS first steps](https://docs.nestjs.com/first-steps)                    |
| Database          | PostgreSQL                  | [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) |
| Database access   | Prisma ORM                  | [Prisma quickstart](https://www.prisma.io/docs/getting-started/quickstart)   |
| Frontend          | Next.js, React, TypeScript  | [Next.js Learn](https://nextjs.org/learn)                                    |
| API documentation | Swagger/OpenAPI via NestJS  | [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)               |
| Containers        | Docker Compose              | [Docker getting started](https://docs.docker.com/get-started/)               |
| Validation        | class-validator             | [NestJS validation](https://docs.nestjs.com/techniques/validation)           |
| Testing           | Jest and Supertest          | [NestJS testing](https://docs.nestjs.com/fundamentals/testing)               |

## Learning path

- [x] Learn JavaScript and TypeScript fundamentals before starting NestJS.
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  - [Node.js introduction](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [ ] Complete the NestJS "First steps" guide and create a small sample controller.
- [ ] Complete Prisma's PostgreSQL quickstart and practice creating a migration.
- [ ] Complete the Next.js Learn tutorial through data fetching and forms.
- [ ] Learn HTTP basics: methods, status codes, JSON, and REST resources.
  - [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
  - [MDN HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Phase 1: Set up the workspace

- [ ] Create a Git repository and add a concise `README.md`.
- [ ] Create a NestJS API project (`npx @nestjs/cli new api`).
- [ ] Create a Next.js frontend project (`npx create-next-app@latest web`).
- [ ] Add Docker Compose with PostgreSQL for local development.
- [ ] Add environment variable templates (`.env.example`), but never commit real secrets.
- [ ] Configure Prisma in the API and confirm it connects to PostgreSQL.
- [ ] Add Swagger to the API and verify the interactive documentation opens locally.

## Phase 2: Design the data model

- [ ] Define `Ingredient`: name, brand, barcode (optional), nutrition per 100 g, and unit.
- [ ] Define `Recipe`: name, instructions, total weight, and default serving count.
- [ ] Define `RecipeIngredient`: recipe, ingredient, and ingredient weight in grams.
- [ ] Define `PreparedMeal`: recipe, prepared date, actual total weight, and notes.
- [ ] Define `MealLog`: prepared meal, consumed date/time, consumed weight, and meal type.
- [ ] Define `NutritionSnapshot`: calories, protein, fat, carbohydrates, fiber, and salt.
- [ ] Define `ExportRecord`: meal log, export method, status, external ID, and error message.
- [ ] Create a Prisma schema and migration for the model.
- [ ] Seed a small set of test ingredients and recipes.

## Phase 3: Build the backend API

- [ ] Add modules for ingredients, recipes, prepared meals, meal logs, nutrition, and exports.
- [ ] Add CRUD endpoints for ingredients.
- [ ] Add CRUD endpoints for recipes and recipe ingredients.
- [ ] Calculate recipe nutrition by summing each ingredient's nutrition proportionally to grams.
- [ ] Calculate nutrition per recipe serving and per consumed amount.
- [ ] Add endpoints to create prepared meals and meal logs.
- [ ] Add daily and date-range nutrition summary endpoints.
- [ ] Validate all request bodies and return clear validation errors.
- [ ] Document every endpoint in Swagger.
- [ ] Add unit tests for nutrition calculations.
- [ ] Add integration tests for recipe and meal-log endpoints.

## Phase 4: Build the frontend

- [ ] Create pages for ingredients, recipes, preparing a recipe, and logging a meal.
- [ ] Create an ingredient form with nutrition values per 100 g.
- [ ] Create a recipe editor that adds ingredients and their weights.
- [ ] Display total nutrition and nutrition per serving while editing recipes.
- [ ] Create a "Prepare recipe" form for actual prepared weight and serving count.
- [ ] Create a meal log form for consumed weight and meal type.
- [ ] Create a daily summary view with calories and macronutrients.
- [ ] Add loading, empty, and error states to all screens.

## Phase 5: Fitatu export

- [ ] Start with a manual export view containing meal name, weight, calories, protein, fat,
      carbohydrates, fiber, and salt.
- [ ] Add a "Copy export text" button and a clear status that nothing has been synced.
- [ ] Define a `FitatuExporter` interface so the core app does not depend on Fitatu.
- [ ] Research Fitatu's current terms and whether official integration access exists.
- [ ] Only if permitted, isolate an unofficial client in a separate module behind a feature flag.
- [ ] Encrypt credentials at rest, never log tokens/cookies/passwords, and use short-lived
      credentials where possible.
- [ ] Record each export attempt in `ExportRecord`.
- [ ] Make exports idempotent to prevent duplicate meals after retries.
- [ ] Provide a manual retry and a clear error message if export fails.

## Phase 6: Security, quality, and deployment

- [ ] Add user authentication before storing personal meal data.
  - [NestJS authentication](https://docs.nestjs.com/security/authentication)
- [ ] Restrict every user to their own data.
- [ ] Add rate limiting and secure HTTP headers.
  - [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [ ] Run tests, linting, and type checking in GitHub Actions.
  - [GitHub Actions quickstart](https://docs.github.com/actions/writing-workflows/quickstart)
- [ ] Build production Docker images.
- [ ] Deploy the API, frontend, and managed PostgreSQL database.
- [ ] Configure backups and error monitoring.
- [ ] Write setup, environment-variable, and deployment instructions in the README.

## MVP completion criteria

- [ ] A user can create ingredients with nutrition per 100 g.
- [ ] A user can create a recipe from weighted ingredients.
- [ ] A user can record a prepared portion and how much they ate.
- [ ] The app accurately calculates calories, protein, fat, and carbohydrates.
- [ ] A user can copy a Fitatu-ready nutrition summary for manual entry.
- [ ] The API is documented and core nutrition logic is tested.
