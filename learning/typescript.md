# Typescript

## Features

- Static typing
- Code completion
- Refactoring
- Shorthand notation

## tsconfig.json

JSON file that specifies the root files and the compiler options required to compile the project.

## Built in Typescript types

### JavaScript

- number
- string
- boolean
- null
- undefined
- object

### Typescript Types

- any
- unknown
- never
- enum
- tuple

## Any type

Represent any kind of value. It is the most flexible type in Typescript, but it also removes type safety. Avoid!

```typescript
let value: any = 42;
value = 'Hello, world!';
value = true;
```

## Tuple type

A tuple is an array with a fixed number of elements where each element can have a different type.

```typescript
let tuple: [string, number, boolean] = ['Hello', 42, true];
```

## Enum type

List of related constants that can be numeric or string values. Enums are useful for representing a set of named values.

```typescript
enum Color {
  Red = 'r',
  Green = 'g',
  Blue = 'b',
}
```

If the enum is declared as `const` the compiler will optimize the code and replace the enum with their values.

## Functions annotations

In Typescript, you can specify the types of function parameters and return values.

```typescript
function add(a: number, b: number): number {
    return a + b;
    }
}
```

## Objects

An object is a collection of key-value pairs. In Typescript, you can specify the types of the keys and values. Objects are dynamic in nature, but you can use interfaces to define the shape of an object.

```typescript
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: 'John',
  age: 30,
};
```

## Union types

A union type allows a variable to hold values of multiple types. You can use the `|` operator to define a union type.

```typescript
let value: string | number;
value = 'Hello'; // valid
value = 42; // valid
value = true; // invalid
```

Also you can use union types in function parameters and return types.

```typescript
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    // Narrowing the type to string
    return value.toUpperCase();
  } else {
    // Narrowing the type to number
    return value.toFixed(2);
  }
}
```

## Intersection types

An intersection type combines multiple types into one. You can use the `&` operator to define an intersection type.

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee {
  employeeId: number;
}

const employee: Person & Employee = {
  name: 'John',
  age: 30,
  employeeId: 1234,
};

type EmployeeWithAddress = Person & Employee & { address: string };
```

## Literal types

A literal type is a type that represents a specific value. You can use literal types to create more specific types.

```typescript
// Literal (exact, specific)
type Direction = 'up' | 'down' | 'left' | 'right';
function move(direction: Direction) {
  // ...
}

type StatusCode = 200 | 404 | 500;
function handleResponse(status: StatusCode) {
  // ...
}
```

## Nullable types

In Typescript, you can use the `null` and `undefined` types to represent the absence of a value. You can also use the `?` operator to make a property optional.

```typescript
interface Person {
  name: string;
  age?: number; // optional property
}

const person: Person = {
  name: 'John',
  age: undefined, // valid
};
const person2: Person = {
  name: 'Jane',
  // age is not provided, valid
};

function greet(name: string | null | undefined) {
  if (name) {
    console.log('Hello, stranger!');
  } else {
    console.log(`Hello, ${name}!`);
  }
}
```

Difference between `null` and `undefined`:

- `null` is an assignment value that represents the intentional absence of any object value. It is a primitive value that can be assigned to a variable to indicate that it has no value.
- `undefined` is a primitive value that represents the absence of a value or an uninitialized variable. It is the default value of uninitialized variables and function parameters that have not been provided a value.

## Optional property access

```typescript
function getCustomer(id: number): Customer | null | undefined {
  // ...
}

console.log(getCustomer(1)?.name); // optional chaining, will return undefined if getCustomer returns null or undefined

customers?.[0]?.name; // optional chaining with array access, will return undefined if customers is null or undefined

let log: any = null;
log?.('Hello, world!'); // optional chaining with function call, will not throw an error if log is null or undefined
```
