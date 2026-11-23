
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Mazaj Nuts Roastery Backend API is running!';
  }
}
