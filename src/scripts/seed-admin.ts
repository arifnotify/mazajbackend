import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminsService } from '../modules/admins/admins.service';
import { AdminRole } from '../shared/enums/admin-role.enum';

async function bootstrap() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME are required',
    );
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error('Password must be between 12 and 72 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const adminsService = app.get(AdminsService);

    const admin = await adminsService.createAdmin({
      email,
      password,
      name,
      role: AdminRole.SUPER_ADMIN,
    });

    console.log('Super Admin created successfully');
    console.log(`Admin Email: ${admin.email}`);
    console.log(`Admin Role: ${admin.role}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Admin creation failed:', error.message);
  process.exitCode = 1;
});