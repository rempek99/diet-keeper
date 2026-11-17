# Diet Keeper

## Description

Diet Keeper is a personal nutrition assistant that helps you plan, prepare and track your meals.

It keeps a shared catalog of **products** with their nutritional values (calories, protein, fat, carbohydrates and more), and a library of **meals** built from those products, including meal ideas contributed by users. Each user has a profile with their own dietary needs and goals.

On top of this data, Diet Keeper gives smart, personalized help:

- **Meal suggestions:** recommends meals from the shared meal library that fit your nutritional needs.
- **Natural-language input:** turns free text such as _"two eggs and a slice of rye bread for breakfast"_ into structured meal and nutrition data, so logging food doesn't mean filling in forms.

The project has a NestJS REST API backed by PostgreSQL, and a mobile app that connects to an AI agent for conversational meal planning and logging.

## Features

Diet Keeper is free to use. Its main goal is to make logging what you eat take seconds, not minutes.

### Quick meal logging

- [ ] Log a meal by typing it in plain words, e.g. _"oatmeal with banana and a coffee with milk"_
- [ ] Log a meal again in one tap from recent and favourite meals
- [ ] Meals are assigned to the day and meal type (breakfast, lunch, dinner, snack) automatically, and you can change them
- [ ] Edit or delete any entry afterwards

### Smart interpretation (backend)

- [ ] Turn free text into products, amounts and units
- [ ] Match products to the product repository and calculate their nutritional values
- [ ] Use sensible default portions when no amount is given (e.g. "an apple" ≈ 150 g)
- [ ] Ask for confirmation only when the input is unclear

### Daily overview

- [ ] Daily summary of calories, protein, fat and carbohydrates
- [ ] History of past days

### Meal suggestions

- [ ] Suggest meals from the meal repository that fit what is left of the day's needs
- [ ] Take the user's goals and preferences into account
- [ ] Let users add their own meal ideas to the repository

### Repositories

- [ ] Products: nutritional values per 100 g
- [ ] Meals: recipes built from products, including ideas from users
- [ ] Users: profile, daily goals and preferences

### Optional: Fitatu integration

- [ ] Export logged meals with their nutritional values, ready to enter in the Fitatu app
- [ ] Sync meals to Fitatu automatically, only if Fitatu's terms allow it (experimental, off by default)
