export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type CreateOrganizationDto = {
  name: string;

  workingHours: {
    start: string;
    end: string;
  };

  weekOff: WeekDay[];
};

export interface OrganizationEntity {
  id: string;
  name: string;
  workingStartTime: string;
  workingEndTime: string;
  workingHours?: {
    start: string;
    end: string;
  };
  weekOff: WeekDay[];
  createdAt?: string;
  updatedAt?: string;
}
