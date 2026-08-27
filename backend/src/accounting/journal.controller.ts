import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { JournalService } from './journal.service.js';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('entries')
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.journalService.findAll(businessId, from, to);
  }

  @Get('entries/:id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.journalService.findOne(businessId, id);
  }

  @Post('entries')
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalService.createManual(businessId, dto);
  }

  @Delete('entries/:id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.journalService.removeManual(businessId, id);
  }

  @Get('ledger/:accountId')
  getLedger(
    @CurrentBusinessId() businessId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.journalService.getLedger(businessId, accountId);
  }

  @Get('trial-balance')
  getTrialBalance(@CurrentBusinessId() businessId: string) {
    return this.journalService.getTrialBalance(businessId);
  }
}
