
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Backend welcome message' })
  getHello() {
    return {
      success: true,
      message: this.appService.getHello(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Backend health check' })
  healthCheck() {
    return {
      success: true,
      message: 'Backend is running',
      service: 'mazajnutsbackend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
