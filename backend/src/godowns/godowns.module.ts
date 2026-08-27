import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GodownsController } from './godowns.controller.js';
import { GodownsService } from './godowns.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GodownsController],
  providers: [GodownsService],
  exports: [GodownsService],
})
export class GodownsModule {}
