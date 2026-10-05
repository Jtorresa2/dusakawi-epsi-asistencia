interface DocumentDetailsDto {
  documentType: string;
  documentNumber: string;
  // issueDate y placeOfIssue son opcionales: no llegan del ERP para los
  // empleados importados y se dejan en null en vez de inventar el dato.
  issueDate: Date | null;
  placeOfIssue: string | null;
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
