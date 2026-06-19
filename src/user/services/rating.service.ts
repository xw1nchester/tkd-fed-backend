import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '@prisma/prisma.service';
import { RatingRequestDto } from '@admin/user/dto/rating-request.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { Prisma } from '@prisma-client';
import { RatingQueryDto } from '@admin/user/dto/rating-query.dto';

@Injectable()
export class RatingService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService
    ) {}

    async updateUserRating(
        adminId: number,
        { userId, delta, reason }: RatingRequestDto
    ) {
        const user = await this.userService.getById(userId);

        if (user.rating + delta < 0) {
            delta = -user.rating;
        }

        await this.prismaService.user.update({
            where: { id: userId },
            data: { rating: user.rating + delta }
        });

        await this.prismaService.ratingTransaction.create({
            data: {
                userId,
                adminId,
                delta,
                reason
            }
        });
    }

    private getSelect(): Prisma.RatingTransactionSelect {
        return {
            id: true,
            delta: true,
            reason: true,
            createdAt: true,
            userId: true,
            admin: {
                select: {
                    id: true,
                    lastName: true,
                    firstName: true,
                    middleName: true
                }
            }
        };
    }

    async getRatingTransactions({ userId, page, limit }: RatingQueryDto) {
        const skip = (page - 1) * limit;

        const data = await this.prismaService.ratingTransaction.findMany({
            where: { userId },
            select: this.getSelect(),
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        });

        const totalCount = await this.prismaService.ratingTransaction.count({
            where: { userId }
        });

        return new PaginationDto(data, totalCount, page, limit);
    }

    async getRatingTransactionById(id: number) {
        const ratingTransaction =
            await this.prismaService.ratingTransaction.findFirst({
                where: { id },
                select: this.getSelect()
            });

        if (!ratingTransaction) {
            throw new NotFoundException();
        }

        return ratingTransaction;
    }

    async getRatingTransactionDtoById(id: number) {
        const ratingTransaction = await this.getRatingTransactionById(id);
        return { ratingTransaction };
    }

    async updateRatingTransaction(
        id: number,
        adminId: number,
        { userId, delta, reason }: RatingRequestDto
    ) {
        const { delta: oldDelta } = await this.getRatingTransactionById(id);

        await this.prismaService.user.update({
            where: { id: userId },
            data: {
                rating: {
                    increment: delta - oldDelta,
                }
            }
        });

        await this.prismaService.ratingTransaction.update({
            where: { id },
            data: {
                userId,
                adminId,
                delta,
                reason
            }
        });
    }

    async deleteRatingTransaction(id: number) {
        const ratingTransaction = await this.getRatingTransactionById(id);

        await this.prismaService.user.update({
            where: { id: ratingTransaction.userId },
            data: {
                rating: {
                    decrement: ratingTransaction.delta
                }
            }
        });

        await this.prismaService.ratingTransaction.delete({
            where: { id }
        });
    }
}
