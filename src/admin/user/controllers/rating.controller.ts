import { CurrentUser, Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    ApiTags,
    getSchemaPath
} from '@nestjs/swagger';
import { RoleEnum } from '@shared/enums/role.enum';
import { JwtPayload } from '@auth/interfaces';
import { RatingRequestDto } from '../dto/rating-request.dto';
import { RatingService } from '@user/services/rating.service';
import { RatingQueryDto } from '../dto/rating-query.dto';
import {
    RatingTransactionResponseDto,
    RatingTransactionWrapperResponseDto
} from '../dto/rating-response.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/rating')
export class RatingController {
    constructor(private readonly ratingService: RatingService) {}

    @Post()
    @HttpCode(200)
    @ApiBearerAuth()
    async updateUserRating(
        @CurrentUser() user: JwtPayload,
        @Body() dto: RatingRequestDto
    ) {
        await this.ratingService.updateUserRating(user.id, dto);
    }

    @Get('transaction')
    @ApiBearerAuth()
    @ApiExtraModels(PaginationResponseDto, RatingTransactionResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(
                                    RatingTransactionResponseDto
                                )
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async getRatingTransactions(@Query() query: RatingQueryDto) {
        return await this.ratingService.getRatingTransactions(query);
    }

    @Get('transaction/:id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: RatingTransactionWrapperResponseDto })
    async getRatingTransactionById(@Param('id', ParseIntPipe) id: number) {
        return await this.ratingService.getRatingTransactionDtoById(id);
    }

    @Patch('transaction/:id')
    @HttpCode(200)
    @ApiBearerAuth()
    async updateRatingTransaction(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload,
        @Body() dto: RatingRequestDto
    ) {
        await this.ratingService.updateRatingTransaction(id, user.id, dto);
    }

    @Delete('transaction/:id')
    @ApiBearerAuth()
    async deleteRatingTransaction(@Param('id', ParseIntPipe) id: number) {
        await this.ratingService.deleteRatingTransaction(id);
    }
}
