import { ApiProperty } from '@nestjs/swagger';

export class FilterInfoDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;
}

export class FiltersListResponseDto {
  @ApiProperty({ type: [FilterInfoDto] })
  filters!: FilterInfoDto[];
}
