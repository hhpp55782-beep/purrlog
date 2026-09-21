import { Module } from '@nestjs/common';

import { PurrlogController } from './purrlog.controller';
import { PurrlogService } from './purrlog.service';

@Module({
  controllers: [PurrlogController],
  providers: [PurrlogService],
  exports: [PurrlogService],
})
export class PurrlogModule {}
