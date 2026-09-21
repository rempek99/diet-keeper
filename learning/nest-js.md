# NestJS

## Introduction

NestJS is a framework for building efficient, scalable Node.js server-side applications. It uses modern JavaScript, is built with TypeScript (preserving compatibility with pure JavaScript), and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

## Elements

### main.ts

The bootstrap file of a NestJS application is typically named `main.ts`. This file is responsible for initializing the application and starting the server. It usually contains code to create an instance of the NestJS application and listen on a specified port.

### app.module.ts

The `app.module.ts` file is the root module of a NestJS application. It is decorated with the `@Module()` decorator, which defines the components of the application, such as controllers, providers, and imports. This module serves as the entry point for the application and organizes the various parts of the application into a cohesive structure.

### controllers

Controllers in NestJS are responsible for handling incoming HTTP requests and returning responses to the client. They are decorated with the `@Controller()` decorator and can define various routes using decorators like `@Get()`, `@Post()`, `@Put()`, and `@Delete()`. Controllers typically delegate business logic to services.

### services

Services in NestJS are classes that encapsulate business logic and can be injected into controllers or other services. They are decorated with the `@Injectable()` decorator, which allows them to be managed by NestJS's dependency injection system. Services often interact with databases, perform calculations, or handle other complex operations.

## New Module

To create a new module in NestJS, you can use the Nest CLI command:

```bash
nest generate module <module-name>
```

## Module structure

A typical module in NestJS has the following structure:

```
src/
  └── <module-name>/
      ├── <module-name>.module.ts
      ├── <module-name>.controller.ts
      └── <module-name>.service.ts
```

The syntax for defining a module is as follows:

```typescript
import { Module } from '@nestjs/common';

import { <ModuleName>Controller } from './<module-name>.controller';
import { <ModuleName>Service } from './<module-name>.service';

@Module({
  controllers: [<ModuleName>Controller],
  providers: [<ModuleName>Service],
})
export class <ModuleName>Module {}
```

## New contoller

To create a new controller in NestJS, you can use the Nest CLI command:

```bash
nest generate controller <controller-name>
```

## Controller structure

A typical controller in NestJS has the following structure:

```
src/
  └── <module-name>/
      └── <controller-name>.controller.ts
```

The syntax for defining a controller is as follows:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('<controller-name>')
export class <ControllerName>Controller {
    @Get()
    getHello(): string {
        return 'Hello World!';
    }
}
```

Controllers methods order is important. The order of the methods in a controller can affect the routing behavior, especially when using route parameters or wildcard routes. It's generally recommended to define more specific routes before more general ones to avoid unexpected behavior.

```typeScript
import { Controller, Get, Param } from '@nestjs/common';
@Controller('<controller-name>')
export class <ControllerName>Controller {
    @Get(':id')
    getById(@Param('id') id: string): string {
        return `Item with ID: ${id}`;
    }

    @Get('test')
    getTest(): string {
        return 'Test route';
    }
}
```

### How to inject a service into a controller

In NestJS, you can inject a service into a controller by using the constructor of the controller. The service must be provided in the module's `providers` array. Here's an example:

```typescript
import { Controller, Get } from '@nestjs/common';
import { <ModuleName>Service } from './<module-name>.service';

@Controller('<controller-name>')
export class <ControllerName>Controller {
  constructor(private readonly <moduleName>Service: <ModuleName>Service) {}

  @Get()
  getData() {
    return this.<moduleName>Service.getData();
  }
}
```

In the example above, the `getById` method is defined before the `getTest` method. If the order were reversed, a request to `/test` would be incorrectly routed to the `getById` method, resulting in an error.

## Running NestJS application

To run a NestJS application, you can use the Nest CLI command:

```bash
npm run start
```

By default, the application will start on `http://localhost:3000`. You can also use:

```bash
npm run start:dev
```

This command will start the application in development mode with hot-reloading enabled.

### Dependency Injection (service injection in controllers)

```typescript
import { Controller, Get } from '@nestjs/common';
import { <ModuleName>Service } from './<module-name>.service';

@Controller('<controller-name>')
export class <ControllerName>Controller {
  constructor(private readonly <moduleName>Service: <ModuleName>Service) {}

  @Get()
  getData() {
    return this.<moduleName>Service.getData();
  }
}
```

The NestJS framework uses dependency injection to manage the creation and sharing of services across the application. By injecting services into controllers, you can keep your code modular, testable, and maintainable. It automatically handles the instantiation and lifecycle of the services, reducing boilerplate code and improving overall application structure.

## Connecting to databases

To integrate an application with the database, you typically use an ORM (Object-Relational Mapping) library such as TypeORM or Prisma. NestJS provides modules and decorators to facilitate database integration, making it easier to manage entities, repositories, and database connections within your application. The following examples will present the Prisma solution.

### Installation

```bash
npm install @prisma
npm install @prisma/client

# Initialize Prisma
np prisma init
```
