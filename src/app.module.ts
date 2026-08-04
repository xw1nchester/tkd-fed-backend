import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

import { AdminModule } from './admin/admin.module';
import { AgeCategoryModule } from './age-category/age-category.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BeltModule } from './belt/belt.module';
import { BeltAttestationModule } from './belt-attestation/belt-attestation.module';
import { CodeModule } from './code/code.module';
import { FileModule } from './file/file.module';
import { InviteTokenModule } from './invite-token/invite-token.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';
import { RoleService } from './role/role.service';
import { SportRankModule } from './sport-rank/sport-rank.module';
import { TeamModule } from './team/team.module';
import { TournamentModule } from './tournament/tournament.module';
import { UserModule } from './user/user.module';
import { WeightCategoryModule } from './weight-category/weight-category.module';
import { S3Module } from '@s3/s3.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        UserModule,
        MailModule,
        CodeModule,
        AdminModule,
        RoleModule,
        InviteTokenModule,
        TeamModule,
        BeltModule,
        SportRankModule,
        FileModule,
        TournamentModule,
        BeltAttestationModule,
        AgeCategoryModule,
        WeightCategoryModule,
        S3Module
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        RoleService
    ]
})
export class AppModule {}
