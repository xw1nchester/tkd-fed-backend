import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "@user/dto/user-response.dto";

export class TokenResponseDto {
    @ApiProperty({
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzY0MTY5NDkyLCJleHAiOjE3NjQxNjk3OTJ9.Kh8qZxD9zXhP2bU2kjJ8b_RtV2gOoPDr2mPjLq7aB7E'
    })
    accessToken: string;
}

export class AuthResponseDto extends TokenResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}