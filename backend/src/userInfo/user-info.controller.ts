import { Controller, Get,  Body, Param, Patch,  Query, Put, Res } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { CreateUserInfoDto } from './dto/create-user-info.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('user-info')
@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Verify token and redirect to MachineryMax' })
  @ApiResponse({ status: 302, description: 'Redirects to MachineryMax equipment selling page' })
  async verifyToken(@Query('token') token: string, @Res() res: Response) {
    const { redirectUrl } = await this.userInfoService.verifyAndDecodeToken(token);
    return res.redirect(302, redirectUrl);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user info' })
  @ApiResponse({ status: 200, description: 'Returns updated user info' })
  async update(@Param('id') id: string, @Body() createUserInfoDto: CreateUserInfoDto) {
    return this.userInfoService.update(id, createUserInfoDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all user submissions' })
  async findAll() {
    return this.userInfoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user submission by ID' })
  async findOne(@Param('id') id: string) {
    return this.userInfoService.findOne(id);
  }

  @Patch(':id/mark-contacted')
  @ApiOperation({ summary: 'Mark user as contacted' })
  async markAsContacted(@Param('id') id: string) {
    return this.userInfoService.markAsContacted(id);
  }
} 