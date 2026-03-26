import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectAttachmentsService } from './project-attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '../entities/role.entity';

const uploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

@Controller('project-attachments')
@UseGuards(JwtAuthGuard)
export class ProjectAttachmentsController {
  constructor(private readonly service: ProjectAttachmentsService) {}

  @Get()
  list(
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('category') category?: string,
  ) {
    return this.service.findByProject(projectId, category);
  }

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  @UseInterceptors(uploadInterceptor)
  upload(
    @Query('projectId', ParseIntPipe) projectId: number,
    @Query('category') category: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('请选择文件');
    return this.service.upload(projectId, category, file, req.user as any);
  }

  @Get(':id/download-url')
  getDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('expiry') expiry?: string,
  ) {
    const sec = expiry != null && expiry !== '' ? parseInt(expiry, 10) : 600;
    const safe = Number.isFinite(sec) ? Math.min(Math.max(sec, 60), 3600) : 600;
    return this.service.getDownloadUrl(id, safe);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.EDITOR)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.remove(id, req.user as any);
  }
}
