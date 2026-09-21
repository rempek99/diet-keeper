import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signin() {
    return { msg: 'Signed in successfully' };
  }

  signup() {
    return { msg: 'Signed up successfully' };
  }
}
