import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getUserById(id: string): object {
    return { id: id, name: 'John Doe', email: 'johndoe@example.com' };
  }
  getAllUsers(): object[] {
    return [
      { id: '1', name: 'John Doe', email: 'johndoe@example.com' },
      { id: '2', name: 'Jane Smith', email: 'janesmith@example.com' },
      { id: '3', name: 'Alice Johnson', email: 'alicejohnson@example.com' },
      { id: '4', name: 'Bob Brown', email: 'bobbrown@example.com' },
      { id: '5', name: 'Charlie Davis', email: 'charliedavis@example.com' },
    ];
  }
}
