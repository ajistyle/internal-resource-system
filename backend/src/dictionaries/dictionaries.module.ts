import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dictionary } from '../entities/dictionary.entity';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { DictionariesService } from './dictionaries.service';
import { DictionariesController } from './dictionaries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dictionary]), OperationLogsModule],
  controllers: [DictionariesController],
  providers: [DictionariesService],
  exports: [DictionariesService],
})
export class DictionariesModule {}
