interface DocumentDetailsDto {
  documentType: string;
  documentNumber: string;
  issueDate: Date;
  placeOfIssue: string;
}

interface AreaDetailsDto {
  id: string;
  name: string;
}

interface PositionDetailsDto {
  id: string;
  name: string;
}

interface RoleDetailsDto {
  id: string;
  name: string;
}

export interface UserDetailsDto {
  id: string;
  username: string;
  email: string;
  firstName: string;
  middleName?: string;
  firstSurname: string;
  secondSurname?: string;
  address: string;
  cell: string;
  phone?: string;
  documentDetails: DocumentDetailsDto;
  area: AreaDetailsDto;
  position: PositionDetailsDto;
  dateOfBirth: Date;
  placeOfBirth: string;
  roles: RoleDetailsDto[];
  createdAt: Date;
  updatedAt: Date | null;
}
