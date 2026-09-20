# Architecture

Minimal implementation conventions for Planning Poker — where code goes and how it is written. Scope and
product rules live in `docs/product-plan.md`; how agents work in this repository is `AGENTS.md`. This file
adds no product rules of its own.

## Layout

| Directory | Holds |
| --------- | ----- |
| `lib/estimation/` | Pure domain types, deck conversion and statistics. |
| `components/planning-poker/` | React presentation and interactive components. |
| `app/` | Routes, page composition and application-level wiring. |

## Domain

- Domain functions are pure and must not mutate their inputs.
- Keep calculations out of JSX and out of React state handlers. A component renders a value the domain has
  already computed; it does not compute one.

## Components

- Use Server Components by default. Add `"use client"` only to the smallest interactive boundary that needs
  state, events, effects or browser APIs.

## Tests

- Tests sit beside the source they cover: domain tests as `*.test.ts`, component tests as `*.test.tsx`.
- Expected values in a test are written independently. Never calculate them with the function under test.
- Each test validates one clear behaviour.

## Constraints

- No Redux. The approved state approach for the MVP remains React state and context.
- Design exports under `design/` are reference material. They are never copied or imported as application
  runtime code.
